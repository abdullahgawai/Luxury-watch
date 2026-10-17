// Server-only evaluation adapter. Customer page views never call the provider.
import {env} from 'cloudflare:workers';
import {validEvidenceDate} from './evidence-dates.mjs';
const maxBytes=256*1024,maxCandidates=25;
async function boundedPayload(response:Response):Promise<{payload?:any,status?:string}>{
 const length=response.headers.get('content-length');
 if(length&&/^\d+$/.test(length)&&Number(length)>maxBytes){await response.body?.cancel().catch(()=>{});return {status:'response_too_large'};}
 if(!/^application\/(?:json|[a-z0-9.+-]+\+json)(?:\s*;|$)/i.test(response.headers.get('content-type')||'')||!response.body){await response.body?.cancel().catch(()=>{});return {status:'schema_changed'};}
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let total=0;
 try{
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>maxBytes){await reader.cancel().catch(()=>{});return {status:'response_too_large'};}chunks.push(value);}
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return {payload:JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))};}catch{return {status:'schema_changed'};}
 }finally{reader.releaseLock();}
}
export async function evaluateTheWatchAPI(reference:string){
 if(env.THEWATCHAPI_ENABLED!=='true'||!env.THEWATCHAPI_TOKEN)return {status:'not_configured',message:'Secure token and approved source rights required'};
 if(typeof reference!=='string'||!/^[A-Za-z0-9. -]{2,60}$/.test(reference)||!reference.trim())throw new Error('Invalid reference');
 const u=new URL('https://api.thewatchapi.com/v1/model/search');
 u.searchParams.set('api_token',env.THEWATCHAPI_TOKEN);u.searchParams.set('reference_number',reference);u.searchParams.set('search',reference);u.searchParams.set('search_attributes','reference_number');
 // The existing upstream query-token contract is never logged, echoed or followed through redirects.
 try{
  const res=await fetch(u,{signal:AbortSignal.timeout(8000),redirect:'error',headers:{Accept:'application/json'}});
  if(!res.ok){await res.body?.cancel().catch(()=>{});return {status:[401,403].includes(res.status)?'authentication_failed':res.status===429?'rate_limited':'upstream_error',httpStatus:res.status};}
  const body=await boundedPayload(res);if(body.status)return {status:body.status};
  const payload=body.payload;if(!payload||typeof payload!=='object'||Array.isArray(payload)||!Array.isArray(payload.data))return {status:'schema_changed'};
  const token=env.THEWATCHAPI_TOKEN;
  const text=(value:unknown,max:number)=>typeof value==='string'&&value.trim()&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value)&&!value.includes(token)&&!value.includes(encodeURIComponent(token))?value.trim():null;
  const candidates=[];let rejectedCandidates=0;
  for(const row of payload.data.slice(0,maxCandidates)){
   const ref=row&&typeof row==='object'&&!Array.isArray(row)?text(row.reference_number,60):null;
   if(!ref){rejectedCandidates++;continue;}
   const updated=text(row.last_updated,100);
   candidates.push({brand:text(row.brand,120),model:text(row.model,200),reference:ref,size:typeof row.case_diameter==='number'&&Number.isFinite(row.case_diameter)&&row.case_diameter>=10&&row.case_diameter<=70?row.case_diameter:text(row.case_diameter,80),material:text(row.case_material,200),movement:text(row.movement,100),providerUpdatedAt:updated&&updated.includes('T')&&validEvidenceDate(updated)?updated:null,variantMapping:'unresolved',scope:'GLOBAL',prices:[],image:null});
  }
  const quota=res.headers.get('X-UsageLimit-Limit');
  return {status:payload.data.length?'needs_review':'no_matches',candidates,examined:Math.min(payload.data.length,maxCandidates),rejectedCandidates,truncated:payload.data.length>maxCandidates,quota:quota&&/^\d{1,9}$/.test(quota)?Number(quota):null};
 }catch{return {status:'provider_unavailable',message:'Timeout or upstream failure; last-known-good records unchanged'};}
}
