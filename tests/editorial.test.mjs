import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {build} from 'esbuild';
import {readFileSync,readdirSync} from 'node:fs';
import {demoWatches} from '../lib/demo.mjs';
import {publishedObservations} from '../lib/domain.mjs';
const sqlite=new DatabaseSync(':memory:');
for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
const statement=(sql,values=[])=>({bind(...v){return statement(sql,v);},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {results:sqlite.prepare(sql).all(...values)};},async run(){return sqlite.prepare(sql).run(...values);},sql,values});
globalThis.testEnv={DB:{prepare:statement,async batch(a){sqlite.exec('BEGIN');try{const r=a.map(s=>sqlite.prepare(s.sql).run(...s.values));sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}},EDITOR_USER_IDS:'editor',DATA_MODE:'production'};
const b=await build({entryPoints:['lib/editorial.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'test-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env = globalThis.testEnv;',loader:'js'}));}}]});
const {editorialApi}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
async function call(path,body,editor=true,extra={}){const req=new Request('https://test.local/api/'+path.join('/'),{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',origin:'https://test.local',...(editor?{'oai-authenticated-user-id':'editor'}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});const r=await editorialApi(req,path);return {status:r.status,data:await r.json()};}
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
