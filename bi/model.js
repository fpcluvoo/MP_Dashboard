import {analytics,summarize} from '../src/analytics.js';
import {profitReport} from '../profit/calculate.js';
import {isoDay} from '../profit/costs.js';
import {micros,decimal} from '../integrations/money.js';
import {toEuro} from '../profit/fx.js';
import {blendedReport} from '../marketing/calculate.js';
const dayMs=86400000;
export function datesBetween(start,end) {isoDay(start);isoDay(end);const n=(Date.parse(end)-Date.parse(start))/dayMs+1;if(n<1||n>366)throw new Error('Zeitraum muss 1 bis 366 Tage umfassen');return Array.from({length:n},(_,i)=>new Date(Date.parse(start)+i*dayMs).toISOString().slice(0,10));}
export function previousPeriod(start,end){const days=datesBetween(start,end).length;return {start:new Date(Date.parse(start)-days*dayMs).toISOString().slice(0,10),end:new Date(Date.parse(start)-dayMs).toISOString().slice(0,10)};}
export const change=(current,previous)=>({absolute:current==null||previous==null?null:current-previous,relative:current==null||previous==null||previous<=0?null:(current-previous)/previous});
const total=values=>values.length&&values.every(v=>v!=null)?values.reduce((n,v)=>n+v,0):null;
const decSum=values=>values.length&&values.every(v=>v!=null)?Number(decimal(values.reduce((n,v)=>n+micros(v),0n))):null;
function periodAnalysis(data,display,options,costs) {
 const {accountIds,start,end,eur}=options,report=analytics(display,options),selected=new Set(report.rows.map(r=>r.id)),days=datesBetween(start,end);
 const profit=accountIds.map(id=>{const account=data.accounts.find(a=>a.id===id);return profitReport({...data.profit,costs,accountId:id,currency:account.currency,start,end,listingIds:report.rows.filter(l=>l.account_id===id).map(l=>l.id),fx:eur?data.fx:null});});
 const financialUnits=new Map();
 for(const line of profit.flatMap(p=>p.lines)){const key=`${line.listingId}/${line.date}`;financialUnits.set(key,(financialUnits.get(key)??0)+line.units);}
 const factsByListing=new Map();
 for(const fact of display.listing_daily.filter(f=>selected.has(f.listing_id)&&f.date>=start&&f.date<=end)){const facts=factsByListing.get(fact.listing_id)??[];facts.push(fact);factsByListing.set(fact.listing_id,facts);}
 const covered=new Set(report.rows.filter(r=>{const facts=factsByListing.get(r.id)??[];return facts.length===days.length&&facts.every(f=>f.units!=null&&financialUnits.get(`${r.id}/${f.date}`)===f.units);}).map(r=>r.id));
 const groups=new Map(profit.flatMap(p=>p.groups).map(g=>[g.listingId,covered.has(g.listingId)?g:{...g,profit:null,netSales:null,fees:null,unitCosts:null,missing:[...g.missing,'Abrechnungspositionen decken Tagesabsatz nicht vollständig ab']} ]));
 const products=[...new Set(report.rows.map(r=>r.product_id))].map(id=>{
  const rows=report.rows.filter(r=>r.product_id===id),metrics=summarize(rows.map(r=>r.metrics)),pg=rows.map(r=>groups.get(r.id));
  const allAmazon=rows.every(r=>data.accounts.find(a=>a.id===r.account_id).marketplace==='amazon');
  const db=total(pg.map(g=>g.profit==null?null:Number(g.profit))),net=total(pg.map(g=>g.netSales==null?null:Number(g.netSales)));
  const complete=rows.every(r=>r.metrics.revenue_cents!=null&&r.metrics.units!=null);
  return {id,name:rows[0].product.name,brandId:rows[0].product.brand_id,brandName:data.catalog.brands.find(b=>b.id===rows[0].product.brand_id)?.name??rows[0].product.brand_id,rows,metrics,revenue:metrics.revenue_cents==null?null:metrics.revenue_cents/100,profit:complete?db:null,margin:complete&&db!=null&&net>0?db/net:null,net,refundRate:metrics.refundRate,conversion:allAmazon?metrics.conversion:null,ads:decSum(pg.map(g=>g.adCost)),issues:[...new Set(pg.flatMap(g=>g.missing))],complete};
 });
 const dailyFacts=new Map(),dailyProfit=new Map(),dailyAds=new Map();
 for(const f of display.listing_daily.filter(r=>selected.has(r.listing_id)&&r.date>=start&&r.date<=end)){const list=dailyFacts.get(f.date)??[];list.push(f);dailyFacts.set(f.date,list);}
 for(const line of profit.flatMap(p=>p.lines)){const list=dailyProfit.get(line.date)??[];list.push(line.contribution);dailyProfit.set(line.date,list);}
 const currencyByAccount=new Map(data.accounts.map(a=>[a.id,a.currency]));
 for(const ad of data.profit.advertising.filter(a=>selected.has(a.listingId)&&a.date>=start&&a.date<=end)){const list=dailyAds.get(ad.date)??[];list.push(eur?toEuro(ad.netAmount,currencyByAccount.get(ad.accountId),ad.date,data.fx):ad.netAmount);dailyAds.set(ad.date,list);}
 const series=days.map(date=>{const facts=dailyFacts.get(date)??[],ads=dailyAds.get(date)??[],metrics=summarize(facts),valid=selected.size>0&&facts.length===selected.size&&new Set(facts.map(r=>r.listing_id)).size===selected.size,before=decSum(dailyProfit.get(date)??[]),spend=ads.length===selected.size?decSum(ads):null;
  return {date,revenue:valid&&metrics.revenue_cents!=null?metrics.revenue_cents/100:null,units:valid?metrics.units:null,profit:valid&&facts.every(f=>financialUnits.get(`${f.listing_id}/${date}`)===f.units)&&before!=null&&spend!=null?before-spend:null};});
 const summary={revenue:report.metrics.revenue_cents==null?null:report.metrics.revenue_cents/100,units:report.metrics.units,profit:total(products.map(p=>p.profit)),refundRate:report.metrics.refundRate};
 const costsBridge={net:total(products.map(p=>p.net)),fees:decSum([...groups.values()].map(g=>g.fees)),unitCosts:decSum([...groups.values()].map(g=>g.unitCosts)),ads:total(products.map(p=>p.ads)),profit:summary.profit};
 return {report,products,series,summary,costsBridge,coverage:{sales:report.rows.filter(r=>r.metrics.revenue_cents!=null).length,profit:report.rows.filter(r=>r.metrics.revenue_cents!=null&&groups.get(r.id)?.profit!=null).length,listings:report.rows.length}};
}
export function analyze(data,display,{costs,compare=true,...options}) {
 const current=periodAnalysis(data,display,options,costs),prior=previousPeriod(options.start,options.end);
 const previous=compare?periodAnalysis(data,display,{...options,...prior},costs):null;
 for(const p of current.products){const old=previous?.products.find(o=>o.id===p.id);p.change=change(p.revenue,old?.revenue??null);p.previousRevenue=old?.revenue??null;p.previousConversion=old?.conversion??null;}
 const marketing=blendedReport(data,{accountIds:options.accountIds,start:options.start,end:options.end,eur:options.eur});
 const insights=[];
 if(marketing.spendCoverage<options.accountIds.length)insights.push({kind:'quality',title:'Werbedaten fehlen',text:`${options.accountIds.length-marketing.spendCoverage} ausgewählte Kanäle ohne vollständigen Spend. Gesamtquoten bleiben offen.`,action:'sources'});
 const drop=current.products.filter(p=>p.change.relative!=null&&p.change.relative<=-.1).sort((a,b)=>a.change.absolute-b.change.absolute)[0];
 if(drop)insights.push({kind:'decline',title:`${drop.name}: Umsatz rückläufig`,text:`${Math.round(drop.change.relative*100)} % zur gleich langen Vorperiode. Absatz, Traffic und Preis im Produktvergleich prüfen.`,productId:drop.id});
 const returns=current.products.filter(p=>p.metrics.units>=20&&p.refundRate>=.03).sort((a,b)=>b.refundRate-a.refundRate)[0];
 if(returns)insights.push({kind:'refunds',title:`${returns.name}: Erstattungen prüfen`,text:`${(returns.refundRate*100).toFixed(1)} % Periodenquote (${returns.metrics.refunded_units} / ${returns.metrics.units} Einheiten). Keine bestellbezogene Retourenkohorte.`,productId:returns.id});
 const low=current.products.filter(p=>p.margin!=null&&p.margin<.15).sort((a,b)=>a.margin-b.margin)[0];
 if(low)insights.push({kind:'margin',title:`${low.name}: niedrige Marge`,text:`${(low.margin*100).toFixed(1)} % Deckungsbeitragsmarge vor unzugeordneten Kontokosten. Kosten und Werbung prüfen.`,productId:low.id});
 const conversion=current.products.find(p=>p.conversion!=null&&p.previousConversion!=null&&p.previousConversion-p.conversion>=.01);
 if(conversion)insights.push({kind:'conversion',title:`${conversion.name}: Conversion gesunken`,text:`${((conversion.conversion-conversion.previousConversion)*100).toFixed(1)} Prozentpunkte zur Vorperiode. Keine automatische Ursachenzuschreibung.`,productId:conversion.id});
 return {...current,previous,prior,options,marketing,insights,comparison:Object.fromEntries(Object.keys(current.summary).map(k=>[k,change(current.summary[k],previous?.summary[k]??null)]))};
}
