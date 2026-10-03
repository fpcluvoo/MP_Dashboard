import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { demoData } from '../../database/demo.js';

test('schema preserves relations, rejects duplicate imports and prevents account-crossing SKU assignments', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync(new URL('../../database/schema.sql', import.meta.url), 'utf8'));
    for (const [table, rows] of Object.entries(demoData())) {
      const columns = Object.keys(rows[0]);
      const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
      for (const row of rows) stmt.run(...columns.map(c => row[c]));
    }
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM listing_daily').get().n, 6480);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM marketplace_skus').get().n, 228);
    assert.throws(() => db.exec("INSERT INTO listings VALUES ('invalid','amazon-de','missing','B0NEW00001','Invalid')"), /FOREIGN KEY/);
    assert.throws(() => db.exec("INSERT INTO marketplace_skus VALUES ('duplicate','amazon-de','amazon-de-demo-clouvou-smart-seat-black','DEMO-SKU-001-FBA','FBA')"), /UNIQUE/);
    db.exec("INSERT INTO accounts VALUES ('amazon-test','amazon','FR','EUR','Other account')");
    assert.throws(() => db.exec("INSERT INTO marketplace_skus VALUES ('cross','amazon-test','amazon-de-demo-clouvou-smart-seat-black','NEW','FBA')"), /FOREIGN KEY/);
    assert.throws(() => db.exec("INSERT INTO ad_spend SELECT 'duplicate',account_id,listing_id,date,ad_type,spend_cents,source,source_row_id,unassigned_reason FROM ad_spend LIMIT 1"), /UNIQUE/);
    assert.throws(() => db.exec("INSERT INTO ad_spend VALUES ('bad','amazon-de',NULL,'2026-09-01','SP',100,'test','bad',NULL)"), /CHECK/);
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  } finally { db.close(); }
});
