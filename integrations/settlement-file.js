import {money} from './money.js';
import {isoDay} from '../profit/costs.js';
// Explicit mappings avoid inventing provider CSV headers or debit/credit conventions.
export function parseDelimited(text,delimiter=';') {
 if(![';',',','\t'].includes(delimiter))throw new Error('Unsupported delimiter');
 const records=[];let row=[],field='',quoted=false,closed=false;
 const endField=()=>{row.push(field);field='';closed=false;};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;}
  else if(c==='"'){if(field||closed)throw new Error('Malformed CSV');quoted=true;}
  else if(c===delimiter)endField();
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;endField();if(row.some(x=>x!==''))records.push(row);row=[];}
  else{if(closed)throw new Error('Malformed CSV');field+=c;}
 }
 if(quoted)throw new Error('Unclosed CSV quote');if(field||row.length||closed){endField();records.push(row);}
 if(!records.length)throw new Error('Empty settlement file');const headers=records.shift();headers[0]=headers[0].replace(/^\uFEFF/,'');
 if(new Set(headers).size!==headers.length)throw new Error('Duplicate CSV headers');
 return records.map(r=>{if(r.length!==headers.length)throw new Error('Invalid CSV column count');return Object.fromEntries(headers.map((h,i)=>[h,r[i]]));});
}
export function settlementFile(text,{accountId,source,delimiter,columns,decimalSeparator='.',sign=1,taxBasis='unverified'}) {
 if(!accountId||!source||![1,-1].includes(sign)||!['net','gross','unverified'].includes(taxBasis)||!['.',','].includes(decimalSeparator))throw new Error('Explicit source, account, sign and tax basis required');
 for(const k of ['id','date','type','amount','currency'])if(!columns?.[k])throw new Error(`Missing column mapping ${k}`);
 const seen=new Set();return parseDelimited(text,delimiter).map(r=>{
  const get=k=>Array.isArray(columns[k])?(columns[k].every(h=>r[h]!=null&&r[h]!=='')?JSON.stringify(columns[k].map(h=>r[h])):null):columns[k]?r[columns[k]]:null;
  for(const k of ['id','date','type','amount','currency'])if(get(k)==null||get(k)==='')throw new Error(`Missing settlement ${k}`);
  const sourceKey=get('id');if(seen.has(sourceKey))throw new Error('Duplicate settlement row ID');seen.add(sourceKey);
  const raw=get('amount').replace(decimalSeparator,'.');if(!/^-?\d+(\.\d{1,6})?$/.test(raw))throw new Error('Ambiguous settlement amount; no implicit thousands separator');
  if(!/^[A-Z]{3}$/.test(get('currency')))throw new Error('Invalid settlement currency');
  const amount=money(raw);return {schemaVersion:1,accountId,stream:'settlement.file',sourceKey:`${source}/${sourceKey}`,grain:'event',periodStart:isoDay(get('date')),periodEnd:get('date'),date:get('date'),currency:get('currency'),orderId:get('orderId')||null,sku:get('sku')||null,sourceType:get('type'),taxBasis,sign,measures:{sourceAmount:amount},quality:'requires-reconciliation'};
 });
}
