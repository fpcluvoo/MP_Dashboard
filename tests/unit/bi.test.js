import test from 'node:test';
import assert from 'node:assert/strict';
import {demoData,assortment} from '../../database/demo.js';
import {withDemoHistory} from '../../database/history.js';
import {profitDemo} from '../../profit/demo.js';
import {euroDemo,euroData} from '../../profit/fx.js';
import {marketingDemo} from '../../marketing/demo.js';
import {analyze,previousPeriod,datesBetween,change} from '../../bi/model.js';
import {validateView,csvCell,productCsv} from '../../bi/reporting.js';
const raw=demoData(),history=withDemoHistory(raw);
const data={...history,catalog:assortment,historyStart:'2026-08-01',end:'2026-09-30',profit:profitDemo(history),fx:euroDemo(history),marketing_daily:marketingDemo(history)};
const options={start:'2026-09-01',end:'2026-09-30',accountIds:['amazon-de'],eur:false,costs:data.profit.costs};
const report=analyze(data,data,options);

test('comparison uses equal inclusive periods, validates dates, and never divides by zero',()=>{
 assert.deepEqual(previousPeriod('2026-09-01','2026-09-30'),{start:'2026-08-02',end:'2026-08-31'});
 assert.deepEqual(previousPeriod('2026-09-24','2026-09-30'),{start:'2026-09-17',end:'2026-09-23'});
 assert.equal(datesBetween('2024-02-28','2024-03-01').length,3);
 for(const [start,end] of [['2026-02-30','2026-03-01'],['2026-09-02','2026-09-01'],['2020-01-01','2026-01-01']])assert.throws(()=>datesBetween(start,end));
 assert.equal(change(100,0).relative,null);assert.equal(change(null,20).absolute,null);
});
test('history preserves existing September fixtures and adds exactly 31 days per listing',()=>{
 assert.deepEqual(history.listing_daily.filter(f=>f.date>='2026-09-01'),raw.listing_daily);
 assert.equal(history.listing_daily.length,61*raw.listings.length);
 assert.equal(new Set(history.listing_daily.map(f=>`${f.listing_id}/${f.date}`)).size,history.listing_daily.length);
});
test('products and daily chart reconcile without multiplying SKU mappings; margins and refund rates are weighted',()=>{
 assert.equal(report.products.length,6);assert.equal(report.summary.units,4230);
 for(const key of ['revenue','units','profit'])assert.ok(Math.abs(report.series.reduce((n,d)=>n+d[key],0)-report.summary[key])<.0001,key);
 assert.equal(report.products.reduce((n,p)=>n+p.revenue,0),report.summary.revenue);
 const bright=report.products.find(p=>p.id==='clouvou-bright-seat');assert.equal(bright.rows.length,3);assert.equal(bright.metrics.units,630);
 assert.equal(bright.refundRate,bright.metrics.refunded_units/630);assert.equal(bright.margin,bright.profit/bright.net);
 assert.ok(report.previous.summary.profit>0);assert.ok(report.products.some(p=>p.change.relative<-.1));
 assert.ok(report.insights.some(i=>i.kind==='decline'));
});
test('missing financial positions, sales days or prior history cannot create complete BI profit',()=>{
 const first=data.profit.lines.find(l=>l.accountId==='amazon-de'&&l.date==='2026-09-01');
 const partial={...data,profit:{...data.profit,lines:data.profit.lines.filter(l=>l.id!==first.id)}};
 const a=analyze(partial,partial,options);assert.equal(a.summary.profit,null);assert.equal(a.series[0].profit,null);assert.equal(a.coverage.profit,17);assert.equal(a.summary.revenue,report.summary.revenue);
 const gap={...data,listing_daily:data.listing_daily.filter(f=>!(f.listing_id===first.listingId&&f.date===first.date))};
 assert.equal(analyze(gap,gap,options).summary.revenue,null);
 const august=analyze(data,data,{...options,start:'2026-08-01',end:'2026-08-07'});assert.equal(august.previous.summary.revenue,null);assert.equal(august.comparison.revenue.relative,null);
 assert.equal(analyze(data,data,{...options,compare:false}).previous,null);
});
test('mixed channels convert daily before rollup and missing ad coverage blocks profit and blended ratios',()=>{
 const a=analyze(data,euroData(data),{...options,accountIds:['amazon-de','amazon-us','otto-de'],eur:true});
 assert.equal(a.summary.profit,null);assert.equal(a.marketing.tacos,null);assert.equal(a.marketing.spendCoverage,2);
 assert.ok(a.summary.revenue>report.summary.revenue);assert.ok(a.products.every(p=>p.conversion===null));
 assert.ok(Math.abs(a.series.reduce((n,d)=>n+d.revenue,0)-a.summary.revenue)<.0001);
 const noFx={...data,fx:data.fx.filter(r=>!(r.currency==='USD'&&r.date==='2026-09-01'))};
 const missing=analyze(noFx,euroData(noFx),{...options,accountIds:['amazon-us'],eur:true});assert.equal(missing.summary.revenue,null);assert.equal(missing.summary.profit,null);
});
test('saved views validate channel, date and product scope; CSV carries provenance and escapes spreadsheet formulas',()=>{
 const state={version:1,accountIds:['amazon-de'],start:'2026-09-01',end:'2026-09-30',view:'products',currency:'eur',brandId:'all',categoryId:'all',productId:'all',query:'',compare:true};
 assert.deepEqual(validateView(state,data),state);
 for(const patch of [{accountIds:['unknown']},{accountIds:['amazon-de','amazon-de']},{start:'2025-01-01'},{view:'injected'},{brandId:'lutivo',productId:'clouvou-bright-seat'}])assert.throws(()=>validateView({...state,...patch},data));
 assert.equal(csvCell(' =HYPERLINK("evil")'),'"\' =HYPERLINK(""evil"")"');assert.equal(csvCell(-1.25),'"-1,25"');assert.equal(csvCell(null),'""');
 const csv=productCsv(report,'EUR');assert.ok(csv.startsWith('\uFEFF'));assert.equal(csv.split('\r\n').length,7);assert.match(csv,/Synthetische Demo/);assert.match(csv,/2026-09-30/);assert.match(csv,/"EUR"/);
});
