import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function readSecret(name: string, fallback: string): string {
  const value = process.env[name];
  if (value) {
    return value;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production`);
  }
  return fallback;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  adminToken: readSecret('ADMIN_TOKEN', 'dev-admin-token'),
  webhookSecret: readSecret('WEBHOOK_SECRET', 'dev-webhook-secret'),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  dbPath: process.env.DB_PATH ?? path.resolve(moduleDir, '../data/showcase.db'),
  specsDir: path.resolve(moduleDir, '../../../specs'),
  webhookPollMs: 2000,
  supplierTimeoutMs: 5000,
};
