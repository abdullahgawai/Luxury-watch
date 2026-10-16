const uncertain='Result could not be confirmed. Your draft is preserved. Check queues and audit history before retrying.';
export function importAttempt(previous,signature,newKey=()=>crypto.randomUUID()){return previous?.signature===signature?previous:{signature,key:newKey()};}
export function confirmedEditorialWrite(url,body,status,result){
 if(!result||typeof result!=='object'||Array.isArray(result))return false;
 if(url==='/api/admin/imports')return result.id===body?.record?.id&&typeof result.id==='string'&&/^[a-z0-9][a-z0-9-]{2,100}$/.test(result.id)&&((status===201&&result.state==='draft')||(status===200&&result.idempotent===true));
 const record=url.match(/^\/api\/admin\/records\/([^/?#]+)$/),states={review:'review',publish:'published',withdraw:'draft',revise:'draft',rollback:'draft'};
 if(record){let id;try{id=decodeURIComponent(record[1]);}catch{return false;}return status===200&&result.id===id&&Object.hasOwn(states,body?.action)&&result.state===states[body.action]&&Number.isSafeInteger(body.revision)&&Number.isSafeInteger(result.revision)&&result.revision===body.revision+1;}
 return /^\/api\/admin\/corrections\/[^/?#]+$/.test(url)&&status===200&&['accepted','rejected','resolved'].includes(body?.state)&&result.state===body.state;
}
export async function editorialWrite(url,body,{key,signal,timeoutMs=15000,fetcher=fetch}={}){
 if(signal?.aborted)throw new Error(uncertain);
 const controller=new AbortController();let timer,abort;
 const cancelled=new Promise((_,reject)=>{abort=()=>{controller.abort();reject(new Error(uncertain));};signal?.addEventListener('abort',abort,{once:true});});
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error(uncertain));},timeoutMs);});
 const request=(async()=>{
  let response,result;
  try{response=await fetcher(url,{method:'POST',headers:{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:JSON.stringify(body),signal:controller.signal});result=await response.json();}catch{throw new Error(uncertain);}
  if(!response.ok){const message={400:'Operation not accepted. Check the record, source evidence and current revision.',403:'Editor access denied. Check access before retrying.',409:'Record or import key conflict. Refresh queues and audit history before retrying.',413:'Record is too large. Review the import format.',429:'Operation limit reached. Wait before retrying.'}[response.status];throw new Error(message||uncertain);}
  if(!confirmedEditorialWrite(url,body,response.status,result))throw new Error(uncertain);
  return result;
 })();
 try{return await Promise.race([request,deadline,cancelled]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
