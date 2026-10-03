// Synthetic API-shaped payloads. Not downloaded customer records or production mappings.
export function fixtureFor(stream,account) {
 const currency=account.currency;const date='2026-09-30';
 const amount={amount:'199.90',currency};
 const money={value:'199.90',currency};
 const context={accountId:account.id,currency,periodStart:date,periodEnd:date,asOf:date,profileId:`DEMO-PROFILE-${account.id}`,reportTypeId:'spAdvertisedProduct',adType:'SP',attributionDays:14,groupBy:['campaignId','advertisedAsin']};
 const samples={
  'amazon.orders':{orders:[{orderId:'DEMO-ORDER-1',createdTime:date+'T12:00:00Z',fulfillment:{fulfillmentStatus:'SHIPPED'},buyer:{email:'not-exported@example.invalid'},orderItems:[{orderItemId:'DEMO-ITEM-1',quantityOrdered:1,product:{asin:'DEMO-ASIN-001',sellerSku:'DEMO-SKU-001'},proceeds:{proceedsTotal:{amount:'199.90',currencyCode:currency}}}]}]},
  'amazon.salesTraffic':{salesAndTrafficByAsin:[{childAsin:'DEMO-ASIN-001',parentAsin:'DEMO-PARENT',salesByAsin:{unitsOrdered:2,orderedProductSales:{amount:399.80,currencyCode:currency}},trafficByAsin:{sessions:80,pageViews:110}}]},
  'amazon.finances':{payload:{transactions:[{transactionId:'DEMO-FIN-1',postedDate:date+'T12:00:00Z',transactionType:'Refund',transactionStatus:'RELEASED',totalAmount:{currencyCode:currency,currencyAmount:-199.90}}]}},
  'amazon.inventory':{payload:{inventorySummaries:[{asin:'DEMO-ASIN-001',sellerSku:'DEMO-SKU-001',totalQuantity:80,inventoryDetails:{fulfillableQuantity:70}}]}},
  'amazonAds.report':[{date,campaignId:'DEMO-CAMPAIGN',advertisedAsin:'DEMO-ASIN-001',advertisedSku:'DEMO-SKU-001',cost:19.99,clicks:40,impressions:4000,sales14d:199.90,purchases14d:1}],
  'ebay.orders':{orders:[{orderId:'DEMO-ORDER-1',creationDate:date+'T12:00:00Z',lineItems:[{lineItemId:'DEMO-ITEM-1',legacyItemId:'DEMO-LISTING-001',sku:'DEMO-SKU-001',quantity:1,lineItemCost:money,lineItemFulfillmentStatus:'FULFILLED'}]}]},
  'ebay.traffic':{header:{dimensionKeys:[{key:'LISTING'}],metrics:[{key:'LISTING_VIEWS_TOTAL'},{key:'LISTING_IMPRESSION_TOTAL'},{key:'TRANSACTION_COUNT'}]},records:[{dimensionValues:[{value:'DEMO-LISTING-001',applicable:true}],metricValues:[{value:120,applicable:true},{value:1200,applicable:true},{value:3,applicable:true}]}],lastUpdatedDate:date+'T23:00:00Z'},
  'ebay.finances':{transactions:[{transactionId:'DEMO-FIN-1',transactionDate:date+'T12:00:00Z',transactionType:'REFUND',bookingEntry:'DEBIT',amount:money}]},
  'otto.orders':{resources:[{salesOrderId:'DEMO-ORDER-1',orderDate:date+'T12:00:00Z',positionItems:[{positionItemId:'DEMO-ITEM-1',fulfillmentStatus:'SENT',itemValueGrossPrice:amount,product:{sku:'DEMO-SKU-001',articleNumber:'DEMO-ARTICLE-001'}}]}],links:[]},
  'otto.receipts':{resources:[{receiptNumber:'DEMO-RECEIPT-1',salesOrderId:'DEMO-ORDER-1',creationDate:date+'T12:00:00Z',type:'INVOICE',total:{gross:amount,net:{amount:'167.98',currency},vat:{amount:'31.92',currency}}}],links:[]},
  'kaufland.orders':{data:[{id_order_unit:1001,id_order:'DEMO-ORDER-1',ts_created_iso:date+'T12:00:00Z',id_offer:'DEMO-SKU-001',price:19990,revenue_gross:17990,revenue_net:15118,currency,storefront:'de',status:'sent',product:{id_product:2001}}],pagination:{offset:0,limit:30,total:1}},
  'kaufland.inventory':{data:[{id_unit:1001,id_product:2001,id_offer:'DEMO-SKU-001',amount:30,price:19990,currency}],pagination:{offset:0,limit:30,total:1}},
 };
 if(!samples[stream])throw new Error('No fixture');
 return {payload:samples[stream],context};
}
