// Private backend CLI. Never imported into the browser or called by the Pages build.
import {readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {channels,streams} from '../integrations/registry.js';
import {HttpTransport} from '../backend/http.js';
import {OAuthTokens} from '../backend/auth.js';
import {DirectConnector,importPages} from '../backend/connectors.js';
import {IntegrationStore} from '../backend/store.js';
import {normalize} from '../integrations/normalize.js';
const [configPath,mode]=process.argv.slice(2);
if(!configPath||!['--plan','--execute'].includes(mode))throw new Error('Usage: node --use-env-proxy scripts/import-direct.js private-config.json --plan|--execute');
const config=JSON.parse(readFileSync(configPath,'utf8'));
const registered=channels.find(c=>c.id===config.accountId),stream=streams.find(s=>s.id===config.stream);
if(!registered||!stream||!(registered.provider===stream.provider||registered.provider==='amazon'&&stream.provider==='amazonAds'))throw new Error('Invalid account/stream');
if(!/^\d{4}-\d{2}-\d{2}$/.test(config.periodStart)||!/^\d{4}-\d{2}-\d{2}$/.test(config.periodEnd)||config.periodStart>config.periodEnd)throw new Error('Explicit ISO reporting period required');
if(mode==='--plan') {console.log(JSON.stringify({account:registered.label,stream:stream.id,method:stream.report?'report job':'GET',path:stream.path,periodStart:config.periodStart,periodEnd:config.periodEnd,willContactProvider:false}));process.exit(0);}
if(stream.provider!=='amazon'&&config.contractReviewed!==true)throw new Error('Current official contract review required before live use of mirrored/SDK contracts');
if(!config.accountTimeZoneConfirmed)throw new Error('Confirm reporting timezone for this account before executing');
const prefix={amazon:'AMAZON_SP',amazonAds:'AMAZON_ADS',ebay:'EBAY',otto:'OTTO',kaufland:'KAUFLAND'}[stream.provider];
const transport=new HttpTransport();
const tokens=stream.provider==='kaufland'?null:new OAuthTokens({provider:stream.provider,transport,clientId:process.env[`${prefix}_CLIENT_ID`],clientSecret:process.env[`${prefix}_CLIENT_SECRET`],refreshToken:process.env[`${prefix}_REFRESH_TOKEN`],scope:config.scope});
const connector=new DirectConnector({account:registered,provider:stream.provider,transport,tokens,clientId:process.env[`${prefix}_CLIENT_ID`],profileId:config.profileId,kauflandCredentials:{clientKey:process.env.KAUFLAND_CLIENT_KEY,secretKey:process.env.KAUFLAND_SECRET_KEY},approvedDownloadHosts:config.approvedDownloadHosts??[]});
mkdirSync('.data/private-imports',{recursive:true,mode:0o700});
const store=new IntegrationStore(resolve('.data/private-imports/integrations.sqlite'));
const context={...config,currency:registered.currency};
try {
 if(!stream.report) {
  if(!config.query)throw new Error('Explicit API query required; periods are not silently translated into provider query semantics');
  const result=await importPages({connector,stream:stream.id,query:config.query,context,store});console.log(JSON.stringify({status:'completed',count:result.count}));
 } else {
  // One bounded step per invocation. Durable report ID avoids creating a new job on every poll.
  const jobPath=resolve('.data/private-imports',`${registered.id}-${stream.id}-${config.periodStart}-${config.periodEnd}.json`);
  let job;
  try {job=JSON.parse(readFileSync(jobPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!job) {
    const result=await connector.createReport({start:config.periodStart,end:config.periodEnd,...config.report});
    if(!result.reportId)throw new Error('Provider did not return a report ID');
    job={reportId:result.reportId,accountId:registered.id,stream:stream.id,configuration:JSON.stringify(config.report??{}),status:'pending'};
    writeFileSync(jobPath,JSON.stringify(job),{mode:0o600});console.log('Report requested. Invoke again later to poll.');
  } else {
    if(job.accountId!==registered.id||job.stream!==stream.id||job.configuration!==JSON.stringify(config.report??{}))throw new Error('Existing job configuration differs');
    if(job.status==='completed'){console.log('Report already imported. A deliberate new job is required for source corrections.');}
    else {
      const ready=await connector.pollReport(job.reportId);
      if(!ready.ready)console.log(`Report pending: ${ready.status}`);
      else {
        const payload=await connector.downloadReport(ready);const rows=normalize(stream.id,payload,context);
        const run=store.begin(registered.id,stream.id);
        try{store.commit(run,rows,{through:config.periodEnd});}catch(error){store.fail(run,'IMPORT_ERROR');throw error;}
        job.status='completed';writeFileSync(jobPath+'.tmp',JSON.stringify(job),{mode:0o600});renameSync(jobPath+'.tmp',jobPath);
        console.log(JSON.stringify({status:'completed',count:rows.length}));
      }
    }
  }
 }
} finally {store.close();}
