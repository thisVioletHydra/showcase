import fs from 'node:fs';
import path from 'node:path';

import type Database from 'better-sqlite3';

import { config } from './config';
import type { Product, ProductType, Promocode } from './types';

interface SeedProduct extends Product {
  stock?: number;
}

interface ProductsSpec {
  products: SeedProduct[];
}

interface KeysSpec {
  keys: string[];
}

interface PromocodesSpec {
  promocodes: Array<{
    code: string;
    type: 'percent' | 'amount';
    value: number;
    currency?: string;
    max_uses: number;
  }>;
}

function readJson<T>(filename: string): T {
  const filePath = path.join(config.specsDir, filename);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function defaultStock(type: ProductType): number {
  return type === 'topup' ? 20 : 5;
}

function stockFor(product: SeedProduct): number {
  if (typeof product.stock === 'number' && Number.isFinite(product.stock) && product.stock >= 0) {
    return Math.floor(product.stock);
  }

  return defaultStock(product.type);
}

function seedInventory(db: Database.Database, products: SeedProduct[]): void {
  const unitCount = db.prepare('SELECT COUNT(*) AS count FROM inventory_units').get() as { count: number };
  if (unitCount.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const insertUnit = db.prepare(`
    INSERT INTO inventory_units (sku, status, created_at, updated_at)
    VALUES (?, 'available', ?, ?)
  `);

  const fill = db.transaction(() => {
    for (const product of products) {
      const stock = stockFor(product);
      for (let i = 0; i < stock; i += 1) {
        insertUnit.run(product.sku, now, now);
      }
    }
  });

  fill();
}

export function seedDatabase(db: Database.Database): void {
  const productsSpec = readJson<ProductsSpec>('products.json');
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number };

  if (productCount.count === 0) {
    const keysSpec = readJson<KeysSpec>('keys.json');
    const promocodesSpec = readJson<PromocodesSpec>('promocodes.json');

    const insertProduct = db.prepare(`
      INSERT INTO products (sku, name, type, price, currency, image)
      VALUES (@sku, @name, @type, @price, @currency, @image)
    `);

    const insertKey = db.prepare(`
      INSERT INTO key_pool (code, status)
      VALUES (@code, 'available')
    `);

    const insertPromocode = db.prepare(`
      INSERT INTO promocodes (code, type, value, currency, max_uses, used_count)
      VALUES (@code, @type, @value, @currency, @max_uses, 0)
    `);

    const seedAll = db.transaction(() => {
      for (const product of productsSpec.products) {
        insertProduct.run({
          sku: product.sku,
          name: product.name,
          type: product.type,
          price: product.price,
          currency: product.currency,
          image: product.image,
        });
      }

      for (const code of keysSpec.keys) {
        insertKey.run({ code });
      }

      for (const promo of promocodesSpec.promocodes) {
        const row: Promocode = {
          code: promo.code,
          type: promo.type,
          value: promo.value,
          currency: promo.currency ?? null,
          max_uses: promo.max_uses,
          used_count: 0,
        };
        insertPromocode.run(row);
      }
    });

    seedAll();
  }

  seedInventory(db, productsSpec.products);
}
