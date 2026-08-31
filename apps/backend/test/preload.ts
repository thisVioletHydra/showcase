import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'showcase-backend-test-'));
process.env.DB_PATH = path.join(dir, 'test.db');
process.env.ADMIN_TOKEN = 'test-admin';
process.env.PORT = String(3200 + Math.floor(Math.random() * 400));

globalThis.__SHOWCASE_TEST_DIR = dir;
