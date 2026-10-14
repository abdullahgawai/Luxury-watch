import { editorialApi } from '../../../lib/editorial';
import { catalogue, settings } from '../../../lib/catalogue';
import { searchWatches } from '../../../lib/domain.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;
 if(path[0]==='admin')return editorialApi(req,path);
 try{
  const all=await catalogue();
  if(path[0]==='watches'){
   const w=path[1]?all.find(x=>x.id===path[1]):null;
   if(path[1]&&!w)return Response.json({error:'Watch not found'},{status:404});
   const q=Object.fromEntries(new URL(req.url).searchParams);
   const value=w?(path[2]==='prices'?w.prices:path[2]==='history'?{observations:[],message:'Choose a comparable sourced series on the detail page.'}:w):searchWatches(all,q,all.flatMap(x=>x.prices));
   return Response.json({data:value,mode:settings().demo?'demo':'production'});
  }
  return Response.json({error:'Not found'},{status:404});
 }catch{return Response.json({error:'Catalogue temporarily unavailable'},{status:503});}
}
export async function POST(req:Request,{params}:{params:Promise<{path:string[]}>}){return editorialApi(req,(await params).path);}
