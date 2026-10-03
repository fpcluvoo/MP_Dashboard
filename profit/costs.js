import {money,micros} from '../integrations/money.js';
export const costLabels={purchase:'Einkauf',fulfillment:'Fulfillment / Versand',packaging:'Verpackung',inbound:'Anlieferung',duty:'Zoll',special:'Sonderkosten'};
export function isoDay(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('Ungültiges Datum');
 return value;
}
export function validateCost(input) {
 const r={};
 for(const k of ['accountId','sku','currency','validFrom'])if(typeof input[k]!=='string'||!input[k].trim())throw new Error(`Pflichtfeld: ${k}`);else r[k]=input[k];
 if(!/^[A-Z]{3}$/.test(r.currency))throw new Error('Ungültige Währung');
 isoDay(r.validFrom);r.validTo=input.validTo??null;if(r.validTo){isoDay(r.validTo);if(r.validTo<r.validFrom)throw new Error('Ungültiger Gültigkeitszeitraum');}
 r.fulfillmentSource=input.fulfillmentSource??'manual';if(!['manual','marketplace'].includes(r.fulfillmentSource))throw new Error('Ungültige Fulfillment-Quelle');
 for(const k of Object.keys(costLabels)){r[k]=input[k]==null||input[k]===''?null:money(input[k]);if(r[k]!=null&&micros(r[k])<0n)throw new Error('SKU-Kosten müssen positiv oder null sein');}
 r.note=String(input.note??'').slice(0,500);return r;
}
const same=(a,b)=>a.accountId===b.accountId&&a.sku===b.sku&&a.currency===b.currency;
export function validateSchedule(records) {
 const normalized=records.map(validateCost);
 for(let i=0;i<normalized.length;i++)for(let j=i+1;j<normalized.length;j++){
  const a=normalized[i],b=normalized[j];if(same(a,b)&&a.validFrom<=(b.validTo??'9999-12-31')&&b.validFrom<=(a.validTo??'9999-12-31'))throw new Error('Überlappende Kostenzeiträume');
 }
 return normalized;
}
// Append a future version, closing only the previous open interval. Historical revisions are retained in the backend audit log.
export function addCostVersion(records,input) {
 const r=validateCost(input),all=validateSchedule(records);
 const matching=all.filter(a=>same(a,r)).sort((a,b)=>a.validFrom.localeCompare(b.validFrom));
 const latest=matching.at(-1);
 if(latest&&r.validFrom<=latest.validFrom)throw new Error('Neue Version muss nach der letzten Version beginnen');
 if(latest&&(!latest.validTo||latest.validTo>=r.validFrom))latest.validTo=new Date(Date.parse(r.validFrom)-86400000).toISOString().slice(0,10);
 return validateSchedule([...all,r]);
}
export function costAt(records,{accountId,sku,currency,date}) {
 const found=records.filter(r=>r.accountId===accountId&&r.sku===sku&&r.currency===currency&&r.validFrom<=date&&(!r.validTo||r.validTo>=date));
 if(found.length>1)throw new Error('Überlappende Kostenzeiträume');return found[0]??null;
}
