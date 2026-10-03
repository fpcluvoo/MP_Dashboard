import {toEuro} from './fx.js';
import {micros,decimal} from '../integrations/money.js';
import {costAt,costLabels,validateSchedule,isoDay} from './costs.js';
const sum=values=>values.some(v=>v==null)?null:decimal(values.reduce((s,v)=>s+micros(v),0n));
const minus=(a,...b)=>a==null||b.some(v=>v==null)?null:decimal(b.reduce((n,v)=>n-micros(v),micros(a)));
export function orderContribution(line,costs) {
 isoDay(line.date);if(!Number.isSafeInteger(line.units)||line.units<0)throw new Error('Ungültige Einheiten');
 const rule=costAt(costs,line),missing=[];
 const parts={};
 const unitCost=k=>rule?.[k]==null?null:decimal(micros(rule[k])*BigInt(line.units));
 for(const k of Object.keys(costLabels))parts[k]=unitCost(k);
 // A confirmed actual fulfillment charge, including an explicit zero, supersedes the SKU rate.
 if(line.fulfillmentNet!=null)parts.fulfillment=line.fulfillmentNet;
 else if(rule?.fulfillmentSource==='marketplace')parts.fulfillment=null;
 const netSales=minus(line.revenueNet,line.refundNet);
 if(netSales==null)missing.push('Nettoerlös / Erstattungen');
 for(const [k,v] of Object.entries(parts))if(v==null)missing.push(costLabels[k]);
 if(line.feesComplete!==true||line.marketplaceFeesNet==null)missing.push('Abgerechnete Marktplatzgebühren');
 // Explicit restocking credit only. A cash refund does not prove inventory was returned sellable.
 if(line.inventoryCreditNet==null)missing.push('Warenkosten-Rückbuchung ungeklärt');
 const fee=line.feesComplete===true?line.marketplaceFeesNet:null;
 const unitCosts=sum(Object.values(parts));
 const contribution=minus(netSales,fee,unitCosts,line.inventoryCreditNet==null?null:decimal(-micros(line.inventoryCreditNet)));
 return {...line,parts,netSales,unitCosts,contribution,missing};
}
export function profitReport({lines,costs,accountId,currency,start,end,listingIds,advertising,overhead,fx=null}) {
 isoDay(start);isoDay(end);if(start>end)throw new Error('Ungültiger Zeitraum');validateSchedule(costs);
 const selected=new Set(listingIds),seen=new Set();
 if(selected.size!==listingIds.length)throw new Error('Doppelte Listingauswahl');
 for(const list of [advertising,overhead]){const keys=new Set();for(const r of list.filter(a=>a.accountId===accountId&&a.date>=start&&a.date<=end)){if(r.currency!==currency)throw new Error('Werbewährung passt nicht zum Konto');const key=JSON.stringify([r.listingId??null,r.date]);if(keys.has(key))throw new Error('Doppelte Tageskosten');keys.add(key);}}
 const relevant=lines.filter(l=>l.accountId===accountId&&selected.has(l.listingId)&&l.date>=start&&l.date<=end);
 for(const l of relevant){if(l.currency!==currency)throw new Error('Währungen dürfen nicht vermischt werden');if(seen.has(l.id))throw new Error('Doppelte Bestellposition');seen.add(l.id);}
 const detail=relevant.map(l=>orderContribution(l,costs)).map(l=>{
  if(!fx)return l;const out={...l,parts:{...l.parts},missing:[...l.missing]};
  for(const k of ['netSales','unitCosts','contribution','marketplaceFeesNet'])out[k]=toEuro(l[k],currency,l.date,fx);
  for(const k of Object.keys(out.parts))out.parts[k]=toEuro(l.parts[k],currency,l.date,fx);
  if(l.contribution!=null&&out.contribution==null)out.missing.push('Wechselkurs fehlt');return out;
 });
 const convertAd=a=>({...a,currency:fx?'EUR':a.currency,netAmount:fx?toEuro(a.netAmount,a.currency,a.date,fx):a.netAmount});
 const outputCurrency=fx?'EUR':currency;
 const groups=listingIds.map(listingId=>{
  const ls=detail.filter(l=>l.listingId===listingId);
  const ad=advertising.filter(a=>a.accountId===accountId&&a.listingId===listingId&&a.date>=start&&a.date<=end).map(convertAd);
  const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  const adsComplete=new Set(ad.map(a=>a.date)).size===days&&ad.every(a=>a.currency===outputCurrency&&a.netAmount!=null);
  const adCost=adsComplete?sum(ad.map(a=>a.netAmount)):null;
  const netSales=ls.length?sum(ls.map(l=>l.netSales)):null;
  const beforeAds=ls.length?sum(ls.map(l=>l.contribution)):null;
  const profit=minus(beforeAds,adCost);
  const missing=[...new Set(ls.flatMap(l=>l.missing))];if(!ls.length)missing.push('Keine Bestellpositionen');if(!adsComplete)missing.push('Werbekosten nicht vollständig');
  return {listingId,netSales,adCost,beforeAds,profit,margin:profit==null||netSales==null||micros(netSales)<=0n?null:Number(micros(profit))/Number(micros(netSales)),missing,
   fees:ls.length?sum(ls.map(l=>l.feesComplete?l.marketplaceFeesNet:null)):null,unitCosts:ls.length?sum(ls.map(l=>l.unitCosts)):null,units:ls.reduce((n,l)=>n+l.units,0),lines:ls};
 });
 const netSales=groups.length?sum(groups.map(g=>g.netSales)):null,profit=groups.length?sum(groups.map(g=>g.profit)):null;
 const oh=overhead.filter(a=>a.accountId===accountId&&a.date>=start&&a.date<=end).map(convertAd);
 const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
 const overheadNet=new Set(oh.map(a=>a.date)).size===days&&oh.every(a=>a.currency===outputCurrency)?sum(oh.map(a=>a.netAmount)):null;
 return {groups,lines:detail,netSales,profit,overheadNet,margin:profit==null||netSales==null||micros(netSales)<=0n?null:Number(micros(profit))/Number(micros(netSales)),complete:groups.length>0&&groups.every(g=>!g.missing.length),afterOverhead:minus(profit,overheadNet)};
}
