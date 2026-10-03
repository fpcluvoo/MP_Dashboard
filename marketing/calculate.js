import {micros,decimal,minorMoney} from '../integrations/money.js';
import {toEuro} from '../profit/fx.js';
import {isoDay} from '../profit/costs.js';
const sum=values=>!values.length||values.some(v=>v==null)?null:decimal(values.reduce((n,v)=>n+micros(v),0n));
const ratio=(a,b)=>a==null||b==null||micros(b)<=0n?null:Number(micros(a))/Number(micros(b));
const same=values=>values.length>0&&values.every(v=>typeof v==='string'&&v.length>0)&&new Set(values).size===1;
function ratios(spend,sales,adSales) {return {mer:ratio(sales,spend),tacos:ratio(spend,sales),acos:ratio(spend,adSales),adsRoas:ratio(adSales,spend)};}
export function blendedReport(data,{accountIds,start,end,eur=true}) {
 isoDay(start);isoDay(end);if(start>end)throw new Error('Invalid reporting period');
 if(new Set(accountIds).size!==accountIds.length)throw new Error('Duplicate account selection');
 const accounts=accountIds.map(id=>{const a=data.accounts.find(a=>a.id===id);if(!a)throw new Error('Unknown account');return a;});
 if(!eur&&new Set(accounts.map(a=>a.currency)).size>1)throw new Error('Mixed currencies require EUR');
 const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
 const channels=accounts.map(account=>{
  const rows=data.marketing_daily.filter(r=>r.accountId===account.id&&r.date>=start&&r.date<=end);
  if(new Set(rows.map(r=>r.date)).size!==rows.length)throw new Error('Duplicate account/day marketing facts');
  if(rows.some(r=>r.currency!==account.currency))throw new Error('Account currency mismatch');
  rows.forEach(r=>isoDay(r.date));
  const complete=rows.length===days;
  const value=(field,flag,convert=true)=>complete&&rows.every(r=>r[flag]===true&&r[field]!=null)?sum(rows.map(r=>{
   const native=minorMoney(r[field]);return eur&&convert?toEuro(native,r.currency,r.date,data.fx):native;
  })):null;
  const spend=value('spendCents','spendComplete'),sales=value('salesCents','salesComplete');
  const comparable=same(rows.map(r=>r.attributionKey))&&same(rows.flatMap(r=>[r.salesBasis,r.adSalesBasis]));
  const adSales=comparable?value('adSalesCents','adSalesComplete'):null;
  const salesBasis=same(rows.map(r=>r.salesBasis))?rows[0].salesBasis:null;
  const issues=[];if(spend==null)issues.push('Spend oder Tageskurse unvollständig');if(sales==null||!salesBasis)issues.push('Gesamtumsatz / Definition unvollständig');if(adSales==null)issues.push('Attribution unvollständig oder nicht vergleichbar');
  return {account,spend,sales:salesBasis?sales:null,adSales,salesBasis,attributionKey:comparable?rows[0]?.attributionKey:null,issues,
   original:{spend:value('spendCents','spendComplete',false),sales:value('salesCents','salesComplete',false),adSales:value('adSalesCents','adSalesComplete',false)},
   ...ratios(spend,salesBasis?sales:null,adSales)};
 });
 const spend=sum(channels.map(c=>c.spend)),sales=same(channels.map(c=>c.salesBasis))?sum(channels.map(c=>c.sales)):null;
 const attributionComparable=same(channels.map(c=>c.attributionKey))&&same(channels.map(c=>c.salesBasis));
 const adSales=attributionComparable?sum(channels.map(c=>c.adSales)):null;
 return {channels,currency:eur?'EUR':accounts[0]?.currency??'EUR',spend,sales,adSales,knownSpend:sum(channels.filter(c=>c.spend!=null).map(c=>c.spend)),spendCoverage:channels.filter(c=>c.spend!=null).length,attributionCoverage:channels.filter(c=>c.adSales!=null).length,attributionComparable,...ratios(spend,sales,adSales)};
}
