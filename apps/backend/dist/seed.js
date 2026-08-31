import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
function readJson(filename) {
    const filePath = path.join(config.specsDir, filename);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}
export function seedDatabase(db) {
    const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get();
    if (productCount.count > 0) {
        return;
    }
    const productsSpec = readJson('products.json');
    const keysSpec = readJson('keys.json');
    const promocodesSpec = readJson('promocodes.json');
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
            const row = {
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
