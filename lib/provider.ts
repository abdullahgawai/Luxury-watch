// Server-only adapter. No provider calls are made on customer page views.
import { env } from 'cloudflare:workers';
export async function evaluateTheWatchAPI(reference:string){
 if(env.THEWATCHAPI_ENABLED!=='true'||!env.THEWATCHAPI_TOKEN)return {status:'not_configured',message:'Secure token and approved source rights required'};
 if(!/^[A-Za-z0-9. -]{2,60}$/.test(reference))throw new Error('Invalid reference');
 const u=new URL('https://api.thewatchapi.com/v1/model/search');
 u.searchParams.set('api_token',env.THEWATCHAPI_TOKEN);u.searchParams.set('reference_number',reference);u.searchParams.set('search',reference);u.searchParams.set('search_attributes','reference_number');
 // Upstream requires a query token. Never log this URL or raw errors.
 try{
  const res=await fetch(u,{signal:AbortSignal.timeout(8000),redirect:'error'});
  if(!res.ok)return {status:'upstream_error',httpStatus:res.status};
  const payload:any=await res.json();
  if(!Array.isArray(payload.data))return {status:'schema_changed'};
  return {status:'needs_review',candidates:payload.data.map((r:any)=>({brand:r.brand??null,model:r.model??null,reference:r.reference_number??null,size:r.case_diameter??null,material:r.case_material??null,movement:r.movement??null,providerUpdatedAt:r.last_updated??null,variantMapping:'unresolved',scope:'GLOBAL',prices:[],image:null})),quota:res.headers.get('X-UsageLimit-Limit')};
 }catch{return {status:'provider_unavailable',message:'Timeout or upstream failure; last-known-good records unchanged'};}
}
