import {money} from '../integrations/money.js';
// Explicitly fabricated accounting inputs. No inferred real-world VAT, fee or FX rules.
export function profitDemo(data) {
 const costs=[],lines=[],advertising=[],overhead=[];
 const amount=cents=>money((cents/100).toFixed(2));
 for(const a of data.accounts){
  const listings=data.listings.filter(l=>l.account_id===a.id),factor=a.currency==='PLN'?4:1;
  for(const s of data.marketplace_skus.filter(s=>s.account_id===a.id)){
   const i=listings.findIndex(l=>l.id===s.listing_id);
   costs.push({accountId:a.id,sku:s.sku,currency:a.currency,validFrom:'2026-01-01',validTo:null,purchase:amount((5800+Math.floor(i/3)*2100)*factor),fulfillment:amount(850*factor),packaging:amount(150*factor),inbound:amount(200*factor),duty:amount(100*factor),special:'0.000000',fulfillmentSource:a.marketplace==='amazon'&&s.fulfillment==='FBA'?'marketplace':'manual',note:'Erfundene Demo-Kosten, netto je Einheit'});
  }
  for(const f of data.listing_daily.filter(f=>listings.some(l=>l.id===f.listing_id))){
   const skus=data.marketplace_skus.filter(s=>s.listing_id===f.listing_id),s=skus[Number(f.date.slice(-2))%skus.length];
   // Uniform fictitious 19% for demonstrating explicit tax amounts, NOT actual country taxation.
   const revenue=Math.round(f.revenue_cents/1.19),refund=Math.round(f.refund_cents/1.19);
   const fee=Math.round((revenue-refund)*({amazon:.15,ebay:.12,otto:.17,kaufland:.13}[a.marketplace]));
   lines.push({id:`DEMO-ORDER-${f.listing_id}-${f.date}/1`,orderId:`DEMO-ORDER-${f.listing_id}-${f.date}`,accountId:a.id,listingId:f.listing_id,sku:s.sku,currency:a.currency,date:f.date,units:f.units,revenueNet:amount(revenue),refundNet:amount(refund),marketplaceFeesNet:amount(fee),fulfillmentNet:a.marketplace==='amazon'&&s.fulfillment==='FBA'?amount(f.units*750*factor):null,feesComplete:true,inventoryCreditNet:'0.000000',source:'synthetic-settlement'});
   const ads=data.ad_spend.filter(x=>x.listing_id===f.listing_id&&x.date===f.date);
   advertising.push({accountId:a.id,listingId:f.listing_id,date:f.date,currency:a.currency,netAmount:ads.length?amount(ads.reduce((n,x)=>n+x.spend_cents,0)):null});
  }
  for(let d=1;d<=30;d++){const date=`2026-09-${String(d).padStart(2,'0')}`,ads=data.ad_spend.filter(x=>x.account_id===a.id&&!x.listing_id&&x.date===date);overhead.push({accountId:a.id,date,currency:a.currency,netAmount:ads.length?amount(ads.reduce((n,x)=>n+x.spend_cents,0)):null});}
 }
 return {costs,lines,advertising,overhead};
}
