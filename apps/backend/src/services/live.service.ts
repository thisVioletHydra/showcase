import type { ServerResponse } from 'node:http';

import { getDb } from '../db';
import type { CatalogSnapshot } from '../types';
import { expireStaleReservations } from './inventory.service';
import { listCatalogProducts } from './products.service';

const HEARTBEAT_MS = 15_000;

const clients = new Set<ServerResponse>();
let lastSnapshot: CatalogSnapshot | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

export function buildCatalogSnapshot(): CatalogSnapshot {
  return {
    at: nowIso(),
    products: listCatalogProducts(),
  };
}

export function publishCatalog(): CatalogSnapshot {
  const db = getDb();
  if (!db.inTransaction) {
    expireStaleReservations(db);
  }

  const snapshot = buildCatalogSnapshot();
  lastSnapshot = snapshot;

  for (const res of [...clients]) {
    if (!writeSnapshot(res, snapshot)) {
      dropClient(res);
    }
  }

  return snapshot;
}

export function getLastCatalogSnapshot(): CatalogSnapshot | null {
  return lastSnapshot;
}

function writeRaw(res: ServerResponse, chunk: string): boolean {
  try {
    if (res.writableEnded || res.destroyed) {
      return false;
    }

    res.write(chunk);
    return true;
  } catch {
    return false;
  }
}

function writeSnapshot(res: ServerResponse, snapshot: CatalogSnapshot): boolean {
  return writeRaw(
    res,
    `event: snapshot\nid: ${snapshot.at}\ndata: ${JSON.stringify(snapshot)}\n\n`,
  );
}

function dropClient(res: ServerResponse): void {
  clients.delete(res);
  if (res.writableEnded || res.destroyed) {
    return;
  }

  try {
    res.end();
  } catch {
    // already closed
  }
}

function ensureHeartbeat(): void {
  if (heartbeatTimer !== null) {
    return;
  }

  heartbeatTimer = setInterval(() => {
    if (clients.size === 0) {
      return;
    }

    for (const res of [...clients]) {
      if (!writeRaw(res, ': ping\n\n')) {
        dropClient(res);
      }
    }
  }, HEARTBEAT_MS);

  if (typeof heartbeatTimer.unref === 'function') {
    heartbeatTimer.unref();
  }
}

export function attachCatalogStream(res: ServerResponse): void {
  const snapshot = publishCatalog();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const socket = res.socket;
  if (socket) {
    socket.setTimeout(0);
    socket.setNoDelay(true);
    socket.setKeepAlive(true);
  }

  writeRaw(res, ': connected\n\n');
  writeSnapshot(res, snapshot);
  clients.add(res);
  ensureHeartbeat();

  const onClose = () => {
    res.off('close', onClose);
    clients.delete(res);
  };

  res.on('close', onClose);
}

export function stopCatalogStream(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  for (const res of [...clients]) {
    dropClient(res);
  }
}
