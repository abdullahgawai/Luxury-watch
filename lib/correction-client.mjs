const uncertain='Receipt could not be confirmed. Your text is preserved. Retry when the connection returns; retrying the same text uses the same submission key.';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fieldMessages={page:'Use a local page path beginning with one /, up to 300 characters.',field:'Describe the field or issue in 2–100 characters.',claim:'Describe the correction in 10–3000 characters, including a source when available.',contact:'Enter a valid email address, or leave it blank.',form:'Submission rejected. Your text is preserved.'};
export function correctionResponse(status,body,key){
 const object=body!==null&&typeof body==='object'&&!Array.isArray(body);
 if(status===201&&object&&body.id===key&&uuid.test(key))return {receipt:key};
 if(status===400&&object&&body.fields!==null&&typeof body.fields==='object'&&!Array.isArray(body.fields)){
  const keys=Object.keys(body.fields);
  if(keys.length&&keys.every(k=>Object.hasOwn(fieldMessages,k)&&typeof body.fields[k]==='string'&&body.fields[k].length>0&&body.fields[k].length<=500))return {fields:Object.fromEntries(keys.map(k=>[k,fieldMessages[k]])),message:'Please check the highlighted fields. Your text is preserved.'};
 }
 const messages={403:'The submission was not accepted. Reload this site before retrying; keep a copy of your text first.',409:'This submission key conflicts with earlier text. Keep a copy of your correction before reloading to start a new submission.',413:'The submission is too large. Shorten your correction and retry. Your text is preserved.',429:'Submission limit reached. Try again in an hour. Your text is preserved.'};
 if(Object.hasOwn(messages,status))return {message:messages[status]};
 throw new Error(uncertain);
}
export async function submitCorrection(signature,key,{signal,timeoutMs=15000,fetcher=fetch}={}){
 if(signal?.aborted||typeof key!=='string'||!uuid.test(key))throw new Error(uncertain);
 const controller=new AbortController();let timer,abort;
 const cancelled=new Promise((_,reject)=>{abort=()=>{controller.abort();reject(new Error(uncertain));};signal?.addEventListener('abort',abort,{once:true});});
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error(uncertain));},timeoutMs);});
 const pending=(async()=>{
  const response=await fetcher('/api/corrections',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:signature,signal:controller.signal});
  // Error bodies are never displayed. Only the bounded known field-error contract is accepted.
  return correctionResponse(response.status,await response.json(),key);
 })();
 try{return await Promise.race([pending,deadline,cancelled]);}catch{throw new Error(uncertain);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
