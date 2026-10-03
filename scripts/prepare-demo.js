import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { demoData, assortment } from '../database/demo.js';

const root = new URL('../', import.meta.url);
mkdirSync(new URL('.data/', root), { recursive: true });
mkdirSync(new URL('src/data/', root), { recursive: true });
// This database is exclusively synthetic. Never point this builder at a production DB.
const db = new DatabaseSync(fileURLToPath(new URL('.data/demo-direct-channels-v1.sqlite', root)));
try {
  db.exec(readFileSync(new URL('database/schema.sql', root), 'utf8'));
  db.exec('BEGIN');
  const tables = demoData();
  for (const [table, rows] of Object.entries(tables)) {
    const columns = Object.keys(rows[0]);
    const insert = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')}) ON CONFLICT DO NOTHING`);
    for (const row of rows) insert.run(...columns.map(c => row[c]));
  }
  db.exec('COMMIT');
  const data = Object.fromEntries(Object.keys(tables).map(table => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
  writeFileSync(new URL('src/data/demo.generated.json', root), JSON.stringify({ mode: 'demo', catalog: assortment, accountId: 'amazon-de', start: '2026-09-01', end: '2026-09-30', ...data }));
  console.log(`Demo database ready: ${data.products.length} products, ${data.listings.length} ASINs, ${data.marketplace_skus.length} SKUs. Synthetic snapshot exported.`);
} finally { db.close(); }
