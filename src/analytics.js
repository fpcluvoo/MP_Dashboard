export const adTypes = { SP: 'Sponsored Products', SB: 'Sponsored Brands', SD: 'Sponsored Display', STV: 'Streaming TV', OTHER: 'Sonstige' };
export const ratio = (a, b) => a == null || b == null || b === 0 ? null : a / b;
const fields = ['sessions', 'units', 'revenue_cents', 'refunded_units', 'refund_cents'];
// Never turn missing reports into zero, or average daily percentage values.
export function summarize(rows) {
  const sums = Object.fromEntries(fields.map(field => [field, rows.length && rows.every(r => r[field] != null) ? rows.reduce((n, r) => n + r[field], 0) : null]));
  return { ...sums, conversion: ratio(sums.units, sums.sessions), refundRate: ratio(sums.refunded_units, sums.units) };
}
export function analytics(data, { start, end, productId = 'all', query = '' }) {
  const inPeriod = r => r.date >= start && r.date <= end;
  const account = data.accounts.find(a => a.id === data.accountId);
  const listings = data.listings.filter(l => l.account_id === account.id);
  const periodAds = data.ad_spend.filter(a => a.account_id === account.id && inPeriod(a));
  const needle = query.toLocaleLowerCase('de-DE').trim();
  const rows = listings.map(listing => {
    const product = data.products.find(p => p.id === listing.product_id);
    const skus = data.marketplace_skus.filter(s => s.listing_id === listing.id);
    const facts = data.listing_daily.filter(r => r.listing_id === listing.id && inPeriod(r));
    const expectedDays = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
    if (new Set(facts.map(r => r.date)).size !== expectedDays) facts.push({});
    const rating = data.rating_snapshots.filter(r => r.listing_id === listing.id && r.date <= end).sort((a,b) => b.date.localeCompare(a.date))[0] ?? null;
    const ads = periodAds.filter(a => a.listing_id === listing.id);
    return { ...listing, product, skus, rating, metrics: summarize(facts), ads };
  }).filter(l => (productId === 'all' || l.product_id === productId) && [l.title, l.external_id, l.product.name, l.product.internal_sku, ...l.skus.map(s => s.sku)].join(' ').toLocaleLowerCase('de-DE').includes(needle));
  const assigned = rows.flatMap(r => r.ads);
  const unassigned = periodAds.filter(a => a.listing_id == null);
  const sumSpend = ads => ads.reduce((sum, a) => sum + a.spend_cents, 0);
  return {
    account, rows, metrics: summarize(rows.map(r => r.metrics)),
    assignedSpend: sumSpend(assigned), unassignedSpend: sumSpend(unassigned), accountSpend: sumSpend(periodAds),
    adBreakdown: Object.entries(adTypes).map(([type, name]) => ({ type, name,
      assigned: assigned.some(a => a.ad_type === type) ? sumSpend(assigned.filter(a => a.ad_type === type)) : null,
      unassigned: unassigned.some(a => a.ad_type === type) ? sumSpend(unassigned.filter(a => a.ad_type === type)) : null,
    })),
  };
}
