import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const config = {
    port: Number(process.env.PORT ?? 3000),
    adminToken: process.env.ADMIN_TOKEN ?? 'dev-admin-token',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    dbPath: process.env.DB_PATH ?? path.resolve(moduleDir, '../data/showcase.db'),
    specsDir: path.resolve(moduleDir, '../../../specs'),
    webhookPollMs: 2000,
    supplierTimeoutMs: 5000,
};
