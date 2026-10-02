import test from 'node:test';
import assert from 'node:assert/strict';
import { analytics, summarize } from '../../src/analytics.js';
import { demoData, assortment } from '../../database/demo.js';
const data = () => ({ ...demoData(), catalog: assortment, accountId: 'amazon-de' });
const period = { start: '2026-09-01', end: '2026-09-30' };

test('ASIN facts are counted once despite multiple SKU mappings; product rollup combines ASINs', () => {
  const report = analytics(data(), period);
  assert.equal(report.rows.length, 18);
  assert.equal(report.metrics.units, 4230); // 18 variants; 30 days * (18 * 6 + sum(i % 5))
  const product = analytics(data(), { ...period, productId: 'clouvou-bright-seat' });
  assert.equal(product.rows.length, 3);
  assert.equal(product.metrics.units, 630);
  assert.equal(product.metrics.revenue_cents, 630 * 14900);
  const sku = analytics(data(), { ...period, query: 'DEMO-SKU-001-FBM' });
  assert.equal(sku.rows.length, 1);
  assert.equal(sku.metrics.units, 180);
});
test('conversion is a weighted quotient and missing/zero denominators remain unknown', () => {
  const a = { sessions: 10, units: 5, revenue_cents: 100, refunded_units: 1, refund_cents: 20 };
  const b = { ...a, sessions: 90, units: 9 };
  assert.equal(summarize([a, b]).conversion, .14);
  assert.equal(summarize([{ ...a, sessions: 0 }]).conversion, null);
  assert.equal(summarize([{ ...a, sessions: null }]).conversion, null);
  assert.equal(summarize([]).units, null);
  assert.equal(summarize([{ ...a, units: 1, refunded_units: 2 }]).refundRate, 2);
});
test('partial dates and partially missing measures are not silently totalled as complete', () => {
  const d = data();
  d.listing_daily.splice(0, 1);
  assert.equal(analytics(d, period).metrics.units, null);
  const d2 = data();
  d2.listing_daily[0].sessions = null;
  const report = analytics(d2, period);
  assert.equal(report.metrics.sessions, null);
  assert.equal(report.metrics.conversion, null);
  assert.equal(report.metrics.units, 4230);
});
test('assigned + unassigned reconciles to account spend and product filters never allocate overhead', () => {
  const d = data();
  const all = analytics(d, period);
  const filtered = analytics(d, { ...period, productId: 'clouvou-smart-seat' });
  assert.equal(all.assignedSpend + all.unassignedSpend, all.accountSpend);
  assert.equal(all.unassignedSpend, 30 * (700 + 250 + 1100));
  assert.equal(filtered.unassignedSpend, all.unassignedSpend);
  assert.equal(filtered.accountSpend, all.accountSpend);
  assert.ok(filtered.assignedSpend < all.assignedSpend);
  const tv = all.adBreakdown.find(a => a.type === 'STV');
  assert.equal(tv.assigned, null);
  assert.equal(tv.unassigned, 33000);
  assert.equal(all.adBreakdown.find(a => a.type === 'OTHER').assigned, null);
  assert.equal(analytics(d, { start: '2026-09-24', end: period.end }).unassignedSpend, 7 * 2050);
});
test('rating uses most recent snapshot at or before end; missing ratings remain missing', () => {
  const report = analytics(data(), { start: '2026-09-01', end: '2026-09-20' });
  assert.equal(report.rows[0].rating.date, '2026-09-15');
  assert.equal(report.rows[0].rating.rating_count, 80);
  assert.equal(report.rows[3].rating.rating, null);
  assert.equal(analytics(data(), { start: '2026-09-01', end: '2026-09-10' }).rows[0].rating, null);
});

test('brand/category filters do not generate listings for unconfirmed variants', () => {
  for (const brandId of ['lutivo', 'wintoncove']) {
    const report = analytics(data(), { ...period, brandId });
    assert.equal(report.rows.length, 0);
    assert.equal(report.metrics.units, null);
    assert.equal(report.assignedSpend, null);
  }
  assert.equal(analytics(data(), { ...period, categoryId: 'desks' }).rows.length, 0);
  assert.equal(analytics(data(), { ...period, brandId: 'clouvou', categoryId: 'office-chairs' }).rows.length, 18);
});
