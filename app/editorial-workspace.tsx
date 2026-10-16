'use client';
import {useEffect,useState} from 'react';
import OperationalChecks from './operational-checks';
import {editorialQueueRequest,verifiedQueuePage,storedJSON} from '../lib/editorial-client.mjs';

type Row=Record<string,any>;
type Page={rows:Row[];hasMore:boolean;nextCursor:string|null;pageSize:number};
type Post=(url:string,body:unknown,importing?:boolean)=>Promise<void>;
const stamp=(value:string)=>new Date(value).toLocaleString('en-GB',{timeZone:'Asia/Kolkata'})+' IST';

function usePage(url:string){
 const [cursors,setCursors]=useState<(string|null)[]>([null]),[result,setResult]=useState<{url:string,page:Page}|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const cursor=cursors.at(-1),request=url+(cursor?'&cursor='+encodeURIComponent(cursor):'');
 useEffect(()=>{
  const controller=new AbortController();setError('');setResult(null);
  (async()=>{try{const kind=url.includes('/revisions/')?'revisions':url.split('/queues/')[1]?.split('?')[0],body=verifiedQueuePage(await editorialQueueRequest(request,{signal:controller.signal}),kind||'');if(!controller.signal.aborted)setResult({url:request,page:body});}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Queue unavailable.');}})();
  return ()=>controller.abort();
 },[request,retry]);
 const page=result?.url===request?result.page:null;
 return {page,error,number:cursors.length,previous:()=>setCursors(c=>c.slice(0,-1)),next:()=>{if(page?.nextCursor)setCursors(c=>[...c,page.nextCursor]);},retry:()=>setRetry(n=>n+1)};
}
function PageControls({page,label,disabled=false}:{page:ReturnType<typeof usePage>;label:string;disabled?:boolean}){
 return <div className="editorial-pagination" aria-label={`${label} pagination`}>
  <p role="status">{page.error||(!page.page?'Loading '+label.toLowerCase()+'…':`${label} · page ${page.number} · ${page.page.rows.length} entries${page.page.hasMore?' · more available':' · end of queue'}`)}</p>
  {page.error?<button onClick={page.retry}>Retry {label.toLowerCase()}</button>:<div className="actions"><button disabled={disabled||!page.page||page.number===1} onClick={page.previous} aria-label={`Newer ${label.toLowerCase()}`}>Newer</button><button disabled={disabled||!page.page?.hasMore} onClick={page.next} aria-label={`Older ${label.toLowerCase()}`}>Older</button></div>}
 </div>;
}
function RevisionHistory({record,busy,post}:{record:Row;busy:boolean;post:Post}){
 const [open,setOpen]=useState(false);
 return <div className="revision-history"><button aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'Close revision history':'Review earlier revisions'}</button>{open&&<RevisionPages key={record.revision} record={record} busy={busy} post={post}/>}</div>;
}
function RevisionPages({record,busy,post}:{record:Row;busy:boolean;post:Post}){
 const page=usePage('/api/admin/revisions/'+encodeURIComponent(record.id)+'?state=all'),[selected,setSelected]=useState('');
 // A choice from another page must never become an invisible rollback target.
 useEffect(()=>setSelected(''),[page.number]);
 const eligible=page.page?.rows.filter(row=>row.revision<record.revision)||[];
 return <><p className="small">History belongs to this exact configuration. Restoring creates a new draft and requires review before publication.</p><PageControls page={page} label="Revisions" disabled={busy}/>{page.page&&<form onSubmit={e=>{e.preventDefault();if(eligible.some(row=>String(row.revision)===selected))post('/api/admin/records/'+encodeURIComponent(record.id),{action:'rollback',revision:record.revision,targetRevision:Number(selected)});}}>
  <label>Prior revision<select value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}><option value="">Choose a revision on this page</option>{eligible.map(row=><option key={row.id} value={row.revision}>Revision {row.revision} · {stamp(row.at)}</option>)}</select></label>
  {!eligible.length&&<p>No earlier revisions on this page.</p>}<button disabled={busy||!selected}>Restore selected revision to draft</button>
 </form>}</>;
}
function RecordQueue({state,busy,post,revise}:{state:string;busy:boolean;post:Post;revise:(row:Row)=>void}){
 const page=usePage('/api/admin/queues/records?state='+state);
 return <><PageControls page={page} label="Records" disabled={busy}/>{page.page&&!page.page.rows.length&&<p>No records in this queue.</p>}{page.page?.rows.map(row=>{const decoded=storedJSON(row.payload),readable=decoded.ok&&decoded.value&&typeof decoded.value==='object'&&!Array.isArray(decoded.value);return <article key={row.id} className="admin-record"><h3>{row.brand} · {row.reference}</h3><p>{row.state} · revision {row.revision} · {stamp(row.updated_at)}</p>{!readable&&<p role="status">Stored record is unreadable. Publication and revision controls are disabled. Review audit history and use the operator recovery procedure.</p>}<details><summary>Inspect complete record</summary><pre>{readable?JSON.stringify(decoded.value,null,2):'Record JSON unavailable.'}</pre></details>{readable&&<div className="actions">
  {row.state==='draft'&&<><button disabled={busy} onClick={()=>revise(row)}>Revise draft</button><button disabled={busy} onClick={()=>post('/api/admin/records/'+encodeURIComponent(row.id),{action:'review',revision:row.revision})}>Submit to review</button></>}
  {row.state==='review'&&<button disabled={busy} onClick={()=>post('/api/admin/records/'+encodeURIComponent(row.id),{action:'publish',revision:row.revision})}>Publish reviewed record</button>}
  {row.state==='published'&&<button disabled={busy} onClick={()=>post('/api/admin/records/'+encodeURIComponent(row.id),{action:'withdraw',revision:row.revision})}>Withdraw to draft</button>}
 </div>}<RevisionHistory record={row} busy={busy||!readable} post={post}/></article>;})}</>;
}
function CorrectionQueue({state,busy,post}:{state:string;busy:boolean;post:Post}){
 const page=usePage('/api/admin/queues/corrections?state='+state);
 return <><PageControls page={page} label="Corrections" disabled={busy}/>{page.page&&!page.page.rows.length&&<p>No corrections in this queue.</p>}{page.page?.rows.map(row=><article key={row.id} className="admin-record"><p>{row.page} · {row.field} · {row.state}</p><p className="small">Received {stamp(row.created_at)}</p><p>{row.claim}</p><p className="small">{row.contact||'No contact supplied'}</p><div className="actions">{['accepted','rejected','resolved'].map(state=><button disabled={busy||state===row.state} key={state} onClick={()=>post('/api/admin/corrections/'+encodeURIComponent(row.id),{state})}>{state}</button>)}</div></article>)}</>;
}
function AuditQueue({busy}:{busy:boolean}){
 const page=usePage('/api/admin/queues/audit?state=all');
 return <><PageControls page={page} label="Audit events" disabled={busy}/><div className="audit-list">{page.page&&!page.page.rows.length&&<p>No audit events.</p>}{page.page?.rows.map(row=>{const before=storedJSON(row.old_value),after=storedJSON(row.new_value);return <details key={row.id}><summary>{stamp(row.at)} · {row.action} · {row.entity_id}</summary><p className="small">Actor: {row.actor}</p>{!before.ok||!after.ok?<p>Stored audit JSON is unreadable. Use the operator recovery procedure; no history has been changed.</p>:<pre>{JSON.stringify({before:before.value,after:after.value},null,2)}</pre>}</details>;})}</div></>;
}
export default function EditorialWorkspace(){
 const [user,setUser]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0),[recordState,setRecordState]=useState('all'),[correctionState,setCorrectionState]=useState('pending');
 const [draft,setDraft]=useState(''),[editing,setEditing]=useState<Row|null>(null),[key,setKey]=useState(''),[provider,setProvider]=useState<any>(null),[providerRef,setProviderRef]=useState('124060');
 async function access(){setError('');try{const response=await fetch('/api/admin',{cache:'no-store'}),body:any=await response.json();if(!response.ok)throw new Error(body.error);setUser(body.userId);}catch(e){setError(e instanceof Error?e.message:'Editorial service unavailable.');}}
 useEffect(()=>{access();setKey(crypto.randomUUID());},[]);
 async function post(url:string,body:unknown,importing=false){setBusy(true);setError('');try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(importing?{'Idempotency-Key':key}:{})},body:JSON.stringify(body)}),result:any=await response.json();if(!response.ok)throw new Error(result.error||'Operation failed.');setRefresh(n=>n+1);setEditing(null);setDraft('');if(importing)setKey(crypto.randomUUID());setError('Operation recorded. Queues returned to their newest pages.');}catch(e){setError(e instanceof Error?e.message:'Connection failed. Check audit history before retrying.');}finally{setBusy(false);}}
 async function evaluateProvider(){setBusy(true);try{const response=await fetch('/api/admin/provider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference:providerRef})});setProvider(await response.json());}catch{setProvider({status:'provider_unavailable'});}finally{setBusy(false);setRefresh(n=>n+1);}}
 if(!user)return <div className="admin-gate"><h2>Protected editorial access</h2><p role="status">{error||'Checking your editor role…'}</p><p className="small">Sign-in alone does not grant editorial permission. The operator must allowlist your stable authenticated user ID.</p><a className="button" target="_top" href="/signin-with-chatgpt?return_to=%2Fadmin">Sign in with ChatGPT ↗</a><button onClick={access}>Check access again</button></div>;
 return <><p className="small">Authenticated editor · {user}</p><p role="status">{error}</p><button disabled={busy} onClick={()=>setRefresh(n=>n+1)}>Refresh queues</button><p className="small">Each queue shows 25 entries at a time. Newer and Older keep earlier records reachable. Refresh returns to the newest entries.</p><OperationalChecks/>
 <section className="provider-evaluation"><h2>Provider feasibility</h2><p className="small">Requests are server-side, bounded to three evaluations per editor per hour. Candidates require exact-variant mapping and rights review before import. No upstream price becomes a local observation.</p><label>Reference to evaluate<input value={providerRef} onChange={e=>setProviderRef(e.target.value)} maxLength={60}/></label><button disabled={busy} onClick={evaluateProvider}>Evaluate TheWatchAPI</button>{provider&&<pre>{JSON.stringify(provider,null,2)}</pre>}</section>
 <div className="admin-grid"><section><h2>{editing?'Revise draft':'Import to draft'}</h2><p>Production records only. Source rights, field evidence, configuration and price metadata are validated.</p><form onSubmit={e=>{e.preventDefault();try{post(editing?'/api/admin/records/'+encodeURIComponent(editing.id):'/api/admin/imports',editing?{action:'revise',revision:editing.revision,record:JSON.parse(draft)}:{record:JSON.parse(draft)},!editing);}catch{setError('Invalid JSON.');}}}><label>Record JSON<textarea className="json-editor" rows={16} value={draft} onChange={e=>setDraft(e.target.value)} required spellCheck={false}/></label><button className="button" disabled={busy}>{busy?'Validating…':editing?'Save draft revision':'Validate & import'}</button>{editing&&<button type="button" disabled={busy} onClick={()=>{setEditing(null);setDraft('');}}>Cancel revision</button>}</form></section>
 <section id="publication-queue"><h2>Publication queue</h2><label>Record state<select value={recordState} disabled={busy} onChange={e=>setRecordState(e.target.value)}>{['all','draft','review','published'].map(state=><option key={state}>{state}</option>)}</select></label><RecordQueue key={refresh+recordState} state={recordState} busy={busy} post={post} revise={row=>{setEditing(row);setDraft(JSON.stringify(JSON.parse(row.payload),null,2));}}/></section></div>
 <section className="section" id="correction-queue"><h2>Correction moderation</h2><label>Correction state<select value={correctionState} disabled={busy} onChange={e=>setCorrectionState(e.target.value)}>{['pending','accepted','rejected','resolved','all'].map(state=><option key={state}>{state}</option>)}</select></label><p className="small">Acceptance does not edit the catalogue. Apply a supported correction through draft, review and publication before marking it resolved.</p><CorrectionQueue key={refresh+correctionState} state={correctionState} busy={busy} post={post}/></section>
 <section id="audit-queue"><h2>Audit history</h2><AuditQueue key={refresh} busy={busy}/></section></>;
}
