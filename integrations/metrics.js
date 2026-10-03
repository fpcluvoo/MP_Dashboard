import {decimal,micros} from './money.js';
const ratio=(a,b)=>a==null||b==null||b===0?null:a/b;
const moneyRatio=(a,b)=>a==null||b==null?null:ratio(Number(micros(a)),Number(micros(b)));
// One stream, one currency, one basis, one report configuration at a time.
export function calculate(facts) {
 if(!facts.length)return {available:false};
 for(const k of ['stream','currency','basis','accountId','reportTypeId','attributionDays','profileId','grain'])if(new Set(facts.map(f=>f[k])).size>1)throw new Error(`Incompatible ${k}`);
 if(facts[0].grain==='listing-period'&&new Set(facts.map(f=>`${f.periodStart}/${f.periodEnd}`)).size>1)throw new Error('Incompatible reporting periods');
 if(facts[0].grain==='snapshot'&&new Set(facts.map(f=>f.date)).size>1)throw new Error('Cannot sum inventory snapshots across dates');
 const identities=facts.map(f=>JSON.stringify([f.sourceKey,f.grain==='ad-period'?f.date:null]));
 if(new Set(identities).size!==facts.length)throw new Error('Duplicate source facts');
 const moneySum=k=>facts.every(f=>f.measures[k]!=null)?decimal(facts.reduce((n,f)=>n+micros(f.measures[k]),0n)):null;
 const sum=k=>facts.every(f=>f.measures[k]!=null)?facts.reduce((n,f)=>n+f.measures[k],0):null;
 const sales=moneySum('sales'),adSpend=moneySum('adSpend'),adSales=moneySum('adSales');
 const units=sum('units'),sessions=sum('sessions'),pageViews=sum('pageViews'),transactions=sum('transactions'),clicks=sum('clicks'),impressions=sum('impressions');
 return {available:true,currency:facts[0].currency,basis:facts[0].basis,sales,units,sessions,pageViews,adSpend,adSales,clicks,impressions,
  unitSessionRate:ratio(units,sessions),ebayTransactionViewRate:ratio(transactions,pageViews),ctr:ratio(clicks,impressions),cpc:ratio(adSpend==null?null:Number(adSpend),clicks),acos:moneyRatio(adSpend,adSales),roas:moneyRatio(adSales,adSpend),
  profit:null,profitReason:'COGS, taxes and complete fees are not supplied by this stream'};
}
