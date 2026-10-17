const states={records:['all','draft','review','published'],corrections:['all','pending','accepted','rejected','resolved'],audit:['all'],revisions:['all']};
export function editorialEndpoint(path){
 if(!Array.isArray(path)||!path.length||path.some(s=>typeof s!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/.test(s)))return null;
 if(path.length===1&&path[0]==='corrections')return {method:'POST',queue:null};
 if(path[0]!=='admin')return null;
 if(path.length===1)return {method:'GET',queue:null};
 if(path.length===2&&path[1]==='health')return {method:'GET',queue:null};
 if(path.length===2&&['imports','provider'].includes(path[1]))return {method:'POST',queue:null};
 if(path.length!==3)return null;
 if(path[1]==='queues'&&['records','corrections','audit'].includes(path[2]))return {method:'GET',queue:path[2]};
 if(path[1]==='revisions')return {method:'GET',queue:'revisions'};
 if(['records','corrections'].includes(path[1]))return {method:'POST',queue:null};
 return null;
}
export function editorialQueryError(params,endpoint){
 if(!endpoint)return 'Endpoint not found';
 for(const key of params.keys())if(!endpoint.queue||!['state','cursor'].includes(key)||params.getAll(key).length!==1)return 'Unexpected or repeated query parameter';
 if(endpoint.queue){
  const state=params.get('state');if(state!==null&&!states[endpoint.queue]?.includes(state))return 'Invalid queue state';
  const cursor=params.get('cursor');if(cursor!==null&&(!cursor||cursor.length>1024||!/^[A-Za-z0-9_-]+$/.test(cursor)))return 'Invalid page cursor. Return to the newest page.';
 }
 return null;
}
