import {test} from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';
import {consumeHourlyLimit} from '../lib/hourly-limit.mjs';
const now=Date.parse('2026-10-18T06:30:00Z');
function database(){
 const sqlite=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
 const statement=(sql,values=[])=>({bind(...v){return statement(sql,v);},async run(){return sqlite.prepare(sql).run(...values);},async first(){return sqlite.prepare(sql).get(...values)||null;}});
 return {sqlite,prepare:statement};
}
async function legacyKey(key,at){return Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key+Math.floor(at/3600000)))).toString('hex');}
test('bounded indexed cleanup removes only expired counters and preserves receipts/history',async()=>{
 const db=database(),insert=db.sqlite.prepare('INSERT INTO limits VALUES(?,?,?)');
 for(let i=0;i<250;i++)insert.run('expired-'+i,99,now-3600001);
 insert.run('recently-expired-sentinel',9,now-1);
 insert.run('active-sentinel',7,now+3600000);
 db.sqlite.prepare('INSERT INTO corrections(id,page,field,claim,created_at) VALUES(?,?,?,?,?)').run('qa-receipt','/test','synthetic','Synthetic receipt only',new Date(now).toISOString());
 db.sqlite.prepare('INSERT INTO audit(id,actor,entity_id,action,at) VALUES(?,?,?,?,?)').run('qa-audit','synthetic','qa-receipt','synthetic',new Date(now).toISOString());
 const retained=()=>JSON.stringify(['corrections','audit'].map(t=>db.sqlite.prepare('SELECT * FROM '+t).all()));const before=retained();
 for(const [i,left] of [[0,150],[1,50],[2,0]]){assert.equal(await consumeHourlyLimit(db,'synthetic-'+i,5,now),true);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM limits WHERE expires_at<=?').get(now-3600000).n,left);}
 assert.equal(db.sqlite.prepare("SELECT count FROM limits WHERE key='active-sentinel'").get().count,7);assert.equal(retained(),before);
 assert.equal(db.sqlite.prepare("SELECT count FROM limits WHERE key='recently-expired-sentinel'").get().count,9);
 const plan=db.sqlite.prepare('EXPLAIN QUERY PLAN SELECT key FROM limits WHERE expires_at<=? ORDER BY expires_at,key LIMIT ?').all(now,100);assert.ok(plan.some(row=>row.detail.includes('limits_expiry_order')));
 db.sqlite.close();
});
test('deployment retains legacy active keys, counts and expiry instead of resetting quotas',async()=>{
 const db=database(),key=await legacyKey('synthetic-active',now),expiry=now+3600000;
 db.sqlite.prepare('INSERT INTO limits VALUES(?,?,?)').run(key,5,expiry);
 assert.equal(await consumeHourlyLimit(db,'synthetic-active',5,now),false);
 assert.deepEqual({...db.sqlite.prepare('SELECT * FROM limits WHERE key=?').get(key)},{key,count:6,expires_at:expiry});
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM limits').get().n,1);db.sqlite.close();
});
test('parallel checks atomically enforce the threshold and persist only hashed keys',async()=>{
 const db=database(),results=await Promise.all(Array.from({length:20},()=>consumeHourlyLimit(db,'synthetic-parallel',5,now)));
 assert.equal(results.filter(Boolean).length,5);const rows=db.sqlite.prepare('SELECT * FROM limits').all();assert.equal(rows.length,1);assert.match(rows[0].key,/^[a-f0-9]{64}$/);assert.equal(rows[0].count,20);assert.equal(rows[0].expires_at,Date.parse('2026-10-18T07:00:00Z'));db.sqlite.close();
});
test('hour boundary grants a distinct new bucket while retaining the old bucket through its grace period',async()=>{
 const db=database(),boundary=Date.parse('2026-10-18T07:00:00Z');
 assert.equal(await consumeHourlyLimit(db,'synthetic-boundary',1,boundary-1),true);assert.equal(await consumeHourlyLimit(db,'synthetic-boundary',1,boundary-1),false);
 assert.equal(await consumeHourlyLimit(db,'synthetic-boundary',1,boundary),true);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM limits').get().n,2);
 const oldKey=await legacyKey('synthetic-boundary',boundary-1);assert.equal(db.sqlite.prepare('SELECT count FROM limits WHERE key=?').get(oldKey).count,2);
 assert.equal(await consumeHourlyLimit(db,'synthetic-boundary',1,boundary+3600000),true);assert.equal(db.sqlite.prepare('SELECT count FROM limits WHERE key=?').get(oldKey),undefined);db.sqlite.close();
});
test('invalid inputs, corrupt counts and cleanup failures cannot grant a request',async()=>{
 const inaccessible={prepare(){throw Error('Unexpected database access');}};
 for(const args of [['',5,now],['x',0,now],['x',5,NaN],['x',5,-1]])await assert.rejects(()=>consumeHourlyLimit(inaccessible,...args),/Invalid hourly limit/);
 const db=database(),key=await legacyKey('synthetic-corrupt',now);db.sqlite.prepare('INSERT INTO limits VALUES(?,?,?)').run(key,-10,now+1000);assert.equal(await consumeHourlyLimit(db,'synthetic-corrupt',5,now),false);db.sqlite.close();
 let charged=false;const failed={prepare(sql){if(sql.startsWith('INSERT'))charged=true;return {bind(){return this;},async run(){throw Error('Synthetic cleanup failure');}};}};
 await assert.rejects(()=>consumeHourlyLimit(failed,'synthetic-failure',5,now));assert.equal(charged,false);
});
