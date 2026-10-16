export async function editorialQueueRequest(url,{signal,timeoutMs=15000,fetcher=fetch}={}){
 if(signal?.aborted)throw new Error('Queue request cancelled.');
 const controller=new AbortController();let timer,abort;
 const cancelled=new Promise((_,reject)=>{abort=()=>{controller.abort();reject(new Error('Queue request cancelled.'));};if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});});
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Queue request timed out. Retry this queue when the connection returns.'));},timeoutMs);});
 const request=(async()=>{try{const response=await fetcher(url,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error();return await response.json();}catch{throw new Error('Queue unavailable. Retry this queue; no mutation was requested.');}})();
 try{return await Promise.race([request,deadline,cancelled]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
const text=(v,max=2000)=>typeof v==='string'&&v.length<=max;
const date=v=>text(v,60)&&Number.isFinite(Date.parse(v));
export function verifiedQueuePage(body,kind){
 const invalid=()=>{throw new Error('Queue response could not be verified. Retry this queue.');};
 if(!body||!Array.isArray(body.rows)||body.rows.length>25||body.pageSize!==25||typeof body.hasMore!=='boolean'||(body.hasMore&&body.rows.length!==25)||!(body.nextCursor===null||(text(body.nextCursor,1024)&&/^[A-Za-z0-9_-]+$/.test(body.nextCursor)))||body.hasMore!==!!body.nextCursor)return invalid();
 const ids=new Set();for(const row of body.rows){
  if(!row||!text(row.id,200)||!row.id||ids.has(row.id)||Object.values(row).some(v=>v!==null&&!['string','number'].includes(typeof v)))return invalid();ids.add(row.id);
  const strings=keys=>keys.every(key=>text(row[key],['payload','old_value','new_value'].includes(key)?200000:2000));
  const revision=Number.isSafeInteger(row.revision)&&row.revision>=1;
  if(kind==='records'){if(!strings(['brand','reference','payload'])||!['draft','review','published'].includes(row.state)||!revision||!date(row.updated_at))return invalid();}
  else if(kind==='corrections'){if(!strings(['page','field'])||!text(row.claim,3000)||!(row.contact===null||text(row.contact,500))||!['pending','accepted','rejected','resolved'].includes(row.state)||!date(row.created_at))return invalid();}
  else if(kind==='audit'){if(!strings(['actor','entity_id','action'])||!['old_value','new_value'].every(k=>row[k]===null||text(row[k],200000))||!date(row.at))return invalid();}
  else if(kind==='revisions'){if(!strings(['record_id','payload','actor'])||!revision||!date(row.at))return invalid();}
  else return invalid();
 }
 if(!['records','corrections','audit','revisions'].includes(kind))return invalid();
 return body;
}
export function storedJSON(raw){if(raw===null)return {ok:true,value:null};if(typeof raw!=='string')return {ok:false,value:null};try{return {ok:true,value:JSON.parse(raw)};}catch{return {ok:false,value:null};}}
