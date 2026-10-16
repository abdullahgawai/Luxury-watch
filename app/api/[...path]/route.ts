import {editorialApi} from '../../../lib/editorial';
import {catalogue,settings} from '../../../lib/catalogue';
import {historyResponse} from '../../../lib/history.mjs';
import {publicPrices} from '../../../lib/public-catalogue.mjs';
import {catalogueQuery,cataloguePage} from '../../../lib/catalogue-query.mjs';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
export async function GET(req:Request,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;
 if(path[0]==='admin')return editorialApi(req,path);
 if(path[0]!=='watches'||path.length>3||(path[2]&&!['prices','history'].includes(path[2])))return json({error:'Not found'},404);
 const search=new URL(req.url).searchParams;
 const parsed=path.length<3?catalogueQuery(search,{detail:!!path[1]}):null;
 if(parsed&&parsed.status!==200)return json({error:parsed.error},400);
 try{
  const all=await catalogue(),mode=settings().demo?'demo':'production';
  if(!path[1])return json({...cataloguePage(all,parsed!.query!),mode});
  const w=all.find(x=>x.id===path[1]);
  if(!w)return json({error:'Watch not found'},404);
  if(path[2]==='history'){const response=historyResponse(w,search);return json({data:response.body,mode},response.status);}
  if(path[2]==='prices'){const response=publicPrices(w,search);return json({data:response.body,mode},response.status);}
  return json({data:w,mode});
 }catch{return json({error:'Catalogue temporarily unavailable'},503);}
}
export async function POST(req:Request,{params}:{params:Promise<{path:string[]}>}){return editorialApi(req,(await params).path);}
