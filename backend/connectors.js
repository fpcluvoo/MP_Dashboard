import {gunzipSync} from 'node:zlib';
import {streams} from '../integrations/registry.js';
import {kauflandHeaders} from './auth.js';
import {normalize} from '../integrations/normalize.js';
export function apiOrigin(provider,region='eu') {
  if(!['eu','na'].includes(region))throw new Error('Unsupported region');
  return {amazon:`https://sellingpartnerapi-${region}.amazon.com`,amazonAds:region==='eu'?'https://advertising-api-eu.amazon.com':'https://advertising-api.amazon.com',ebay:'https://api.ebay.com',otto:'https://api.otto.market',kaufland:'https://sellerapi.kaufland.com'}[provider];
}
export class DirectConnector {
  constructor({account,provider=account.provider,transport,tokens,clientId,profileId,kauflandCredentials,ebaySigner,approvedDownloadHosts=[]}) {
    Object.assign(this,{account,provider,transport,tokens,clientId,profileId,kauflandCredentials,ebaySigner,approvedDownloadHosts});
    this.origin=apiOrigin(provider,account.region);if(!this.origin)throw new Error('Unsupported provider');
  }
  async request(path,{method='GET',body}={}) {
    const url=new URL(path,this.origin);
    if(url.origin!==this.origin||url.username||url.password)throw new Error('Untrusted provider URL');
    const reportPaths={amazon:'/reports/2021-06-30/reports',amazonAds:'/reporting/reports',kaufland:'/v2/reports/bookings-new'};
    if(method!=='GET'&&!(method==='POST'&&url.pathname===reportPaths[this.provider]))throw new Error('Business write operations are disabled');
    const encoded=body===undefined?undefined:JSON.stringify(body);
    for(let authAttempt=0;authAttempt<2;authAttempt++) {
      let headers={Accept:'application/json'};
      if(encoded)headers['Content-Type']='application/json';
      if(this.provider==='kaufland')headers={...headers,...kauflandHeaders(this.kauflandCredentials??{},method,url.href,encoded??'')};
      else {
        if(!this.tokens)throw new Error('No credential provider configured');
        const token=await this.tokens.get(authAttempt===1);
        if(this.provider==='amazon')headers['x-amz-access-token']=token;
        else headers.Authorization=`Bearer ${token}`;
        if(this.provider==='amazonAds') {
          if(!this.profileId||!this.clientId)throw new Error('Ads profile and client ID required');
          headers['Amazon-Advertising-API-ClientId']=this.clientId;headers['Amazon-Advertising-API-Scope']=String(this.profileId);
          if(encoded)headers['Content-Type']='application/vnd.createasyncreportrequest.v3+json';
        }
        if(this.provider==='ebay'&&url.pathname.includes('/finances/')) {
          if(!this.ebaySigner)throw new Error('eBay Finances signing strategy must be configured for this account');
          headers={...headers,...await this.ebaySigner({url:url.href,method,body:encoded??'',headers})};
        }
      }
      try{return await this.transport.json(url.href,{method,headers,body:encoded});}
      catch(error){if(error.status===401&&authAttempt===0&&this.provider!=='kaufland')continue;throw error;}
    }
  }
  async *pages(streamId,query={}) {
    const stream=streams.find(s=>s.id===streamId&&s.provider===this.provider);
    if(!stream||stream.report)throw new Error('Unsupported paginated stream');
    const start=new URL(stream.path,this.origin);
    for(const [k,v] of Object.entries(query))if(v!=null)start.searchParams.set(k,String(v));
    if(this.provider==='kaufland'&&this.account.storefront)start.searchParams.set('storefront',this.account.storefront);
    let next=start.href;const seen=new Set();
    for(let page=0;next&&page<10000;page++) {
      if(seen.has(next))throw new Error('Pagination loop');seen.add(next);
      const result=await this.request(next);yield result;
      next=null;
      const token=stream.pagination==='amazonOrders'?result.pagination?.nextToken:stream.pagination==='amazonInventory'?result.pagination?.nextToken:result.payload?.nextToken;
      if(['amazonOrders','amazonToken','amazonInventory'].includes(stream.pagination)&&token) {
        const url=new URL(start);url.searchParams.set(stream.pagination==='amazonOrders'?'paginationToken':'nextToken',token);next=url.href;
      } else if(stream.pagination==='next')next=result.next??null;
      else if(stream.pagination==='links')next=result.links?.find(l=>l.rel==='next')?.href??null;
      else if(stream.pagination==='offset') {
        const p=result.pagination;
        if(p&&p.offset+p.limit<p.total){if(p.limit<=0)throw new Error('Invalid page size');const url=new URL(start);url.searchParams.set('offset',p.offset+p.limit);url.searchParams.set('limit',p.limit);next=url.href;}
      }
    }
    if(next)throw new Error('Pagination limit exceeded');
  }
  async createReport({start,end,reportTypeId='spAdvertisedProduct',adProduct='SPONSORED_PRODUCTS',groupBy,columns}) {
    if(this.provider==='amazon')return this.request('/reports/2021-06-30/reports',{method:'POST',body:{reportType:'GET_SALES_AND_TRAFFIC_REPORT',dataStartTime:start,dataEndTime:end,marketplaceIds:[this.account.marketplaceId],reportOptions:{dateGranularity:'DAY',asinGranularity:'CHILD'}}});
    if(this.provider!=='amazonAds')throw new Error('Provider has no report job driver');
    if(!groupBy?.length||!columns?.length)throw new Error('Explicit report dimensions/columns required');
    return this.request('/reporting/reports',{method:'POST',body:{startDate:start,endDate:end,configuration:{adProduct,reportTypeId,groupBy,columns,timeUnit:'DAILY',format:'GZIP_JSON'}}});
  }
  async pollReport(reportId) {
    if(this.provider==='amazon') {
      const r=await this.request(`/reports/2021-06-30/reports/${encodeURIComponent(reportId)}`);
      if(['FATAL','CANCELLED'].includes(r.processingStatus))throw new Error(`Report ${r.processingStatus}`);
      if(r.processingStatus!=='DONE')return {ready:false,status:r.processingStatus};
      const d=await this.request(`/reports/2021-06-30/documents/${encodeURIComponent(r.reportDocumentId)}`);
      return {ready:true,url:d.url,compression:d.compressionAlgorithm};
    }
    if(this.provider!=='amazonAds')throw new Error('Provider has no report job driver');
    const r=await this.request(`/reporting/reports/${encodeURIComponent(reportId)}`);
    if(['FAILURE','FAILED','CANCELLED'].includes(r.status))throw new Error(`Report ${r.status}`);
    return r.status==='COMPLETED'?{ready:true,url:r.url,compression:'GZIP'}:{ready:false,status:r.status};
  }
  async listAmazonSettlements(query={}) {
    if(this.provider!=='amazon')throw new Error('Amazon only');
    const p=new URLSearchParams({reportTypes:'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2',...query});
    return this.request(`/reports/2021-06-30/reports?${p}`);
  }
  async requestKauflandBookings({start,end}) {
    if(this.provider!=='kaufland')throw new Error('Kaufland only');
    return this.request(`/v2/reports/bookings-new?storefront=${encodeURIComponent(this.account.storefront)}&version=v2`,{method:'POST',body:{date_from:start,date_to:end}});
  }
  async pollKauflandBookings(reportId) {
    if(this.provider!=='kaufland')throw new Error('Kaufland only');
    const r=(await this.request(`/v2/reports/${encodeURIComponent(reportId)}`)).data;
    const status=String(r?.status).toUpperCase();
    if(['FAILED','ERROR','CANCELLED'].includes(status))throw new Error('Bookings report failed');
    return status==='DONE'?{ready:true,url:r.url,format:'text'}:{ready:false,status};
  }
  async downloadReport(job) {
    const url=new URL(job.url);
    if(!job.ready||url.protocol!=='https:'||url.username||url.password||!this.approvedDownloadHosts.includes(url.hostname))throw new Error('Report download host must be explicitly approved');
    // Signed download URLs NEVER receive seller tokens or authentication headers.
    let bytes=await this.transport.bytes(url.href,{headers:{}});
    if(job.compression==='GZIP')bytes=gunzipSync(bytes,{maxOutputLength:32*1024*1024});
    else if(job.compression)throw new Error('Unsupported report compression');
    if(job.format==='text')return bytes.toString('utf8');
    try{return JSON.parse(bytes.toString('utf8'));}catch{throw new Error('Invalid report JSON');}
  }
}
export async function importPages({connector,stream,query,context,store}) {
  const run=store.begin(context.accountId,stream);let count=0;
  try {
    // Stage first. Only successful complete imports may replace facts or advance cursors.
    const staged=[];
    for await(const page of connector.pages(stream,query))staged.push(...normalize(stream,page,context));
    count=staged.length;store.commit(run,staged,{through:context.periodEnd});return {run,count};
  } catch(error){store.fail(run,error.status??'IMPORT_ERROR');throw error;}
}
