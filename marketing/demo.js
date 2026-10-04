// One synthetic account/day record. Includes assigned AND unassigned spend exactly once.
export function marketingDemo(data) {
 const listingAccount=new Map(data.listings.map(l=>[l.id,l.account_id]));
 const sales=new Map(),spend=new Map();
 for(const r of data.listing_daily){const key=`${listingAccount.get(r.listing_id)}/${r.date}`;sales.set(key,(sales.get(key)??0)+r.revenue_cents);}
 for(const r of data.ad_spend){const key=`${r.account_id}/${r.date}`;spend.set(key,(spend.get(key)??0)+r.spend_cents);}
 return data.accounts.flatMap(a=>[...new Set(data.listing_daily.map(r=>r.date))].sort().map(date=>{
  const i=Number(date.slice(-2))-1,key=`${a.id}/${date}`,known=spend.has(key),cost=spend.get(key)??null;
  return {accountId:a.id,date,currency:a.currency,spendCents:cost,salesCents:sales.get(key)??null,adSalesCents:known?Math.round(cost*(3.2+(i%5)*.3)):null,
   spendComplete:known,salesComplete:sales.has(key),adSalesComplete:known,attributionKey:known?'synthetic-14d-click-same-product-order-date':null,salesBasis:'gross-ordered-sales-before-refunds',adSalesBasis:'gross-ordered-sales-before-refunds',source:'synthetic-demo'};
 }));
}
