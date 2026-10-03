import {money,minorMoney} from './money.js';
const required=(value,name)=>{if(value==null||value==='')throw new Error(`Missing ${name}`);return value;};
const count=value=>{if(value==null)return null;if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid count');return value;};
const list=(v,name)=>{if(!Array.isArray(v))throw new Error(`Invalid ${name}`);return v;};
export function normalize(stream,payload,context) {
  const {accountId,periodStart,periodEnd,currency}=context;
  required(accountId,'accountId');required(periodStart,'periodStart');required(periodEnd,'periodEnd');
  const base=(key,fields)=>({schemaVersion:1,stream,accountId,sourceKey:String(required(key,'source key')),periodStart,periodEnd,currency:currency??null,grain:'event',externalId:null,sku:null,quality:'source-reported',...fields});
  let rows=[];
  if(stream==='amazon.salesTraffic') {
    // Per-ASIN rows aggregate the ENTIRE requested period; never repeat across days.
    rows=list(payload.salesAndTrafficByAsin,'salesAndTrafficByAsin').map(r=>base(required(r.childAsin,'childAsin'),{grain:'listing-period',externalId:r.childAsin,sku:r.sku??null,currency:r.salesByAsin?.orderedProductSales?.currencyCode??currency,
      measures:{sales:money(r.salesByAsin?.orderedProductSales?.amount),units:count(r.salesByAsin?.unitsOrdered),sessions:count(r.trafficByAsin?.sessions),pageViews:count(r.trafficByAsin?.pageViews)},basis:'ordered-product-sales'}));
  } else if(stream==='amazon.orders') {
    rows=list(payload.orders,'orders').flatMap(o=>list(o.orderItems,'orderItems').map(r=>base(`${required(o.orderId,'orderId')}/${required(r.orderItemId,'orderItemId')}`,{date:o.createdTime,externalId:r.product?.asin??null,sku:r.product?.sellerSku??null,currency:r.proceeds?.proceedsTotal?.currencyCode??currency,
      orderId:required(o.orderId,'orderId'),status:o.fulfillment?.fulfillmentStatus??null,measures:{units:count(r.quantityOrdered),sales:money(r.proceeds?.proceedsTotal?.amount)},basis:'order-item-proceeds'})));
  } else if(stream==='amazon.finances') {
    rows=list(payload.payload?.transactions,'transactions').map(r=>base(r.transactionId,{date:r.postedDate,currency:r.totalAmount?.currencyCode??currency,status:r.transactionStatus,eventType:r.transactionType,measures:{transactionAmount:money(r.totalAmount?.currencyAmount)},basis:'financial-event'}));
  } else if(stream==='amazon.inventory') {
    rows=list(payload.payload?.inventorySummaries,'inventorySummaries').map(r=>base(required(r.sellerSku,'sellerSku'),{grain:'snapshot',date:context.asOf??periodEnd,externalId:r.asin??null,sku:r.sellerSku,measures:{stock:count(r.totalQuantity),fulfillable:count(r.inventoryDetails?.fulfillableQuantity)},basis:'inventory-snapshot'}));
  } else if(stream==='amazonAds.report') {
    required(context.reportTypeId,'reportTypeId');required(context.profileId,'profileId');
    const window=context.attributionDays;
    if(![1,7,14,30].includes(window))throw new Error('Explicit supported attribution window required');
    rows=list(payload,'Ads report').map((r)=> {
      const dims=context.groupBy??[];if(!dims.length)throw new Error('Ads dimension columns required');
      const key=[context.profileId,context.reportTypeId,required(r.date,'date'),...dims.map(d=>required(r[d],d))].join('/');
      return base(key,{grain:'ad-period',date:r.date,externalId:r.advertisedAsin??null,sku:r.advertisedSku??null,
        attributionDays:window,profileId:context.profileId,adType:context.adType,reportTypeId:context.reportTypeId,
        measures:{adSpend:money(r.cost),clicks:count(r.clicks),impressions:count(r.impressions),adSales:money(r[`sales${window}d`]),adOrders:count(r[`purchases${window}d`])},basis:'ad-attributed',unassignedReason:r.advertisedAsin||r.advertisedSku?null:'No advertised product dimension'});
    });
  } else if(stream==='ebay.orders') {
    rows=list(payload.orders,'orders').flatMap(o=>list(o.lineItems,'lineItems').map(r=>base(`${o.orderId}/${required(r.lineItemId,'lineItemId')}`,{date:o.creationDate,orderId:required(o.orderId,'orderId'),externalId:r.legacyItemId??null,sku:r.sku??null,status:r.lineItemFulfillmentStatus??null,
      currency:(r.discountedLineItemCost??r.lineItemCost)?.currency??currency,measures:{units:count(r.quantity),sales:money((r.discountedLineItemCost??r.lineItemCost)?.value)},basis:r.discountedLineItemCost?'discounted-line-item-cost':'line-item-cost'})));
  } else if(stream==='ebay.traffic') {
    const dimensions=list(payload.header?.dimensionKeys,'dimensionKeys'),metrics=list(payload.header?.metrics,'metrics');
    rows=list(payload.records,'records').map(r=>{
      if(r.metricValues?.length!==metrics.length||r.dimensionValues?.length!==dimensions.length)throw new Error('Traffic columns do not match header');
      const mapped=Object.fromEntries(metrics.map((m,i)=>[m.key,r.metricValues[i].applicable===false?null:r.metricValues[i].value]));
      const dims=Object.fromEntries(dimensions.map((m,i)=>[m.key,r.dimensionValues[i].value]));
      return base(JSON.stringify(dims),{grain:'listing-period',externalId:dims.LISTING??null,date:dims.DAY??null,
        measures:{pageViews:count(mapped.LISTING_VIEWS_TOTAL),impressions:count(mapped.LISTING_IMPRESSION_TOTAL),transactions:count(mapped.TRANSACTION_COUNT)},basis:'ebay-traffic',sourceUpdatedAt:payload.lastUpdatedDate});
    });
  } else if(stream==='ebay.finances') {
    rows=list(payload.transactions,'transactions').map(r=>base(r.transactionId,{date:r.transactionDate,currency:r.amount?.currency??currency,eventType:r.transactionType,bookingEntry:r.bookingEntry,orderId:r.orderId??null,
      measures:{transactionAmount:money(r.amount?.value)},basis:'financial-event'}));
  } else if(stream==='otto.orders') {
    rows=list(payload.resources,'resources').flatMap(o=>list(o.positionItems,'positionItems').map(r=>base(`${required(o.salesOrderId,'salesOrderId')}/${required(r.positionItemId,'positionItemId')}`,{date:o.orderDate,orderId:o.salesOrderId,externalId:r.product?.articleNumber??null,sku:r.product?.sku??null,status:r.fulfillmentStatus,
      currency:(r.itemValueReducedGrossPrice??r.itemValueGrossPrice)?.currency??currency,
      measures:{units:1,sales:money((r.itemValueReducedGrossPrice??r.itemValueGrossPrice)?.amount)},basis:'reduced-gross-item-price'})));
  } else if(stream==='otto.receipts') {
    rows=list(payload.resources,'resources').map(r=>base(r.receiptNumber,{date:r.creationDate,orderId:r.salesOrderId??null,eventType:r.type,currency:r.total?.gross?.currency??currency,
      measures:{receiptGross:money(r.total?.gross?.amount),receiptNet:money(r.total?.net?.amount),tax:money(r.total?.vat?.amount)},basis:'receipt'}));
  } else if(stream==='kaufland.orders') {
    rows=list(payload.data,'data').map(r=>base(r.id_order_unit,{date:r.ts_created_iso,orderId:r.id_order,externalId:r.product?.id_product==null?null:String(r.product.id_product),sku:r.id_offer??null,status:r.status,currency:r.currency??currency,
      measures:{units:1,sales:r.price==null?null:minorMoney(r.price),settlementGross:r.revenue_gross==null?null:minorMoney(r.revenue_gross),settlementNet:r.revenue_net==null?null:minorMoney(r.revenue_net)},basis:'order-unit-price'}));
  } else if(stream==='kaufland.inventory') {
    rows=list(payload.data,'data').map(r=>base(r.id_unit,{grain:'snapshot',date:context.asOf??periodEnd,externalId:r.id_product==null?null:String(r.id_product),sku:r.id_offer??null,currency:r.currency??currency,measures:{stock:count(r.amount),offerPrice:r.price==null?null:minorMoney(r.price)},basis:'inventory-snapshot'}));
  } else throw new Error(`Unsupported stream ${stream}`);
  const keys=new Set();
  for(const row of rows) {
    if(keys.has(row.sourceKey))throw new Error('Duplicate source grain; dimensions must be explicit');
    keys.add(row.sourceKey);
    if(row.currency&&!/^[A-Z]{3}$/.test(row.currency))throw new Error('Invalid currency');
    // Only allowlisted analytical fields leave the adapter. No buyer/address/raw payload export.
  }
  return rows;
}
