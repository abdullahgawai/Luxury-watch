import {Buffer} from 'node:buffer';

const pageSize=25;
const queues={
 records:{columns:'id,brand,reference,state,revision,updated_at,payload',date:'updated_at',states:['all','draft','review','published']},
 corrections:{columns:'id,page,field,claim,contact,state,created_at',date:'created_at',states:['all','pending','accepted','rejected','resolved']},
 audit:{columns:'id,actor,entity_id,action,old_value,new_value,at',date:'at',states:['all']},
 revisions:{columns:'id,record_id,revision,actor,at',date:'revision',states:['all']}
} as const;
type Queue=keyof typeof queues;
export class EditorialPageError extends Error{}
function decodeCursor(raw:string|null,scope:string,numeric:boolean):[string|number,string]|null{
 if(raw===null)return null;
 try{
  if(raw.length>1024||!raw||!/^[A-Za-z0-9_-]+$/.test(raw))throw new Error();
  const [version,queue,value,id]=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));
  if(version!==1||queue!==scope||typeof id!=='string'||!id||id.length>200)throw new Error();
  if(numeric?(!Number.isSafeInteger(value)||value<1):(typeof value!=='string'||!Number.isFinite(Date.parse(value))||value.length>40))throw new Error();
  return [value,id];
 }catch{throw new EditorialPageError('Invalid page cursor. Return to the newest page.');}
}
export async function editorialPage(database:D1Database,kind:string,params:URLSearchParams,recordId?:string){
 if(!Object.hasOwn(queues,kind))throw new EditorialPageError('Unknown editorial queue');
 const queue=kind as Queue,config=queues[queue],state=params.get('state')||'all';
 if(!(config.states as readonly string[]).includes(state))throw new EditorialPageError('Invalid queue state');
 const scope=JSON.stringify([queue,state,recordId||null]);
 const cursor=decodeCursor(params.get('cursor'),scope,queue==='revisions');
 const where:string[]=[],values:(string|number)[]=[];
 if(queue==='revisions'){
  if(!recordId||recordId.length>200)throw new EditorialPageError('A record ID is required');
  where.push('record_id=?');values.push(recordId);
 }
 if(state!=='all'){where.push('state=?');values.push(state);}
 if(cursor){where.push(`(${config.date}<? OR (${config.date}=? AND id<?))`);values.push(cursor[0],cursor[0],cursor[1]);}
 // Table/column names come only from the fixed server map; all visitor values are bound.
 const result=await database.prepare(`SELECT ${config.columns} FROM ${queue}${where.length?' WHERE '+where.join(' AND '):''} ORDER BY ${config.date} DESC,id DESC LIMIT ?`).bind(...values,pageSize+1).all<Record<string,any>>();
 const rows=result.results.slice(0,pageSize),last=rows.at(-1),hasMore=result.results.length>pageSize;
 const nextCursor=hasMore&&last?Buffer.from(JSON.stringify([1,scope,last[config.date],last.id]),'utf8').toString('base64url'):null;
 return {rows,pageSize,nextCursor,hasMore};
}
