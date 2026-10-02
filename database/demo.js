import assortment from '../catalog/assortment.json' with { type: 'json' };

export { assortment };
export function demoData() {
  const products = assortment.models.map(model => ({
    id: model.id, internal_sku: `DEMO-PRODUCT-${model.id}`, name: model.name,
  }));
  const accounts = [{ id: 'amazon-de', marketplace: 'amazon', region: 'DE', currency: 'EUR', name: 'Amazon Deutschland · Demo' }];
  // Only confirmed variants get synthetic listings. This is NOT a real Amazon mapping.
  const listings = assortment.variants.map((variant, i) => {
    const model = assortment.models.find(m => m.id === variant.model_id);
    const brand = assortment.brands.find(b => b.id === model.brand_id);
    return { id: `demo-${variant.id}`, account_id: 'amazon-de', product_id: model.id,
      external_id: `DEMO-ASIN-${String(i + 1).padStart(3, '0')}`, title: `${brand.name} ${model.name} · ${variant.color}` };
  });
  const marketplace_skus = listings.map((l, i) => ({ id: `sku-${i}`, account_id: 'amazon-de', listing_id: l.id,
    sku: `DEMO-SKU-${String(i + 1).padStart(3, '0')}-FBA`, fulfillment: 'FBA' }));
  marketplace_skus.push({ id: 'sku-first-fbm', account_id: 'amazon-de', listing_id: listings[0].id, sku: 'DEMO-SKU-001-FBM', fulfillment: 'FBM' });
  const listing_daily = [], rating_snapshots = [], ad_spend = [];
  for (let day = 1; day <= 30; day++) {
    const date = `2026-09-${String(day).padStart(2, '0')}`;
    for (const [i, listing] of listings.entries()) {
      const units = 4 + i % 5 + day % 5;
      const price = 14900 + Math.floor(i / 3) * 5000; // Synthetic, not actual prices.
      const refunded = day % (5 + i) === 0 ? 2 : 0;
      listing_daily.push({ listing_id: listing.id, date, sessions: (90 + i * 7) + day % 7 * 8, units, revenue_cents: units * price, refunded_units: refunded, refund_cents: refunded * price, source: 'synthetic-demo' });
      for (const [type, cost] of [['SP', (850 + i * 70)], ['SB', 320 + i * 60], ['SD', 180 + i * 30]]) {
        const id = `${date}-${listing.id}-${type}`;
        ad_spend.push({ id, account_id: 'amazon-de', listing_id: listing.id, date, ad_type: type, spend_cents: cost + day % 3 * 25, source: 'synthetic-demo', source_row_id: id, unassigned_reason: null });
      }
    }
    for (const [type, cost] of [['SB', 700], ['SD', 250], ['STV', 1100]]) {
      const id = `${date}-unassigned-${type}`;
      ad_spend.push({ id, account_id: 'amazon-de', listing_id: null, date, ad_type: type, spend_cents: cost, source: 'synthetic-demo', source_row_id: id, unassigned_reason: 'Kein eindeutiger ASIN-Bezug im Quellbericht' });
    }
  }
  for (const [i, listing] of listings.entries()) {
    for (const day of [15, 30]) rating_snapshots.push({ listing_id: listing.id, date: `2026-09-${day}`, rating: i === 3 ? null : [4.6, 4.4, 4.7][i % 3], rating_count: i === 3 ? null : 80 + i * 19 + (day === 30 ? 8 : 0), source: 'synthetic-demo' });
  }
  return { products, accounts, listings, marketplace_skus, listing_daily, rating_snapshots, ad_spend };
}
