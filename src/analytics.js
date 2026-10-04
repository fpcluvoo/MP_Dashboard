export const adTypes = { SP: 'Sponsored Products', SB: 'Sponsored Brands', SD: 'Sponsored Display', STV: 'Streaming TV', OTHER: 'Sonstige' };
export const ratio = (a, b) => a == null || b == null || b === 0 ? null : a / b;
const fields = ['sessions', 'units', 'revenue_cents', 'refunded_units', 'refund_cents', 'page_views', 'transactions'];
// Never turn missing reports into zero, or average daily percentage values.
export function summarize(rows) {
  const sums = Object.fromEntries(fields.map(field => [field, rows.length && rows.every(r => r[field] != null) ? rows.reduce((n, r) => n + r[field], 0) : null]));
  return { ...sums, conversion: ratio(sums.units, sums.sessions), refundRate: ratio(sums.refunded_units, sums.units), transactionViewRate: ratio(sums.transactions,sums.page_views) };
}
export function analytics(data, { start, end, productId = 'all', brandId = 'all', categoryId = 'all', query = '', accountId = data.accountId, accountIds = [accountId] }) {
  const traffic=new Map((data.traffic_daily??[]).map(t=>[`${t.listing_id}/${t.date}`,t]));
  const inPeriod = r => r.date >= start && r.date <= end;
  const selectedAccounts=data.accounts.filter(a=>accountIds.includes(a.id));
  if(!selectedAccounts.length)throw new Error('No account selected');
  if(new Set(selectedAccounts.map(a=>a.currency)).size>1)throw new Error('Convert currencies before combining accounts');
  const account = selectedAccounts.length===1?selectedAccounts[0]:{id:'combined',currency:selectedAccounts[0].currency,marketplace:selectedAccounts.every(a=>a.marketplace==='amazon')?'amazon':'mixed'};
  const listings = data.listings.filter(l => accountIds.includes(l.account_id));
  const periodAds = data.ad_spend.filter(a => accountIds.includes(a.account_id) && inPeriod(a));
  const needle = query.toLocaleLowerCase('de-DE').trim();
  const rows = listings.map(listing => {
    const product = { ...data.products.find(p => p.id === listing.product_id), ...data.catalog?.models.find(p => p.id === listing.product_id) };
    const skus = data.marketplace_skus.filter(s => s.listing_id === listing.id);
    const facts = data.listing_daily.filter(r => r.listing_id === listing.id && inPeriod(r)).map(r=>({...r,...traffic.get(`${r.listing_id}/${r.date}`)}));
    const expectedDays = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
    if (new Set(facts.map(r => r.date)).size !== expectedDays) facts.push({});
    const rating = data.rating_snapshots.filter(r => r.listing_id === listing.id && r.date <= end).sort((a,b) => b.date.localeCompare(a.date))[0] ?? null;
    const ads = periodAds.filter(a => a.listing_id === listing.id);
    return { ...listing, product, skus, rating, metrics: summarize(facts), ads };
  }).filter(l => (productId === 'all' || l.product_id === productId) && (brandId === 'all' || l.product.brand_id === brandId) && (categoryId === 'all' || l.product.category_id === categoryId) && [l.title, l.external_id, l.product.name, l.product.internal_sku, ...l.skus.map(s => s.sku)].join(' ').toLocaleLowerCase('de-DE').includes(needle));
  const assigned = rows.flatMap(r => r.ads);
  const unassigned = periodAds.filter(a => a.listing_id == null);
  const sumSpend = ads => ads.some(a=>a.spend_cents==null)?null:ads.reduce((sum, a) => sum + a.spend_cents, 0);
  return {
    account, rows, metrics: summarize(rows.map(r => r.metrics)),
    assignedSpend: rows.length && assigned.length ? sumSpend(assigned) : null, unassignedSpend: unassigned.length ? sumSpend(unassigned) : null, accountSpend: periodAds.length ? sumSpend(periodAds) : null,
    adBreakdown: Object.entries(adTypes).map(([type, name]) => ({ type, name,
      assigned: assigned.some(a => a.ad_type === type) ? sumSpend(assigned.filter(a => a.ad_type === type)) : null,
      unassigned: unassigned.some(a => a.ad_type === type) ? sumSpend(unassigned.filter(a => a.ad_type === type)) : null,
    })),
  };
}
