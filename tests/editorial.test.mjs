import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {readFileSync,readdirSync} from 'node:fs';
import {demoWatches} from '../lib/demo.mjs';
import {publishedObservations} from '../lib/domain.mjs';
import {historyFixture} from './fixtures/history.mjs';
import {historySeries} from '../lib/history.mjs';
import {publicWatch} from '../lib/public-catalogue.mjs';
const sqlite=new DatabaseSync(':memory:');
for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
const statement=(sql,values=[])=>({bind(...v){return statement(sql,v);},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {results:sqlite.prepare(sql).all(...values)};},async run(){return sqlite.prepare(sql).run(...values);},sql,values});
globalThis.testEnv={DB:{prepare:statement,async batch(a){sqlite.exec('BEGIN');try{const r=a.map(s=>sqlite.prepare(s.sql).run(...s.values));sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}},EDITOR_USER_IDS:'editor',DATA_MODE:'production'};
const b=await build({entryPoints:['lib/editorial.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'test-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env = globalThis.testEnv;',loader:'js'}));}}]});
const {editorialApi}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
async function call(path,body,editor=true,extra={},query=''){const req=new Request('https://test.local/api/'+path.join('/')+(query?'?'+query:''),{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',origin:'https://test.local',...(editor?{'oai-authenticated-user-id':'editor'}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});const r=await editorialApi(req,path);return {status:r.status,data:await r.json()};}
test('server rejects logged-out editor access, cross-origin writes, and non-editor identity',async()=>{assert.equal((await call(['admin'],undefined,false)).status,403);assert.equal((await call(['admin'],undefined,true,{'oai-authenticated-user-id':'outsider'})).status,403);assert.equal((await call(['admin','imports'],{},true,{origin:'https://evil.test'})).status,403);});
test('imports are idempotent, publication requires review, revisions rollback and moderation persist',async()=>{
 const record=structuredClone(demoWatches[0]);record.demo=false;record.sources.forEach(s=>s.rights='approved');const key={'idempotency-key':'test-import-001'};
 assert.equal((await call(['admin','imports'],{record},true,key)).status,201);
 assert.equal((await call(['admin','imports'],{record},true,key)).data.idempotent,true);
 assert.equal((await call(['admin','imports'],{record:{...record,model:'conflict'}},true,key)).status,409);
 assert.equal((await call(['admin','records',record.id],{action:'publish',revision:1})).status,400);
 assert.equal(sqlite.prepare("SELECT count(*) n FROM records WHERE state='published'").get().n,0);
 assert.equal((await call(['admin','records',record.id],{action:'review',revision:1})).status,200);
 assert.equal((await call(['admin','records',record.id],{action:'publish',revision:1})).status,409);
 assert.equal((await call(['admin','records',record.id],{action:'publish',revision:2})).data.state,'published');
 assert.ok(sqlite.prepare('SELECT count(*) n FROM spec_evidence').get().n>0);
 assert.equal((await call(['admin','records',record.id],{action:'rollback',revision:3,targetRevision:1})).data.state,'draft');
 const correction=await call(['corrections'],{page:'/watches',field:'dial',claim:'Test correction with enough detail'},false);assert.equal(correction.status,201);
 assert.equal((await call(['admin','corrections',correction.data.id],{state:'resolved'})).status,200);
 assert.equal(sqlite.prepare('SELECT state FROM corrections WHERE id=?').get(correction.data.id).state,'resolved');
 assert.ok(sqlite.prepare('SELECT count(*) n FROM audit').get().n>=5);
 assert.equal((await call(['admin','imports'],{record:demoWatches[1]},true,{'idempotency-key':'test-fixture-001'})).status,400);
});
test('public corrections validate input and enforce durable rate limits',async()=>{assert.equal((await call(['corrections'],{page:'//evil',field:'a',claim:'short'},false)).status,400);for(let i=0;i<4;i++)assert.equal((await call(['corrections'],{page:'/',field:'size',claim:'Testing rate limiter with valid correction'},false)).status,201);assert.equal((await call(['corrections'],{page:'/',field:'size',claim:'Testing rate limiter with valid correction'},false)).status,429);});
test('provider evaluation is disabled without credentials and never publishes candidates',async()=>{const r=await call(['admin','provider'],{reference:'124060'});assert.equal(r.status,200);assert.equal(r.data.status,'not_configured');assert.equal(sqlite.prepare("SELECT count(*) n FROM records WHERE state='published'").get().n,0);});
test('variant identities cannot be revised into a different configuration',async()=>{const r=sqlite.prepare('SELECT payload,revision FROM records LIMIT 1').get();const record=JSON.parse(r.payload);record.dial='Another dial';assert.equal((await call(['admin','records',record.id],{action:'revise',revision:r.revision,record})).status,400);});

test('publication keeps archived retail out of current observations',async()=>{
 const row=sqlite.prepare('SELECT payload,revision FROM records LIMIT 1').get(),record=JSON.parse(row.payload);
 const archived={id:'archive-test',variantId:record.id,type:'official_retail',country:'AE',currency:'AED',amountMinor:100,condition:'new',boxPapers:'full set',sellerType:'manufacturer',sourceId:record.sources[0].id,evidence:'Synthetic test only',taxStatus:'unknown',observedAt:'2026-10-12T12:00:00Z',checkedAt:'2026-10-13T12:00:00Z',status:'archived_research',retrievalMethod:'cached_web_research',archivalReason:'Synthetic test archive; unavailable as current retail'};
 record.prices.push(archived);
 assert.equal((await call(['admin','records',record.id],{action:'revise',revision:row.revision,record})).status,200);
 assert.equal((await call(['admin','records',record.id],{action:'review',revision:row.revision+1})).status,200);
 assert.equal((await call(['admin','records',record.id],{action:'publish',revision:row.revision+2})).status,200);
 const stored=JSON.parse(sqlite.prepare('SELECT payload FROM records WHERE id=?').get(record.id).payload);
 assert.equal(stored.prices.find(p=>p.id==='archive-test').status,'archived_research');
 assert.ok(!publishedObservations(stored).some(p=>p.id==='archive-test'));
 assert.equal(JSON.parse(sqlite.prepare('SELECT payload FROM observations WHERE id=?').get(record.id+':archive-test').payload).status,'archived_research');
});

test('health checks are protected, count freshness and never expose secrets or contact data',async()=>{
 assert.equal((await call(['admin','health'],undefined,false)).status,403);
 assert.equal((await call(['admin','health'],undefined,true,{'oai-authenticated-user-id':'outsider'})).status,403);
 const now=Date.now(),recordId=demoWatches[0].id;
 const before=(await call(['admin','health'])).data;
 const fixtures=[['stale','published',new Date(now-31*86400000).toISOString()],['invalid','published','bad-date'],['fresh','published',new Date(now-1000).toISOString()],['archive','archived_research','bad-date']];
 for(const [id,status,checkedAt] of fixtures)sqlite.prepare('INSERT INTO observations VALUES(?,?,?,?,?,?,?,?)').run('health-'+id,recordId,'official_retail','AE','AED',1,new Date(now).toISOString(),JSON.stringify({status,checkedAt,type:'official_retail'}));
 globalThis.testEnv.THEWATCHAPI_TOKEN='SECRET-TEST-SENTINEL';
 try{const response=await call(['admin','health']),r=response.data;assert.equal(response.status,200);assert.equal(r.database,'ok');assert.equal(r.prices.checked,before.prices.checked+3);assert.equal(r.prices.stale,before.prices.stale+1);assert.equal(r.prices.invalid,before.prices.invalid+1);assert.equal(r.provider.tokenConfigured,true);assert.equal(r.automation.hostedRestore,'not_verified');assert.ok(!JSON.stringify(r).includes('SECRET-TEST-SENTINEL'));assert.ok(!JSON.stringify(r).includes('contact'));assert.equal(r.corrections.pending,4);
 }finally{delete globalThis.testEnv.THEWATCHAPI_TOKEN;for(const [id] of fixtures)sqlite.prepare('DELETE FROM observations WHERE id=?').run('health-'+id);}
 const db=globalThis.testEnv.DB;globalThis.testEnv.DB={prepare(){throw new Error('SENSITIVE DATABASE ERROR');}};
 try{const r=await call(['admin','health']);assert.equal(r.status,503);assert.ok(!JSON.stringify(r).includes('SENSITIVE'));}finally{globalThis.testEnv.DB=db;}
});

async function drain(path,state='all'){
 const rows=[],cursors=new Set();let cursor=null;
 do{const response=await call(path,undefined,true,{},new URLSearchParams({state,...(cursor?{cursor}:{})}).toString());assert.equal(response.status,200);assert.ok(response.data.rows.length<=25);rows.push(...response.data.rows);cursor=response.data.nextCursor;assert.equal(response.data.hasMore,!!cursor);if(cursor){assert.ok(!cursors.has(cursor));cursors.add(cursor);}assert.ok(cursors.size<30);}while(cursor);
 assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);return rows;
}
test('all editorial queues remain reachable beyond 100 rows with tied timestamps and bounded pages',async()=>{
 const at='2026-10-14T12:00:00.000Z';
 for(let i=0;i<107;i++){
  const id='pagination-'+String(i).padStart(3,'0');
  sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?)').run(id,'Synthetic test','TEST-'+i,'fixture','{}',i%2?'draft':'review',1,at);
  sqlite.prepare('INSERT INTO corrections VALUES(?,?,?,?,?,?,?)').run(id,'/synthetic-test','test','Synthetic pagination only','test@example.invalid',i%2?'pending':'resolved',at);
  sqlite.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?,?)').run(id,'test',id,'synthetic',null,'{}',at);
 }
 try{
  for(const table of ['records','corrections','audit']){const rows=await drain(['admin','queues',table]),expected=sqlite.prepare(`SELECT id FROM ${table} ORDER BY ${table==='records'?'updated_at':table==='corrections'?'created_at':'at'} DESC,id DESC`).all().map(row=>row.id);assert.deepEqual(rows.map(row=>row.id),expected);}
  const pending=await drain(['admin','queues','corrections'],'pending');assert.ok(pending.length>25);assert.ok(pending.every(row=>row.state==='pending'));
  const drafts=await drain(['admin','queues','records'],'draft');assert.ok(drafts.every(row=>row.state==='draft'));
  const first=(await call(['admin','queues','corrections'],undefined,true,{},'state=pending')).data;
  sqlite.prepare('INSERT INTO corrections VALUES(?,?,?,?,?,?,?)').run('pagination-new','/test','test','Synthetic new arrival',null,'pending','2026-10-16T12:00:00.000Z');
  const second=await call(['admin','queues','corrections'],undefined,true,{},new URLSearchParams({state:'pending',cursor:first.nextCursor}).toString());assert.equal(second.status,200);assert.ok(!second.data.rows.some(row=>first.rows.some(previous=>previous.id===row.id)));
 }finally{for(const table of ['records','corrections','audit'])sqlite.prepare(`DELETE FROM ${table} WHERE id LIKE 'pagination-%'`).run();}
});
test('queue cursors reject cross-filter reuse, malformed inputs and unauthorised readers',async()=>{
 for(const path of [['admin','queues','records'],['admin','queues','corrections'],['admin','queues','audit'],['admin','revisions',demoWatches[0].id]]){
  assert.equal((await call(path,undefined,false)).status,403);assert.equal((await call(path,undefined,true,{'oai-authenticated-user-id':'outsider'})).status,403);
 }
 const token=Buffer.from(JSON.stringify([1,JSON.stringify(['corrections','pending',null]),'2026-10-14T12:00:00Z','id'])).toString('base64url');
 for(const query of ['cursor=bad!','cursor='+('A'.repeat(1025)),'state=invalid','cursor='+token,'state='+encodeURIComponent("pending' OR 1=1 --")])assert.equal((await call(['admin','queues','records'],undefined,true,{},query)).status,400);
 assert.equal((await call(['admin','queues','corrections'],undefined,true,{},'state=all&cursor='+token)).status,400);
 assert.equal((await call(['admin','queues','secrets'])).status,404);assert.equal((await call(['admin','revisions','missing'])).status,404);
 const database=globalThis.testEnv.DB;globalThis.testEnv.DB={prepare(){throw new Error('SECRET SQL ERROR');}};
 try{const r=await call(['admin','queues','records']);assert.equal(r.status,503);assert.ok(!JSON.stringify(r).includes('SECRET'));}finally{globalThis.testEnv.DB=database;}
});
test('per-record history reaches revisions older than the global 300 cutoff and rollback stays a draft',async()=>{
 const record=JSON.parse(sqlite.prepare('SELECT payload FROM records LIMIT 1').get().payload);record.id='history-test';record.status='draft';record.prices=[];const payload=JSON.stringify(record);
 sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?)').run(record.id,record.brand,record.reference,'synthetic-history',payload,'draft',306,'2026-10-14T12:00:00Z');
 for(let revision=1;revision<=306;revision++)sqlite.prepare('INSERT INTO revisions VALUES(?,?,?,?,?,?)').run('history-'+revision,record.id,revision,payload,'test','2026-10-14T12:00:00Z');
 try{
  const rows=await drain(['admin','revisions',record.id]);assert.equal(rows.length,306);assert.equal(rows[0].revision,306);assert.equal(rows.at(-1).revision,1);assert.ok(rows.every(row=>row.record_id===record.id&&!Object.hasOwn(row,'payload')));
  const first=(await call(['admin','revisions',record.id])).data;
  assert.equal((await call(['admin','revisions',demoWatches[0].id],undefined,true,{},'cursor='+first.nextCursor)).status,400);
  const restored=await call(['admin','records',record.id],{action:'rollback',revision:306,targetRevision:1});assert.equal(restored.status,200);assert.equal(restored.data.state,'draft');assert.equal(restored.data.revision,307);
 }finally{sqlite.prepare('DELETE FROM revisions WHERE record_id=?').run(record.id);sqlite.prepare('DELETE FROM audit WHERE entity_id=?').run(record.id);sqlite.prepare('DELETE FROM records WHERE id=?').run(record.id);}
});

test('correction retries return one receipt after moderation and do not consume a new-submission slot',async()=>{
 const key=crypto.randomUUID(),headers={'idempotency-key':key,'cf-connecting-ip':'retry-test'},body={page:'/test?market=AE',field:'Synthetic test',claim:'Synthetic retry test only; no public correction.',contact:'test@example.invalid'};
 const first=await call(['corrections'],body,false,headers);assert.equal(first.status,201);assert.equal(first.data.id,key);
 assert.equal((await call(['admin','corrections',key],{state:'resolved'})).status,200);
 for(let i=0;i<4;i++)assert.equal((await call(['corrections'],{...body,claim:body.claim+i},false,{...headers,'idempotency-key':crypto.randomUUID()})).status,201);
 const retry=await call(['corrections'],body,false,headers);assert.equal(retry.status,201);assert.equal(retry.data.id,key);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM corrections WHERE id=?').get(key).n,1);assert.equal(sqlite.prepare('SELECT state FROM corrections WHERE id=?').get(key).state,'resolved');assert.ok(!JSON.stringify(retry.data).includes(body.contact));
 assert.equal((await call(['corrections'],{...body,claim:'Different valid correction text'},false,headers)).status,409);
 assert.equal((await call(['corrections'],body,false,{...headers,'idempotency-key':crypto.randomUUID()})).status,429);
});
test('parallel identical corrections deduplicate, malformed keys fail and receipt attempts remain limited',async()=>{
 const key=crypto.randomUUID(),headers={'idempotency-key':key,'cf-connecting-ip':'parallel-retry-test'},body={page:'/test',field:'Synthetic test',claim:'Synthetic concurrent receipt verification only'};
 const results=await Promise.all([call(['corrections'],body,false,headers),call(['corrections'],body,false,headers)]);assert.ok(results.every(r=>r.status===201&&r.data.id===key));assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM corrections WHERE id=?').get(key).n,1);
 assert.equal((await call(['corrections'],body,false,{...headers,'idempotency-key':'invalid'})).status,400);
 for(let i=0;i<28;i++)assert.equal((await call(['corrections'],body,false,headers)).status,201);
 assert.equal((await call(['corrections'],body,false,headers)).status,429);
 const errors=await call(['corrections'],{...body,field:'x',contact:{}},false,{'cf-connecting-ip':'validation-test'});assert.equal(errors.status,400);assert.ok(errors.data.fields.field&&errors.data.fields.contact);
});

test('history permission and observation review survive protected import, publication and withdrawal',async()=>{
 const record=historyFixture(),key={'idempotency-key':'history-qa-import-001'};
 assert.equal((await call(['admin','imports'],{record},false,key)).status,403);
 const invalid={...record,sources:record.sources.map(s=>({...s,historyAllowed:false}))};assert.equal((await call(['admin','imports'],{record:invalid},true,key)).status,400);
 assert.equal((await call(['admin','imports'],{record},true,key)).status,201);
 assert.equal((await call(['admin','records',record.id],{action:'review',revision:1})).status,200);
 assert.equal((await call(['admin','records',record.id],{action:'publish',revision:2})).status,200);
 const stored=()=>JSON.parse(sqlite.prepare('SELECT payload FROM records WHERE id=?').get(record.id).payload);
 assert.equal(stored().sources[0].historyAllowed,true);assert.equal(historySeries(stored(),'IN','official_retail').find(g=>g.available).rows.length,3);
 const observations=sqlite.prepare('SELECT payload FROM observations WHERE record_id=?').all(record.id).map(row=>JSON.parse(row.payload));assert.ok(observations.every(p=>p.historyEligible===true));
 assert.equal((await call(['admin','records',record.id],{action:'withdraw',revision:3})).status,200);assert.equal(historySeries(stored(),'IN','official_retail').length,0);
});

test('protected publication preserves editorial fields while public reads exclude them',async()=>{
 const record=historyFixture(),marker='PRIVATE_EDITORIAL_QA_ONLY';record.id='public-boundary-qa';record.reference='QA-002';record.prices=record.prices.map(p=>({...p,variantId:record.id,internalCost:marker}));record.internalNotes=marker;record.sources[0].historyPermission=marker;
 assert.equal((await call(['admin','imports'],{record},true,{'idempotency-key':'public-boundary-import-001'})).status,201);
 assert.equal((await call(['admin','records',record.id],{action:'review',revision:1})).status,200);assert.equal((await call(['admin','records',record.id],{action:'publish',revision:2})).status,200);
 const raw=JSON.parse(sqlite.prepare('SELECT payload FROM records WHERE id=?').get(record.id).payload),published=publicWatch(raw);assert.ok(JSON.stringify(raw).includes(marker));assert.ok(!JSON.stringify(published).includes(marker));assert.equal(published.sources[0].historyPermissionRecorded,true);assert.equal(historySeries(published,'IN','official_retail').find(g=>g.available).rows.length,3);
 const queue=await call(['admin','queues','records'],undefined,true,{},'state=published');assert.equal(queue.status,200);assert.ok(JSON.stringify(queue.data.rows.find(r=>r.id===record.id)).includes(marker));assert.equal((await call(['admin','queues','records'],undefined,false,{},'state=published')).status,403);
});
