import fs from 'node:fs';
import path from 'node:path';

import type Database from 'better-sqlite3';

import { config } from './config';
import type { Product, Promocode } from './types';

interface ProductsSpec {
  products: Product[];
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

export function seedDatabase(db: Database.Database): void {
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number };
  if (productCount.count > 0) {
    return;
  }

  const productsSpec = readJson<ProductsSpec>('products.json');
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
      insertProduct.run(product);
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
