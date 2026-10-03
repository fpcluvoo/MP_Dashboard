import {readFileSync,mkdirSync} from 'node:fs';
import {CostStore} from '../backend/cost-store.js';
import {profitReport} from '../profit/calculate.js';
const [path]=process.argv.slice(2);if(!path)throw new Error('Usage: node scripts/profit.js private-reviewed-profit-input.json');
mkdirSync('.data/private-imports',{recursive:true,mode:0o700});const store=new CostStore('.data/private-imports/costs.sqlite');
try {const input=JSON.parse(readFileSync(path,'utf8'));console.log(JSON.stringify(profitReport({...input,costs:store.read().records}),null,2));}finally{store.close();}
