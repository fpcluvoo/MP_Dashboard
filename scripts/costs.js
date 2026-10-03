// Local private administration. Never run by prebuild or exported by Pages.
import {mkdirSync,readFileSync} from 'node:fs';
import {CostStore} from '../backend/cost-store.js';
const [command,path]=process.argv.slice(2);
if(!['list','add','history'].includes(command))throw new Error('Usage: node scripts/costs.js list|history|add [private-input.json]');
mkdirSync('.data/private-imports',{recursive:true,mode:0o700});
const store=new CostStore('.data/private-imports/costs.sqlite');
try {
 if(command==='list')console.log(JSON.stringify(store.read(),null,2));
 else if(command==='history')console.log(JSON.stringify(store.history(),null,2));
 else {const {cost,expectedRevision,actor}=JSON.parse(readFileSync(path,'utf8'));const result=store.add(cost,{expectedRevision,actor});console.log(JSON.stringify({revision:result.revision,records:result.records.length}));}
}finally{store.close();}
