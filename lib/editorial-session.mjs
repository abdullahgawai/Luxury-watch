const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);
async function request(url,init,{signal,timeoutMs=15000,fetcher=fetch}={}){
 if(signal?.aborted)throw new Error('Request cancelled.');
 const controller=new AbortController();let timer,abort;
 const cancelled=new Promise((_,reject)=>{abort=()=>{controller.abort();reject(new Error('Request cancelled.'));};signal?.addEventListener('abort',abort,{once:true});});
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Request timed out.'));},timeoutMs);});
 const pending=(async()=>{const response=await fetcher(url,{...init,cache:'no-store',signal:controller.signal});if(!response.ok){const error=new Error('Request rejected.');error.status=response.status;throw error;}return response.json();})();
 try{return await Promise.race([pending,deadline,cancelled]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export async function editorAccess(options={}){
 let body;
 try{body=await request('/api/admin',{},options);}catch(error){throw new Error(error.status===403?'Editor access denied. Sign in and request an editor role.':'Editor access could not be confirmed. Check your connection and retry.');}
 if(!object(body)||!text(body.userId,200)||!body.userId.trim())throw new Error('Editor access could not be confirmed. Check access again.');
 return body.userId;
}
const outcomes=new Set(['not_configured','authentication_failed','rate_limited','upstream_error','response_too_large','schema_changed','provider_unavailable']);
export function verifiedProviderEvaluation(body){
 const invalid=()=>{throw new Error('Provider result could not be verified. No catalogue data was changed. A request may still count toward the hourly limit.');};
 if(!object(body))return invalid();
 // Project known fields only. Never render arbitrary upstream or error payloads.
 if(outcomes.has(body.status))return {status:body.status};
 if(!['needs_review','no_matches'].includes(body.status)||!Array.isArray(body.candidates)||body.candidates.length>25||!Number.isSafeInteger(body.examined)||body.examined<0||body.examined>25||!Number.isSafeInteger(body.rejectedCandidates)||body.rejectedCandidates<0||body.candidates.length+body.rejectedCandidates!==body.examined||typeof body.truncated!=='boolean'||!(body.quota===null||(Number.isSafeInteger(body.quota)&&body.quota>=0&&body.quota<=999999999)))return invalid();
 if((body.status==='no_matches'&&(body.examined!==0||body.truncated))||(body.status==='needs_review'&&body.examined===0)||(body.truncated&&body.examined!==25))return invalid();
 const candidates=[];
 for(const row of body.candidates){
  if(!object(row)||!text(row.reference,60)||row.variantMapping!=='unresolved'||row.scope!=='GLOBAL'||!Array.isArray(row.prices)||row.prices.length!==0||row.image!==null)return invalid();
  const limits={brand:120,model:200,material:200,movement:100};
  if(!Object.entries(limits).every(([key,max])=>row[key]===null||text(row[key],max))||!(row.size===null||text(row.size,80)||(typeof row.size==='number'&&Number.isFinite(row.size)&&row.size>=10&&row.size<=70))||!(row.providerUpdatedAt===null||(text(row.providerUpdatedAt,100)&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(row.providerUpdatedAt)&&Number.isFinite(Date.parse(row.providerUpdatedAt))&&Date.parse(row.providerUpdatedAt)<=Date.now())))return invalid();
  candidates.push({brand:row.brand,model:row.model,reference:row.reference,size:row.size,material:row.material,movement:row.movement,providerUpdatedAt:row.providerUpdatedAt,variantMapping:'unresolved',scope:'GLOBAL',prices:[],image:null});
 }
 return {status:body.status,candidates,examined:body.examined,rejectedCandidates:body.rejectedCandidates,truncated:body.truncated,quota:body.quota};
}
export async function providerEvaluation(reference,options={}){
 if(typeof reference!=='string'||!/^[A-Za-z0-9. -]{2,60}$/.test(reference)||!reference.trim())throw new Error('Enter a reference of 2–60 letters, numbers, dots, spaces or hyphens.');
 let body;
 try{body=await request('/api/admin/provider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference})},options);}catch(error){
  throw new Error(error.status===429?'Evaluation limit reached. Retry after one hour.':error.status===403?'Editor access denied. Check your editor role before retrying.':'Provider result is uncertain. No catalogue data was changed. The request may count toward the hourly limit; check audit history before retrying.');
 }
 return verifiedProviderEvaluation(body);
}
