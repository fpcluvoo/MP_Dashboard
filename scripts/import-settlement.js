import {readFileSync,mkdirSync} from 'node:fs';
import {settlementFile} from '../integrations/settlement-file.js';
import {IntegrationStore} from '../backend/store.js';
const [configPath,filePath]=process.argv.slice(2);if(!configPath||!filePath)throw new Error('Usage: node scripts/import-settlement.js private-mapping.json private-report.csv');
const config=JSON.parse(readFileSync(configPath,'utf8'));
const rows=settlementFile(readFileSync(filePath,'utf8'),config);
mkdirSync('.data/private-imports',{recursive:true,mode:0o700});
const store=new IntegrationStore('.data/private-imports/integrations.sqlite');const run=store.begin(config.accountId,'settlement.file');
try{store.commit(run,rows,{fileImported:true});console.log(JSON.stringify({imported:rows.length,status:'requires-reconciliation'}));}catch(e){store.fail(run,'FILE_IMPORT_ERROR');throw e;}finally{store.close();}
