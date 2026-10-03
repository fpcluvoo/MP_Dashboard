import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
export class IntegrationStore {
  constructor(path) {
    this.db=new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS api_runs(id TEXT PRIMARY KEY,account TEXT NOT NULL,stream TEXT NOT NULL,status TEXT NOT NULL,error_code TEXT,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS api_facts(account TEXT NOT NULL,stream TEXT NOT NULL,source_key TEXT NOT NULL,period_start TEXT NOT NULL,period_end TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(account,stream,source_key,period_start,period_end));
      CREATE TABLE IF NOT EXISTS api_cursors(account TEXT NOT NULL,stream TEXT NOT NULL,cursor TEXT NOT NULL,PRIMARY KEY(account,stream));`);
  }
  begin(account,stream) {const id=randomUUID();this.db.prepare('INSERT INTO api_runs VALUES(?,?,?,\'running\',NULL,?)').run(id,account,stream,new Date().toISOString());return id;}
  commit(run,rows,cursor) {
    const r=this.db.prepare('SELECT * FROM api_runs WHERE id=?').get(run);if(!r||r.status!=='running')throw new Error('Invalid run');
    const identity=row=>row.grain==='event'?['','']:row.grain==='snapshot'||row.grain==='ad-period'?[row.date??row.periodEnd,row.date??row.periodEnd]:[row.periodStart,row.periodEnd];
    const keys=new Set();for(const row of rows){if(row.accountId!==r.account||row.stream!==r.stream)throw new Error('Cross-account or stream fact');const key=JSON.stringify([row.sourceKey,...identity(row)]);if(keys.has(key))throw new Error('Duplicate fact across pages');keys.add(key);}
    this.db.exec('BEGIN');
    try {
      const insert=this.db.prepare('INSERT INTO api_facts VALUES(?,?,?,?,?,?) ON CONFLICT(account,stream,source_key,period_start,period_end) DO UPDATE SET payload=excluded.payload');
      for(const row of rows)insert.run(r.account,r.stream,row.sourceKey,...identity(row),JSON.stringify(row));
      this.db.prepare('INSERT INTO api_cursors VALUES(?,?,?) ON CONFLICT(account,stream) DO UPDATE SET cursor=excluded.cursor').run(r.account,r.stream,JSON.stringify(cursor));
      this.db.prepare("UPDATE api_runs SET status='completed' WHERE id=?").run(run);this.db.exec('COMMIT');
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  fail(run,code) {this.db.prepare("UPDATE api_runs SET status='failed',error_code=? WHERE id=? AND status='running'").run(String(code),run);}
  facts(account,stream) {return this.db.prepare('SELECT payload FROM api_facts WHERE account=? AND stream=?').all(account,stream).map(r=>JSON.parse(r.payload));}
  cursor(account,stream) {return this.db.prepare('SELECT cursor FROM api_cursors WHERE account=? AND stream=?').get(account,stream)?.cursor??null;}
  close(){this.db.close();}
}
