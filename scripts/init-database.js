import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
mkdirSync(new URL('.data/', root), { recursive: true });
const db = new DatabaseSync(fileURLToPath(new URL('.data/catalog.sqlite', root)));
try {
  db.exec(readFileSync(new URL('database/schema.sql', root), 'utf8'));
  console.log('Local catalog database initialized without demo data. Not exported to the website.');
} finally { db.close(); }
