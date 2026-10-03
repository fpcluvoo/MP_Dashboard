import test from 'node:test';
import assert from 'node:assert/strict';
import {CostStore} from '../../backend/cost-store.js';
import {addCostVersion} from '../../profit/costs.js';
import {orderContribution,profitReport} from '../../profit/calculate.js';
import {toEuro} from '../../profit/fx.js';
import {amazonFinanceDetails,ebayFinanceDetails,ottoReceiptDetails} from '../../integrations/finance-details.js';
import {settlementFile} from '../../integrations/settlement-file.js';
import {DirectConnector} from '../../backend/connectors.js';
const cost={accountId:'amazon-de',sku:'SKU',currency:'EUR',validFrom:'2026-01-01',purchase:'40',fulfillment:'10',packaging:'1',inbound:'2',duty:'0',special:'0',fulfillmentSource:'manual'};
const line={id:'order/1',orderId:'order',listingId:'listing',accountId:'amazon-de',sku:'SKU',currency:'EUR',date:'2026-09-01',units:2,revenueNet:'200',refundNet:'20',marketplaceFeesNet:'25',feesComplete:true,fulfillmentNet:'12',inventoryCreditNet:'0'};
const context={lines:[line],costs:[cost],accountId:'amazon-de',currency:'EUR',start:'2026-09-01',end:'2026-09-01',listingIds:['listing'],advertising:[{accountId:'amazon-de',listingId:'listing',date:'2026-09-01',currency:'EUR',netAmount:'7'}],overhead:[{accountId:'amazon-de',date:'2026-09-01',currency:'EUR',netAmount:'3'}]};
test('profit bridge uses net refunds, actual fulfillment once, weighted margin and separate overhead',()=>{
 const r=profitReport(context);assert.equal(r.groups[0].unitCosts,'98.000000');assert.equal(r.groups[0].beforeAds,'57.000000');assert.equal(r.profit,'50.000000');assert.equal(r.afterOverhead,'47.000000');assert.equal(r.margin,50/180);
 assert.equal(orderContribution({...line,inventoryCreditNet:'10'},[cost]).contribution,'67.000000');
 assert.equal(orderContribution({...line,fulfillmentNet:'0'},[cost]).parts.fulfillment,'0');
});
test('missing purchase, actual fees, tax/net sales or advertising blocks profit; negative profits remain valid',()=>{
 for(const patch of [{revenueNet:null},{feesComplete:false},{inventoryCreditNet:null}])assert.equal(profitReport({...context,lines:[{...line,...patch}]}).profit,null);
 assert.equal(profitReport({...context,costs:[{...cost,purchase:null}]}).profit,null);
 assert.equal(profitReport({...context,advertising:[]}).profit,null);
 assert.equal(profitReport({...context,lines:[{...line,refundNet:'300'}]}).margin,null);
 assert.ok(Number(profitReport({...context,costs:[{...cost,purchase:'100'}]}).profit)<0);
 assert.throws(()=>profitReport({...context,lines:[line,line]}),/Doppelte/);
 assert.throws(()=>profitReport({...context,lines:[{...line,currency:'USD'}]}),/Währungen/);
});
test('effective SKU costs isolate accounts, dates and fulfillment requirements',()=>{
 const changed=addCostVersion([cost],{...cost,validFrom:'2026-09-16',purchase:'50'});
 assert.equal(changed[0].validTo,'2026-09-15');assert.equal(orderContribution(line,changed).parts.purchase,'80.000000');
 assert.equal(orderContribution({...line,date:'2026-09-16'},changed).parts.purchase,'100.000000');
 assert.equal(orderContribution({...line,accountId:'amazon-fr'},changed).contribution,null);
 assert.equal(orderContribution({...line,fulfillmentNet:null},[{...cost,fulfillmentSource:'marketplace'}]).contribution,null);
 assert.throws(()=>addCostVersion(changed,{...cost,validFrom:'2026-09-16'}),/nach der letzten/);
 assert.throws(()=>addCostVersion([],{...cost,validFrom:'2026-02-30'}),/Datum/);
});
test('private cost store audits versions and rejects stale concurrent writes without changes',()=>{
 const s=new CostStore(':memory:');try{
  s.add(cost,{expectedRevision:0,actor:'tester'});
  assert.throws(()=>s.add({...cost,validFrom:'2026-09-16'},{expectedRevision:0,actor:'other'}),/inzwischen/);
  assert.equal(s.read().revision,1);assert.equal(s.history().length,1);
  s.add({...cost,validFrom:'2026-09-16',purchase:'50'},{expectedRevision:1,actor:'tester'});
  assert.equal(s.history().length,2);assert.equal(s.read().records[0].purchase,'40.000000');
 }finally{s.close();}
});
test('FX uses historical dated rates, preserves signs, and missing FX is not zero',()=>{
 const fx=[{currency:'USD',target:'EUR',date:'2026-09-01',rate:'0.900000'},{currency:'USD',target:'EUR',date:'2026-09-02',rate:'0.800000'}];
 assert.equal(toEuro('100','USD','2026-09-01',fx),'90.000000');assert.equal(toEuro('-10','USD','2026-09-02',fx),'-8.000000');assert.equal(toEuro('10','USD','2026-09-03',fx),null);
 const c={...context,currency:'USD',costs:[{...cost,currency:'USD'}],lines:[{...line,currency:'USD'}],advertising:context.advertising.map(a=>({...a,currency:'USD'})),overhead:context.overhead.map(a=>({...a,currency:'USD'})),fx};
 assert.equal(profitReport(c).profit,'45.000000');assert.equal(profitReport({...c,fx:[]}).profit,null);
});
test('finance breakdowns preserve source hierarchy, fee rebates and OTTO VAT maps',()=>{
 const a=amazonFinanceDetails({relatedIdentifiers:[{relatedIdentifierName:'ORDER_ID',relatedIdentifierValue:'order'}],breakdowns:[{breakdownType:'Fees',breakdownAmount:{currencyAmount:-5,currencyCode:'EUR'},breakdowns:[{breakdownType:'Commission',breakdownAmount:{currencyAmount:-5,currencyCode:'EUR'}}]}]});
 assert.equal(a.orderId,'order');assert.equal(a.transactionLines.length,1);assert.equal(a.transactionLines[0].sourceAmount,'-5.000000');assert.equal(a.transactionLines[0].taxBasis,'unverified');
 const e=ebayFinanceDetails({transactionType:'REFUND',orderLineItems:[{lineItemId:'line',marketplaceFees:[{feeType:'FINAL_VALUE_FEE',amount:{value:'5',currency:'EUR'}}]}]});assert.equal(e.items[0].fees[0].costAmount,'-5.000000');
 assert.equal(ottoReceiptDetails({total:{vat:{19:{amount:19,currency:'EUR'},7:{amount:7,currency:'EUR'}}}}).taxes.length,2);
});
test('settlement CSV mapping handles quoted fields and rejects ambiguous amounts and duplicate identifiers',()=>{
 const cfg={accountId:'otto-de',source:'reviewed-file',delimiter:';',columns:{id:'id',date:'date',type:'type',amount:'amount',currency:'currency'},decimalSeparator:','};
 const header='id;date;type;amount;currency\n',row='1;2026-09-01;"fee;detail";12,30;EUR\n';
 const parsed=settlementFile(header+row,cfg);assert.equal(parsed[0].measures.sourceAmount,'12.300000');assert.equal(parsed[0].taxBasis,'unverified');
 assert.throws(()=>settlementFile(header+row+row,cfg),/Duplicate/);
 assert.throws(()=>settlementFile(header+row.replace('12,30','1.012,30'),cfg),/Ambiguous/);
});
test('Kaufland bookings and existing Amazon settlements use documented report paths',async()=>{
 const requests=[];const k=new DirectConnector({provider:'kaufland',account:{region:'eu',storefront:'de'},kauflandCredentials:{clientKey:'test',secretKey:'test'},transport:{json:async(url,options)=>{requests.push({url,options});return {data:{status:'DONE',url:'https://example.test/report.csv'}};}}});
 await k.requestKauflandBookings({start:'2026-09-01',end:'2026-09-30'});assert.match(requests[0].url,/bookings-new\?storefront=de&version=v2/);assert.equal(requests[0].options.method,'POST');assert.equal((await k.pollKauflandBookings(123)).format,'text');
 const a=new DirectConnector({provider:'amazon',account:{region:'eu'},tokens:{get:async()=> 'TEST'},transport:{json:async(url)=>{assert.match(url,/GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2/);return {reports:[]};}}});assert.deepEqual(await a.listAmazonSettlements(),{reports:[]});
});
