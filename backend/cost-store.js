import {DatabaseSync} from 'node:sqlite';
import {addCostVersion} from '../profit/costs.js';
export class CostStore {
 constructor(path){this.db=new DatabaseSync(path);this.db.exec(`CREATE TABLE IF NOT EXISTS sku_cost_state (id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,payload TEXT NOT NULL);INSERT OR IGNORE INTO sku_cost_state VALUES(1,0,'[]');CREATE TABLE IF NOT EXISTS sku_cost_audit(revision INTEGER PRIMARY KEY,changed_at TEXT NOT NULL,actor TEXT NOT NULL,payload TEXT NOT NULL);`);}
 read(){const r=this.db.prepare('SELECT * FROM sku_cost_state WHERE id=1').get();return {revision:r.revision,records:JSON.parse(r.payload)};}
 add(input,{expectedRevision,actor}) {
  if(!actor?.trim())throw new Error('Bearbeiter erforderlich');
  this.db.exec('BEGIN IMMEDIATE');
  try {const current=this.read();if(expectedRevision!==current.revision)throw new Error('Kostenstand wurde inzwischen geändert; neu laden');
   const records=addCostVersion(current.records,input),revision=current.revision+1,payload=JSON.stringify(records);
   this.db.prepare('UPDATE sku_cost_state SET revision=?,payload=? WHERE id=1').run(revision,payload);
   this.db.prepare('INSERT INTO sku_cost_audit VALUES(?,?,?,?)').run(revision,new Date().toISOString(),actor,payload);
   this.db.exec('COMMIT');return {revision,records};
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 history(){return this.db.prepare('SELECT revision,changed_at,actor FROM sku_cost_audit ORDER BY revision').all();}
 close(){this.db.close();}
}
