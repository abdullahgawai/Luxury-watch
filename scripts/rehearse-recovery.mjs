// Local-only synthetic rehearsal. No production config, account or database is read.
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,readdirSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,relative,basename,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {recoverySchema} from './recovery-schema.mjs';
import {sealBackup,openBackup} from './recovery-archive.mjs';
const project=fileURLToPath(new URL('../',import.meta.url)),wrangler=join(project,'node_modules/wrangler/bin/wrangler.js');
const tables=['audit','corrections','fx_rates','images','imports','limits','listings','observations','records','revisions','sources','spec_evidence'];
const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--report'&&isAbsolute(args[1])))throw new Error('Usage: node scripts/rehearse-recovery.mjs [--report ABSOLUTE_JSON_PATH]');
const root=mkdtempSync(join(tmpdir(),'watch-recovery-')),source=join(root,'source'),restored=join(root,'restored'),key=randomBytes(32),databaseId=randomUUID();
const hash=b=>createHash('sha256').update(b).digest('hex'),quote=s=>"'"+String(s).replaceAll("'","''")+"'",at=new Date().toISOString();
function run(directory,action,options=[]){
 const result=spawnSync(process.execPath,[wrangler,'d1',action,'DB','--local','--config',join(directory,'wrangler.jsonc'),...options],{cwd:directory,encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024,env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
 if(result.error||result.status!==0)throw new Error(`Local D1 ${action} failed: ${result.error?.message||result.stderr||result.stdout}`);
 return result.stdout;
}
function query(directory,sql){return JSON.parse(run(directory,'execute',['--command',sql,'--json']));}
function snapshot(directory){return query(directory,tables.map(t=>`SELECT * FROM ${t} ORDER BY 1`).join(';')).map((r,i)=>({table:tables[i],rows:r.results}));}
try{
 for(const directory of [source,restored]){mkdirSync(directory);writeFileSync(join(directory,'wrangler.jsonc'),JSON.stringify({name:'watch-recovery-rehearsal',compatibility_date:'2026-10-14',d1_databases:[{binding:'DB',database_name:'synthetic-recovery-only',database_id:databaseId}]}));}
 const payload=quote(JSON.stringify({synthetic:true,note:"Recovery fixture only — not a real watch or customer; quote ' preserved"}));
 const migrations=readdirSync(join(project,'drizzle')).filter(f=>f.endsWith('.sql')).sort().map(f=>readFileSync(join(project,'drizzle',f),'utf8')).join('\n');
 const fixture=`
 INSERT INTO records VALUES('fixture','Recovery fixture','TEST-ONLY','synthetic',${payload},'draft',1,${quote(at)});
 INSERT INTO revisions VALUES('revision','fixture',1,${payload},'rehearsal',${quote(at)});
 INSERT INTO sources VALUES('source','fixture',${payload});
 INSERT INTO spec_evidence VALUES('spec','fixture','synthetic','source','test');
 INSERT INTO observations VALUES('observation','fixture','dealer_asking','IN','INR',1,${quote(at)},${payload});
 INSERT INTO listings VALUES('listing','fixture','observation',${payload});
 INSERT INTO images VALUES('image','fixture',${payload});
 INSERT INTO imports VALUES('fixture-import','synthetic-hash','fixture',${quote(at)});
 INSERT INTO fx_rates VALUES('fx','INR','AED','0.01','source',${quote(at)});
 INSERT INTO corrections VALUES('correction','/test-only','synthetic','Synthetic recovery claim','fixture@example.invalid','pending',${quote(at)});
 INSERT INTO audit VALUES('audit','rehearsal','fixture','synthetic',NULL,${payload},${quote(at)});
 INSERT INTO limits VALUES('limit',1,${Date.now()+3600000});`;
 const seed=join(root,'synthetic.sql');writeFileSync(seed,migrations+'\n'+fixture);
 process.stdout.write('Creating isolated synthetic D1 source…\n');run(source,'execute',['--file',seed,'--yes']);
 const before=snapshot(source),exportPath=join(root,'backup.sql');
 process.stdout.write('Exporting, encrypting and checking authenticated archive…\n');run(source,'export',['--no-data','--output',exportPath]);
 const dataPath=join(root,'data.sql');run(source,'export',['--no-schema','--output',dataPath]);
 // Create all referenced tables first, then defer row checks during the data import.
 const sql=Buffer.from(readFileSync(exportPath,'utf8')+'\nPRAGMA defer_foreign_keys=TRUE;\n'+readFileSync(dataPath,'utf8')),encrypted=sealBackup(sql,key);writeFileSync(join(root,'backup.enc'),encrypted,{mode:0o600});
 const decrypted=openBackup(readFileSync(join(root,'backup.enc')),key);assert.equal(hash(decrypted),hash(sql));
 const tampered=Buffer.from(encrypted);tampered[tampered.length-1]^=1;assert.throws(()=>openBackup(tampered,key));assert.throws(()=>openBackup(encrypted,randomBytes(32)));
 const restoreFile=join(root,'restore.sql');writeFileSync(restoreFile,decrypted,{mode:0o600});
 process.stdout.write('Restoring into a second disposable D1 database…\n');run(restored,'execute',['--file',restoreFile,'--yes']);
 const after=snapshot(restored);assert.deepEqual(after,before);
 // Inspect stopped local files read-only; D1's SQL authorizer blocks integrity_check.
 function inspect(directory){
  const state=join(directory,'.wrangler','state'),files=readdirSync(state,{recursive:true}).filter(f=>String(f).endsWith('.sqlite'));
  const schemas=[];
  for(const file of files){const db=new DatabaseSync(join(state,String(file)),{readOnly:true});
   try{if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='records'").get())continue;
    assert.equal(Object.values(db.prepare('PRAGMA integrity_check').get())[0],'ok');
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
    schemas.push(recoverySchema(db,tables));
   }finally{db.close();}
  }
  assert.equal(schemas.length,1);return schemas[0];
 }
 const sourceSchema=inspect(source),restoredSchema=inspect(restored);
 assert.deepEqual(restoredSchema,sourceSchema,'Restored application schema differs');
 assert.ok(restoredSchema.some(row=>row.type==='index'&&row.name==='limits_expiry_order'),'Current expiry index must survive recovery');
 assert.deepEqual(snapshot(source),before);
 const report={status:'passed',checkedAt:new Date().toISOString(),scope:'Synthetic local D1 only; no hosted backup or restore verified',tables:after.map(t=>({name:t.table,rows:t.rows.length})),sourceDigest:hash(JSON.stringify(before)),restoredDigest:hash(JSON.stringify(after)),sqlDigest:hash(sql),schema:{objects:sourceSchema.length,sourceDigest:hash(JSON.stringify(sourceSchema)),restoredDigest:hash(JSON.stringify(restoredSchema))},checks:['Wrangler local SQL export/import','AES-256-GCM round trip','Tampering rejected','Wrong key rejected','All application rows identical','Application table, index and trigger definitions identical','Current expiry index restored','SQLite integrity check','Foreign-key check','Source database unchanged'],keyHandling:'Ephemeral rehearsal key; synthetic archives removed after verification',hostedRecovery:'not_verified'};
 if(args.length)writeFileSync(args[1],JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify(report,null,2)+'\n');
}finally{
 key.fill(0);
 // Resolve and constrain the exact disposable target before recursive cleanup.
 const resolved=realpathSync(root),temp=realpathSync(tmpdir()),rel=relative(temp,resolved);
 if(!rel||rel.startsWith('..')||isAbsolute(rel)||!basename(resolved).startsWith('watch-recovery-'))throw new Error('Refusing cleanup outside the rehearsal temporary directory');
 rmSync(resolved,{recursive:true,force:true});
}
