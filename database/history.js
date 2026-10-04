// Isolated synthetic comparison period. Existing September data is preserved exactly.
export function withDemoHistory(data) {
 const keys=['listing_daily','traffic_daily','rating_snapshots','ad_spend'];
 const out={...data,...Object.fromEntries(keys.map(k=>[k,[...data[k]]]))};
 const modelIndex=new Map(data.products.map((p,i)=>[p.id,i]));
 const listingModel=new Map(data.listings.map(l=>[l.id,modelIndex.get(l.product_id)]));
 const factors=[1.25,.72,1.08,.82,1.18,.95];
 for(let day=1;day<=31;day++){
  const date=`2026-08-${String(day).padStart(2,'0')}`,source=`2026-09-${String(Math.min(day,30)).padStart(2,'0')}`;
  const counts=new Map();
  for(const r of data.listing_daily.filter(r=>r.date===source)){
   const factor=factors[listingModel.get(r.listing_id)%factors.length],units=Math.max(1,Math.round(r.units*factor));counts.set(r.listing_id,units);
   out.listing_daily.push({...r,date,units,revenue_cents:Math.round(r.revenue_cents/r.units*units),sessions:r.sessions==null?null:Math.round(r.sessions*(factor*.9+.15)),refunded_units:day%11===0?1:0,refund_cents:day%11===0?Math.round(r.revenue_cents/r.units):0});
  }
  for(const r of data.traffic_daily.filter(r=>r.date===source))out.traffic_daily.push({...r,date,page_views:r.page_views==null?null:Math.round(r.page_views*1.08),transactions:r.transactions==null?null:Math.max(1,counts.get(r.listing_id)-1)});
  for(const r of data.ad_spend.filter(r=>r.date===source))out.ad_spend.push({...r,id:`history-${date}-${r.id}`,source_row_id:`history-${date}-${r.source_row_id}`,date,spend_cents:Math.round(r.spend_cents*(r.listing_id?(listingModel.get(r.listing_id)%2?.85:1.12):.9))});
 }
 for(const r of data.rating_snapshots.filter(r=>r.date==='2026-09-15'))out.rating_snapshots.push({...r,date:'2026-08-31',rating_count:r.rating_count==null?null:Math.max(0,r.rating_count-10)});
 return out;
}
