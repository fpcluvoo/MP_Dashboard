import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {channels,streams} from '../../integrations/registry.js';
import {fixtureFor} from '../../integrations/fixtures.js';
import {normalize} from '../../integrations/normalize.js';
import {calculate} from '../../integrations/metrics.js';
import {HttpTransport,ApiError} from '../../backend/http.js';
import {OAuthTokens,kauflandHeaders} from '../../backend/auth.js';
import {DirectConnector,importPages,apiOrigin} from '../../backend/connectors.js';
import {IntegrationStore} from '../../backend/store.js';
const account=channels[0];
const tokens={get:async()=> 'TEST-TOKEN'};

test('all 52 stream/account fixtures validate; no buyer PII escapes normalization',()=>{
 let n=0;
 for(const a of channels)for(const s of streams.filter(s=>s.provider===a.provider||a.provider==='amazon'&&s.provider==='amazonAds')){
  const f=fixtureFor(s.id,a),rows=normalize(s.id,f.payload,f.context);
  assert.equal(rows.length,1);assert.equal(rows[0].accountId,a.id);assert.equal(rows[0].currency,a.currency);
  assert.ok(!JSON.stringify(rows).includes('not-exported'));n++;
 }
 assert.equal(n,52);assert.equal(channels.filter(c=>c.provider==='amazon').length,9);
 assert.equal(apiOrigin('amazon','na'),'https://sellingpartnerapi-na.amazon.com');
});
test('source semantics, cents, report-period grain and attribution are preserved',()=>{
 const amz=fixtureFor('amazon.salesTraffic',account);amz.context.periodStart='2026-09-01';
 const rows=normalize('amazon.salesTraffic',amz.payload,amz.context);
 assert.equal(rows.length,1);assert.equal(rows[0].grain,'listing-period');assert.equal(calculate(rows).unitSessionRate,0.025);
 assert.throws(()=>calculate([...rows,{...rows[0],periodStart:'2026-08-01'}]),/reporting periods/);
 assert.throws(()=>calculate([...rows,...rows]),/Duplicate/);
 const k=fixtureFor('kaufland.orders',channels.at(-1));const kr=normalize('kaufland.orders',k.payload,k.context)[0];
 assert.equal(kr.measures.sales,'199.900000');assert.equal(kr.measures.settlementGross,'179.900000');
 const f=fixtureFor('amazonAds.report',account);const ar=normalize('amazonAds.report',f.payload,f.context);
 assert.equal(calculate(ar).ctr,.01);assert.equal(calculate(ar).roas,10);
 assert.throws(()=>normalize('amazonAds.report',f.payload,{...f.context,attributionDays:undefined}),/attribution/);
 assert.throws(()=>calculate([...ar,{...ar[0],currency:'USD'}]),/currency/);
 assert.throws(()=>calculate([...ar,{...ar[0],reportTypeId:'spCampaigns'}]),/reportTypeId/);
});
test('eBay reads metric columns by metadata, respects applicable=false, no invented sessions',()=>{
 const f=fixtureFor('ebay.traffic',channels.find(c=>c.provider==='ebay'));
 f.payload.header.metrics.reverse();f.payload.records[0].metricValues.reverse();
 const r=normalize('ebay.traffic',f.payload,f.context);
 assert.equal(calculate(r).ebayTransactionViewRate,.025);assert.equal(calculate(r).sessions,null);
 f.payload.records[0].metricValues[2].applicable=false;
 assert.equal(calculate(normalize('ebay.traffic',f.payload,f.context)).ebayTransactionViewRate,null);
});
test('OAuth token caching and Kaufland HMAC match fixed vectors',async()=>{
 let calls=0;
 const auth=new OAuthTokens({provider:'amazon',clientId:'test-id',clientSecret:'test-secret',refreshToken:'test-refresh',transport:{json:async(url,o)=>{calls++;assert.ok(!url.includes('test-secret'));assert.match(o.body,/grant_type=refresh_token/);return {access_token:'TEST',expires_in:3600};}}});
 assert.equal(await auth.get(),'TEST');await auth.get();assert.equal(calls,1);await auth.get(true);assert.equal(calls,2);
 const h=kauflandHeaders({clientKey:'test-client',secretKey:'test-secret'},'GET','https://sellerapi.kaufland.com/v2/order-units?storefront=de','',1700000000);
 assert.equal(h['Shop-Signature'],'4a25ce4fad94655a6a856fc8a854d730768cb2dd7ceb238a925b1f0a2deea93f');
});
test('transport retries 429, honors bounded Retry-After and does not retry permission denial or report creation',async()=>{
 let calls=0;const waits=[];
 const t=new HttpTransport({sleep:async ms=>waits.push(ms),fetchImpl:async()=>{calls++;return calls===1?new Response('',{status:429,headers:{'Retry-After':'2'}}):Response.json({ok:true});}});
 assert.deepEqual(await t.json('https://api.ebay.com/test'),{ok:true});assert.deepEqual(waits,[2000]);
 const deny=new HttpTransport({fetchImpl:async()=>{throw new ApiError(403);}});
 const noRetry=new HttpTransport({fetchImpl:async()=>new Response('private provider message',{status:403})});
 await assert.rejects(()=>noRetry.json('https://api.ebay.com/test'),e=>e.status===403&&!e.message.includes('private'));
 let posts=0;const post=new HttpTransport({fetchImpl:async()=>{posts++;return new Response('',{status:503});}});
 await assert.rejects(()=>post.json('https://api.ebay.com/test',{method:'POST'}));assert.equal(posts,1);
});
test('pagination keeps filters, refreshes expired auth once and refuses external URLs or writes',async()=>{
 const urls=[];let refreshes=0;
 const c=new DirectConnector({account,tokens:{get:async force=>{if(force)refreshes++;return 'TEST';}},transport:{json:async(url)=>{
  urls.push(url);if(urls.length===1)throw new ApiError(401);
  return urls.length===2?{orders:[],pagination:{nextToken:'NEXT'}}:{orders:[]};
 }}});
 const pages=[];for await(const p of c.pages('amazon.orders',{marketplaceIds:account.marketplaceId,createdAfter:'2026-09-01T00:00:00Z'}))pages.push(p);
 assert.equal(pages.length,2);assert.equal(refreshes,1);assert.match(urls[2],/paginationToken=NEXT/);assert.match(urls[2],/marketplaceIds=/);
 await assert.rejects(()=>c.request('https://example.org/steal'),/Untrusted/);
 await assert.rejects(()=>c.request('/orders',{method:'DELETE'}),/disabled/);
});
test('offset/next links paginate and pagination loops fail',async()=>{
 const a=channels.at(-1);let n=0;
 const c=new DirectConnector({account:a,kauflandCredentials:{clientKey:'x',secretKey:'y'},transport:{json:async url=>{n++;if(n===2)assert.match(url,/offset=1/);return {data:[],pagination:{offset:n-1,limit:1,total:2}};}}});
 let count=0;for await(const p of c.pages('kaufland.orders'))count++;assert.equal(count,2);
 const e=new DirectConnector({account:channels.find(a=>a.provider==='ebay'),tokens,transport:{json:async()=>({next:'https://api.ebay.com/sell/fulfillment/v1/order'})}});
 await assert.rejects(async()=>{for await(const p of e.pages('ebay.orders')){}},/Pagination loop/);
});
test('report lifecycle polls, downloads without tokens and rejects unapproved destinations',async()=>{
 const a=new DirectConnector({account,tokens,approvedDownloadHosts:['reports.example.test'],transport:{json:async url=>url.includes('/documents/')?{url:'https://reports.example.test/file',compressionAlgorithm:'GZIP'}:{processingStatus:'DONE',reportDocumentId:'DOC'},bytes:async(url,options)=>{assert.deepEqual(options.headers,{});return gzipSync(JSON.stringify({ok:true}));}}});
 const job=await a.pollReport('REPORT');assert.deepEqual(await a.downloadReport(job),{ok:true});
 await assert.rejects(()=>a.downloadReport({...job,url:'https://untrusted.test/file'}),/approved/);
});
test('import is idempotent across overlapping windows and failures cannot advance checkpoints',async()=>{
 const s=new IntegrationStore(':memory:');const f=fixtureFor('amazon.orders',account);
 const connector={async *pages(){yield f.payload;}};
 try{
  await importPages({connector,stream:'amazon.orders',context:f.context,store:s});
  await importPages({connector,stream:'amazon.orders',context:{...f.context,periodStart:'2026-09-01'},store:s});
  assert.equal(s.facts(account.id,'amazon.orders').length,1);
  const cursor=s.cursor(account.id,'amazon.orders');
  await assert.rejects(()=>importPages({connector:{async *pages(){yield f.payload;throw new Error('late page failed');}},stream:'amazon.orders',context:{...f.context,periodEnd:'2026-10-01'},store:s}));
  assert.equal(s.cursor(account.id,'amazon.orders'),cursor);assert.equal(s.facts(account.id,'amazon.orders').length,1);
  const run=s.begin('other','amazon.orders');assert.throws(()=>s.commit(run,normalize('amazon.orders',f.payload,f.context),{}),/Cross-account/);
 }finally{s.close();}
});
