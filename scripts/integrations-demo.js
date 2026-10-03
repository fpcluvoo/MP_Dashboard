import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {channels,streams,providers,capabilityMatrix} from '../integrations/registry.js';
import {fixtureFor} from '../integrations/fixtures.js';
import {normalize} from '../integrations/normalize.js';
import {calculate} from '../integrations/metrics.js';
import {IntegrationStore} from '../backend/store.js';
const root=new URL('../',import.meta.url);mkdirSync(new URL('.data/',root),{recursive:true});mkdirSync(new URL('src/data/',root),{recursive:true});
// Isolated synthetic dry-run store. This is never the real integration database.
const store=new IntegrationStore(fileURLToPath(new URL('.data/integration-fixtures.sqlite',root)));
const results=[];
try {
 for(const channel of channels)for(const stream of streams.filter(s=>s.provider===channel.provider||channel.provider==='amazon'&&s.provider==='amazonAds')) {
  const {payload,context}=fixtureFor(stream.id,channel);const facts=normalize(stream.id,payload,context);
  const run=store.begin(channel.id,stream.id);store.commit(run,facts,{through:context.periodEnd});
  results.push({accountId:channel.id,stream:stream.id,rows:facts.length,status:'fixture-tested',metrics:calculate(facts)});
 }
 writeFileSync(new URL('src/data/integrations.generated.json',root),JSON.stringify({channels,providers,streams,capabilityMatrix,results,mode:'synthetic-contract-tests'}));
 console.log(`Integration dry-run: ${results.length} stream/account combinations normalized and persisted. No remote accounts contacted.`);
}finally{store.close();}
