import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from './config.js';
import { initSchema } from './schema.js';
let dbInstance = null;
export function getDb() {
    if (dbInstance) {
        return dbInstance;
    }
    fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
    const db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    dbInstance = db;
    return db;
}
export function closeDb() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
