import {money,decimal,micros} from './money.js';
const id=(pairs,name,key='relatedIdentifier')=>pairs?.find(x=>x[`${key}Name`]===name)?.[`${key}Value`]??null;
// Evidence, not a profit ledger: source taxonomy and tax basis require explicit reconciliation.
export function amazonFinanceDetails(t) {
 const leaves=(nodes,path=[])=> (nodes??[]).flatMap((b,i)=>{
  const at=[...path,`${i}:${b.breakdownType}`];
  return b.breakdowns?.length?leaves(b.breakdowns,at):[{path:at.join('/'),sourceType:b.breakdownType,sourceAmount:money(b.breakdownAmount?.currencyAmount),currency:b.breakdownAmount?.currencyCode??null,taxBasis:'unverified'}];
 });
 const orderId=id(t.relatedIdentifiers,'ORDER_ID');
 const items=(t.items??[]).map((item,i)=>{const product=item.contexts?.find(c=>c.contextType==='ProductContext');return {itemRef:id(item.relatedIdentifiers,'ORDER_ADJUSTMENT_ITEM_ID','itemRelatedIdentifier'),sourceIndex:i,sku:product?.sku??null,asin:product?.asin??null,orderId,lines:leaves(item.breakdowns)};});
 return {orderId,settlementId:id(t.relatedIdentifiers,'SETTLEMENT_ID'),transactionLines:leaves(t.breakdowns),items,note:'Transaction totals and item breakdowns overlap; never sum both. Stable ledger IDs and tax classification require reconciliation.'};
}
export function ebayFinanceDetails(t) {
 const direction=t.transactionType==='SALE'?1:t.transactionType==='REFUND'?-1:null;
 const items=(t.orderLineItems??[]).map(item=>({lineItemId:item.lineItemId,fees:(item.marketplaceFees??[]).map((f,i)=>({sourceIndex:i,sourceType:f.feeType,sourceAmount:money(f.amount?.value),currency:f.amount?.currency??null,costAmount:direction==null||f.amount?.value==null?null:decimal(micros(f.amount.value)*BigInt(direction)),taxBasis:'unverified'}))}));
 return {orderId:t.orderId??null,payoutId:t.payoutId??null,items,totalFeeAmount:money(t.totalFeeAmount?.value),bookingEntry:t.bookingEntry??null,note:'Item fees supersede totalFeeAmount. REFUND fee amounts are credits. NON_SALE_CHARGE and SHIPPING_LABEL need booking direction and tax review.'};
}
export function ottoReceiptDetails(r) {
 const vat=r.total?.vat;
 const taxes=vat&&typeof vat==='object'?Object.entries(vat).filter(([,v])=>v&&typeof v==='object').map(([rate,v])=>({rate,amount:money(v.amount),currency:v.currency})):[];
 return {type:r.type,totalNet:money(r.total?.net?.amount),totalGross:money(r.total?.gross?.amount),taxes,
  positions:(r.lineItems??[]).map(p=>({positionItemIds:p.positionItemIds??[],articleNumber:p.articleNumber??null,quantity:p.quantity??null,vatRate:p.vatRate??null,total:money(p.total?.amount),currency:p.total?.currency??null})),
  note:'Customer invoice/refund receipt is not an OTTO commission invoice. Receipt type determines the sign; do not infer seller fees.'};
}
