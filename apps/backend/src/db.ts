import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';

import { config } from '#config';
import { initSchema } from '#schema';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
    db = new Database(config.dbPath);
    initSchema(db);
  }

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
