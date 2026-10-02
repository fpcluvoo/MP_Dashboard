export function demoData() {
  const products = [
    { id: 'p-audio', internal_sku: 'MP-AUDIO-01', name: 'Studio Kopfhörer' },
    { id: 'p-light', internal_sku: 'MP-LIGHT-01', name: 'Desk Light' },
    { id: 'p-cup', internal_sku: 'MP-HOME-01', name: 'Keramikbecher' },
  ];
  const accounts = [{ id: 'amazon-de', marketplace: 'amazon', region: 'DE', currency: 'EUR', name: 'Amazon Deutschland · Demo' }];
  const listings = [
    { id: 'l-audio-black', account_id: 'amazon-de', product_id: 'p-audio', external_id: 'B0DEMO0001', title: 'Studio Kopfhörer · Schwarz' },
    { id: 'l-audio-white', account_id: 'amazon-de', product_id: 'p-audio', external_id: 'B0DEMO0002', title: 'Studio Kopfhörer · Weiß' },
    { id: 'l-light', account_id: 'amazon-de', product_id: 'p-light', external_id: 'B0DEMO0003', title: 'Desk Light · Salbei' },
    { id: 'l-cup', account_id: 'amazon-de', product_id: 'p-cup', external_id: 'B0DEMO0004', title: 'Keramikbecher · Sand' },
  ];
  const marketplace_skus = listings.map((l, i) => ({ id: `sku-${i}`, account_id: 'amazon-de', listing_id: l.id, sku: ['AUDIO-BLK-FBA','AUDIO-WHT-FBA','LIGHT-SGE-FBA','CUP-SND-FBA'][i], fulfillment: 'FBA' }));
  marketplace_skus.push({ id: 'sku-audio-fbm', account_id: 'amazon-de', listing_id: 'l-audio-black', sku: 'AUDIO-BLK-FBM', fulfillment: 'FBM' });
  const listing_daily = [], rating_snapshots = [], ad_spend = [];
  for (let day = 1; day <= 30; day++) {
    const date = `2026-09-${String(day).padStart(2, '0')}`;
    for (const [i, listing] of listings.entries()) {
      const units = [12, 8, 10, 15][i] + day % 5;
      const price = [7990, 7990, 4950, 2400][i];
      const refunded = day % (5 + i) === 0 ? 2 : 0;
      listing_daily.push({ listing_id: listing.id, date, sessions: [180, 145, 160, 190][i] + day % 7 * 8, units, revenue_cents: units * price, refunded_units: refunded, refund_cents: refunded * price, source: 'synthetic-demo' });
      for (const [type, cost] of [['SP', [1850, 1200, 1450, 650][i]], ['SB', 320 + i * 60], ['SD', 180 + i * 30]]) {
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
    for (const day of [15, 30]) rating_snapshots.push({ listing_id: listing.id, date: `2026-09-${day}`, rating: i === 3 ? null : [4.6, 4.4, 4.7][i], rating_count: i === 3 ? null : [328, 186, 94][i] + (day === 30 ? 8 : 0), source: 'synthetic-demo' });
  }
  return { products, accounts, listings, marketplace_skus, listing_daily, rating_snapshots, ad_spend };
}
