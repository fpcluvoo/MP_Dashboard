import {micros,decimal} from '../integrations/money.js';
export function euroRate(rates,currency,date) {
 if(currency==='EUR')return '1.000000';
 const found=rates.filter(r=>r.currency===currency&&r.date===date&&r.target==='EUR');
 if(found.length!==1||micros(found[0].rate)<=0n)return null;return found[0].rate;
}
export function toEuro(value,currency,date,rates) {
 if(value==null)return null;const rate=euroRate(rates,currency,date);if(rate==null)return null;
 const n=micros(value)*micros(rate),half=n<0n?-500000n:500000n;
 return decimal((n+half)/1000000n);
}
export function euroDemo(data) {
 return [...new Set(data.listing_daily.map(r=>r.date))].sort().flatMap(date=>Object.entries({GBP:1.17,USD:.90,PLN:.23}).map(([currency,base])=>({date,currency,target:'EUR',rate:(base+((Number(date.slice(-2))-1)%5-2)*.0001).toFixed(6),source:'synthetic-demo',label:'Erfundener Demo-Tageskurs · keine Marktnotierung'})));
}
export function euroData(data) {
 const account=id=>data.accounts.find(a=>a.id===id);
 const listing=id=>data.listings.find(l=>l.id===id);
 const cents=(n,a,date)=>{const v=toEuro(n==null?null:(n/100).toFixed(2),a.currency,date,data.fx);return v==null?null:Number(v)*100;};
 return {...data,accounts:data.accounts.map(a=>({...a,currency:'EUR'})),
  listing_daily:data.listing_daily.map(r=>({...r,revenue_cents:cents(r.revenue_cents,account(listing(r.listing_id).account_id),r.date),refund_cents:cents(r.refund_cents,account(listing(r.listing_id).account_id),r.date)})),
  ad_spend:data.ad_spend.map(r=>({...r,spend_cents:cents(r.spend_cents,account(r.account_id),r.date)}))};
}
