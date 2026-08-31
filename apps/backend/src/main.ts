import http from 'node:http';
import process from 'node:process';

import { config } from '#config.js';
import { getDb, closeDb } from '#db.js';
import { seedDatabase } from '#seed.js';
import {
  parseQuery,
  readJsonBody,
  sendError,
} from '#http/router.js';
import { createAppRouter } from '#routes/index.js';
import { processPendingWebhooks } from '#services/webhook.service.js';

function applyCors(res: http.ServerResponse, origin: string | undefined): void {
  const allowed = config.corsOrigin === '*'
    ? (origin ?? '*')
    : config.corsOrigin;

  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const router = createAppRouter();

const server = http.createServer(async (req, res) => {
  applyCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const host = req.headers.host ?? `127.0.0.1:${config.port}`;
    const url = new URL(req.url ?? '/', `http://${host}`);
    const matched = router.match(req.method ?? 'GET', url.pathname);

    if (!matched) {
      sendError(res, 404, 'Not found');
      return;
    }

    const body = req.method === 'GET' || req.method === 'OPTIONS'
      ? {}
      : await readJsonBody(req);

    const apiRequest = {
      method: req.method ?? 'GET',
      path: url.pathname,
      params: matched.params,
      query: parseQuery(url),
      body,
      headers: req.headers,
    };

    await matched.handler(apiRequest, res);
  } catch (error) {
    console.error('Request failed:', error);
    if (!res.headersSent) {
      sendError(res, 500, 'Internal server error');
    }
  }
});

const db = getDb();
seedDatabase(db);

const inboxTimer = setInterval(() => {
  try {
    processPendingWebhooks();
  } catch (error) {
    console.error('Webhook inbox poll failed:', error);
  }
}, config.webhookPollMs);

server.listen(config.port, () => {
  console.log(`Backend listening on http://127.0.0.1:${config.port}`);
});

process.on('SIGINT', () => {
  clearInterval(inboxTimer);
  server.close();
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(inboxTimer);
  server.close();
  closeDb();
  process.exit(0);
});
