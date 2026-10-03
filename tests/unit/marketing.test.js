import test from 'node:test';
import assert from 'node:assert/strict';
import {blendedReport} from '../../marketing/calculate.js';
import {marketingDemo} from '../../marketing/demo.js';
import {demoData} from '../../database/demo.js';
const row=(accountId,spendCents,salesCents,adSalesCents,extra={})=>({accountId,currency:'EUR',date:'2026-09-01',spendCents,salesCents,adSalesCents,spendComplete:true,salesComplete:true,adSalesComplete:true,attributionKey:'14d-click-order-same-product',salesBasis:'gross-before-refunds',adSalesBasis:'gross-before-refunds',...extra});
const base=()=>({accounts:[{id:'a',currency:'EUR'},{id:'b',currency:'EUR'}],fx:[],marketing_daily:[row('a',1000,10000,4000),row('b',9000,30000,18000)]});
const query={accountIds:['a','b'],start:'2026-09-01',end:'2026-09-01'};
test('blended metrics divide sums and distinguish total revenue from attribution',()=>{
 const r=blendedReport(base(),query);assert.equal(r.spend,'100.000000');assert.equal(r.sales,'400.000000');assert.equal(r.adSales,'220.000000');assert.equal(r.mer,4);assert.equal(r.tacos,.25);assert.equal(r.adsRoas,2.2);assert.equal(r.acos,100/220);assert.notEqual(r.adsRoas,(4+2)/2);
});
test('missing spend, partial dates and unknown values block complete totals without dropping channels',()=>{
 const d=base();d.marketing_daily[1].spendComplete=false;
 const r=blendedReport(d,query);assert.equal(r.spend,null);assert.equal(r.knownSpend,'10.000000');assert.equal(r.spendCoverage,1);assert.equal(r.mer,null);assert.equal(r.tacos,null);assert.equal(r.acos,null);assert.equal(r.channels.length,2);
 assert.equal(blendedReport(base(),{...query,end:'2026-09-02'}).spend,null);
});
test('attribution incompatibility blocks Ads ROAS/ACoS independently of MER/TACoS',()=>{
 const d=base();d.marketing_daily[1].attributionKey='7d-click';const r=blendedReport(d,query);
 assert.equal(r.acos,null);assert.equal(r.adsRoas,null);assert.equal(r.mer,4);assert.equal(r.tacos,.25);
 d.marketing_daily[1].salesBasis='net';assert.equal(blendedReport(d,query).mer,null);
});
test('mixed currencies use daily FX and missing rates cannot become free spend',()=>{
 const d=base();d.accounts[1].currency='USD';d.marketing_daily[1].currency='USD';d.fx=[{currency:'USD',target:'EUR',date:'2026-09-01',rate:'0.5'}];
 const r=blendedReport(d,query);assert.equal(r.spend,'55.000000');assert.equal(r.sales,'250.000000');assert.equal(r.mer,250/55);assert.equal(r.channels[1].original.spend,'90.000000');
 assert.throws(()=>blendedReport(d,{...query,eur:false}),/Mixed currencies/);d.fx=[];assert.equal(blendedReport(d,query).tacos,null);
});
test('explicit zero is valid while zero denominators, duplicate facts and unknown accounts are guarded',()=>{
 const d=base();d.marketing_daily.forEach(r=>{r.spendCents=0;r.adSalesCents=0;});const r=blendedReport(d,query);assert.equal(r.spend,'0.000000');assert.equal(r.tacos,0);assert.equal(r.mer,null);assert.equal(r.acos,null);
 d.marketing_daily.push(d.marketing_daily[0]);assert.throws(()=>blendedReport(d,query),/Duplicate/);
 assert.throws(()=>blendedReport(base(),{...query,accountIds:['missing']}),/Unknown account/);
 const empty=blendedReport(base(),{...query,accountIds:[]});assert.equal(empty.mer,null);assert.equal(empty.spend,null);
});
test('synthetic account spend includes assigned and unassigned costs exactly once',()=>{
 const d=demoData();const facts=marketingDemo(d);const total=facts.filter(r=>r.accountId==='amazon-de').reduce((n,r)=>n+r.spendCents,0);
 assert.equal(total,d.ad_spend.filter(r=>r.account_id==='amazon-de').reduce((n,r)=>n+r.spend_cents,0));
 assert.equal(facts.length,360);assert.equal(facts.filter(r=>r.accountId==='otto-de').every(r=>r.spendCents===null&&!r.spendComplete),true);
});
