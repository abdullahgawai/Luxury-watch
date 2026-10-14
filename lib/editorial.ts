import { env } from 'cloudflare:workers';
import { canEdit, validateRecord, nextState } from './domain.mjs';
import { evaluateTheWatchAPI } from './provider';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
const id=()=>crypto.randomUUID();
function db(){if(!env.DB) throw new Error('Persistent database unavailable');return env.DB;}
async function digest(value:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function body(req:Request){
 const reader=req.body?.getReader();if(!reader)throw new Error('JSON body required');
 let raw='',bytes=0;const decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>150000){await reader.cancel();throw new Error('Payload too large');}raw+=decoder.decode(value,{stream:true});}
 raw+=decoder.decode();return JSON.parse(raw);
}
async function limit(key:string,max=5){
 const bucket=Math.floor(Date.now()/3600000),hash=await digest(key+bucket);
 const row=await db().prepare('INSERT INTO limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(hash,Date.now()+3600000).first<{count:number}>();
 return !!row&&row.count<=max;
}
function auditStatement(actor:string,entity:string,action:string,oldValue:unknown,newValue:unknown){return db().prepare('INSERT INTO audit(id,actor,entity_id,action,old_value,new_value,at) VALUES(?,?,?,?,?,?,?)').bind(id(),actor,entity,action,JSON.stringify(oldValue),JSON.stringify(newValue),new Date().toISOString());}
export async function editorialApi(req:Request,path:string[]){
 try{
  const admin=path[0]==='admin';
  const userId=req.headers.get('oai-authenticated-user-id');
  if(admin&&!canEdit(userId,env.EDITOR_USER_IDS||''))return json({error:'Editor access denied. Sign in and request an editor role.'},403);
  if(req.method!=='GET'){
   const origin=req.headers.get('origin');if(origin!==new URL(req.url).origin)return json({error:'Same-origin requests required'},403);
   if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required'},415);
   if(Number(req.headers.get('content-length')||0)>150000)return json({error:'Payload too large'},413);
  }
  if(path[0]==='corrections'&&req.method==='POST'){
   const b=await body(req);
   if(typeof b.page!=='string'||!b.page.startsWith('/')||b.page.startsWith('//')||b.page.length>300||typeof b.field!=='string'||b.field.length<2||b.field.length>100||typeof b.claim!=='string'||b.claim.trim().length<10||b.claim.length>3000||b.contact&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contact)||b.contact.length>200))return json({error:'Please provide a page, field and a correction of 10–3000 characters; email is optional.'},400);
   if(b.contact&&typeof b.contact!=='string')return json({error:'Email must be text'},400);
   if(b.website)return json({error:'Submission rejected'},400);
   if(!await limit(req.headers.get('cf-connecting-ip')||'local'))return json({error:'Submission limit reached. Try again in an hour.'},429);
   const ref=id();await db().prepare('INSERT INTO corrections(id,page,field,claim,contact,created_at) VALUES(?,?,?,?,?,?)').bind(ref,b.page,b.field,b.claim,b.contact||null,new Date().toISOString()).run();
   return json({id:ref,message:'Received for editorial review. No public record has been changed.'},201);
  }
  if(admin&&req.method==='GET'){
   const [records,corrections,audit,revisions]=await Promise.all([db().prepare('SELECT id,brand,reference,state,revision,updated_at,payload FROM records ORDER BY updated_at DESC LIMIT 100').all(),db().prepare('SELECT * FROM corrections ORDER BY created_at DESC LIMIT 100').all(),db().prepare('SELECT * FROM audit ORDER BY at DESC LIMIT 100').all(),db().prepare('SELECT id,record_id,revision,actor,at FROM revisions ORDER BY at DESC LIMIT 300').all()]);
   return json({records:records.results,corrections:corrections.results,audit:audit.results,revisions:revisions.results,userId});
  }
  if(admin&&req.method==='POST'&&path[1]==='imports'){
   const b=await body(req),r=validateRecord(b.record,true),key=req.headers.get('idempotency-key');
   if(!key||!/^[a-zA-Z0-9-]{8,100}$/.test(key))return json({error:'Idempotency-Key of 8–100 characters required'},400);
   const payload=JSON.stringify(r),hash=await digest(payload),prior=await db().prepare('SELECT * FROM imports WHERE key=?').bind(key).first<{hash:string,record_id:string}>();
   if(prior)return prior.hash===hash?json({id:prior.record_id,idempotent:true}):json({error:'Idempotency key already used for different content'},409);
   const existing=await db().prepare('SELECT id FROM records WHERE id=? OR (brand=? AND reference=? AND configuration=?)').bind(r.id,r.brand,r.reference,[r.dial,r.bracelet,r.material,r.size].join('|')).first();
   if(existing)return json({error:'Configuration exists. Revise its draft using its revision number.'},409);
   const at=new Date().toISOString();
   await db().batch([
    db().prepare('INSERT INTO records(id,brand,reference,configuration,payload,state,updated_at) VALUES(?,?,?,?,?,?,?)').bind(r.id,r.brand,r.reference,[r.dial,r.bracelet,r.material,r.size].join('|'),payload,'draft',at),
    db().prepare('INSERT INTO revisions(id,record_id,revision,payload,actor,at) VALUES(?,?,?,?,?,?)').bind(id(),r.id,1,payload,userId,at),
    db().prepare('INSERT INTO imports(key,hash,record_id,at) VALUES(?,?,?,?)').bind(key,hash,r.id,at),
    auditStatement(userId!,r.id,'import',null,r)
   ]);
   return json({id:r.id,state:'draft'},201);
  }
  if(admin&&req.method==='POST'&&path[1]==='provider'){
   const b=await body(req);if(typeof b.reference!=='string')return json({error:'A reference is required'},400);
   if(!await limit('provider:'+userId,3))return json({error:'Evaluation limit reached; retry after one hour'},429);
   const result=await evaluateTheWatchAPI(b.reference);
   await auditStatement(userId!,'thewatchapi','evaluate',null,{status:result.status}).run();
   return json(result);
  }
  if(admin&&req.method==='POST'&&path[1]==='records'&&path[2]){
   const b=await body(req),recordId=path[2];
   const current=await db().prepare('SELECT * FROM records WHERE id=?').bind(recordId).first<{payload:string,state:string,revision:number}>();
   if(!current)return json({error:'Record not found'},404);
   if(b.revision!==current.revision)return json({error:'Revision changed. Refresh before retrying.'},409);
   let payload=JSON.parse(current.payload),state=nextState(current.state,b.action);
   if(b.action==='rollback'){
    const target=await db().prepare('SELECT payload FROM revisions WHERE record_id=? AND revision=?').bind(recordId,b.targetRevision).first<{payload:string}>();
    if(!target)return json({error:'Prior revision not found'},404);
    payload=JSON.parse(target.payload);state='draft';
   }else if(b.action==='revise')payload=validateRecord(b.record,true);
   if(!state)return json({error:'Invalid editorial transition'},400);
   validateRecord(payload,true);if(payload.id!==recordId)return json({error:'Stable ID cannot change'},400);
   const oldPayload=JSON.parse(current.payload);
   if(['brand','reference','dial','bracelet','material','size'].some(k=>payload[k]!==oldPayload[k]))return json({error:'Variant identity cannot change. Import a new configuration and withdraw the incorrect record.'},400);
   payload.status=state;payload.demo=false;payload.prices=payload.prices.map((p:any)=>({...p,status:state}));
   const at=new Date().toISOString(),revision=current.revision+1,serialized=JSON.stringify(payload);
   // A conditional update + uniqueness of revision prevents concurrent overwrites;
   // D1 batch rolls back all statements on a constraint failure.
   const statements=[db().prepare('UPDATE records SET payload=?,state=?,revision=?,updated_at=? WHERE id=? AND revision=?').bind(serialized,state,revision,at,recordId,current.revision),db().prepare('INSERT INTO revisions(id,record_id,revision,payload,actor,at) VALUES(?,?,?,?,?,?)').bind(id(),recordId,revision,serialized,userId,at),auditStatement(userId!,recordId,b.action,current,payload)];
   if(state==='published'){
    for(const table of ['sources','spec_evidence','observations','listings','images'])statements.push(db().prepare(`DELETE FROM ${table} WHERE record_id=?`).bind(recordId));
    for(const s of payload.sources)statements.push(db().prepare('INSERT INTO sources(id,record_id,payload) VALUES(?,?,?)').bind(recordId+':'+s.id,recordId,JSON.stringify(s)));
    for(const [field,sourceId] of Object.entries(payload.evidence))statements.push(db().prepare('INSERT INTO spec_evidence(id,record_id,field,source_id,value) VALUES(?,?,?,?,?)').bind(recordId+':'+field,recordId,field,sourceId,JSON.stringify(payload[field]??null)));
    for(const p of payload.prices){statements.push(db().prepare('INSERT INTO observations(id,record_id,type,country,currency,amount_minor,observed_at,payload) VALUES(?,?,?,?,?,?,?,?)').bind(recordId+':'+p.id,recordId,p.type,p.country,p.currency,p.amountMinor,p.observedAt,JSON.stringify(p)));if(p.listingKey)statements.push(db().prepare('INSERT OR REPLACE INTO listings(id,record_id,observation_id,payload) VALUES(?,?,?,?)').bind(p.listingKey,recordId,p.id,JSON.stringify(p)));}
    if(payload.image)statements.push(db().prepare('INSERT INTO images(id,record_id,payload) VALUES(?,?,?)').bind(recordId,recordId,JSON.stringify(payload.image)));
   }
   await db().batch(statements);return json({id:recordId,state,revision});
  }
  if(admin&&req.method==='POST'&&path[1]==='corrections'&&path[2]){
   const b=await body(req);if(!['accepted','rejected','resolved'].includes(b.state))return json({error:'Invalid moderation state'},400);
   const old=await db().prepare('SELECT * FROM corrections WHERE id=?').bind(path[2]).first();if(!old)return json({error:'Correction not found'},404);
   await db().batch([db().prepare('UPDATE corrections SET state=? WHERE id=?').bind(b.state,path[2]),auditStatement(userId!,path[2],'moderate',old,b.state)]);return json({state:b.state});
  }
  return json({error:'Endpoint not found'},404);
 }catch(e){const m=e instanceof Error?e.message:'Request failed';return json({error:m.includes('constraint')?'Conflicting update; refresh and retry':m.includes('database')?'Persistent service temporarily unavailable. Please retry.':m},m.includes('database')?503:400);}
}
