import { env } from 'cloudflare:workers';
import { researchWatches } from './research-catalogue.mjs';
export type Source = {id:string,title:string,url:string,category:string,rights:string,permission:string,checkedAt:string,method:string};
export type Photo = {id:string,url:string,thumbnail?:string,originalUrl?:string,sourceUrl:string,alt:string,rights:string,permission:string,holder:string,license:string,licenseUrl:string,changes:string,width:number,height:number,variantId:string,reference:string,matchStatus:string};
export type Watch = {id:string,brand:string,model:string,reference:string,configurationId?:string,dial:string,bracelet:string,material:string,size:number|null,movement:string|null,calibre:string|null,powerReserve:number|null,waterResistance:number|null,bezel:string|null,description:string,aliases:string[],collections:string[],sources:Source[],prices:any[],image:Photo|null,images?:Photo[],evidence:Record<string,string>,demo:boolean,status:string};
export function settings(){return {name:env.SITE_NAME||'Luxury Watch Explorer',demo:env.DATA_MODE!=='production'};}
export async function catalogue():Promise<Watch[]>{
 if(settings().demo) return researchWatches;
 if(!env.DB) throw new Error('Catalogue database unavailable');
 const {results}=await env.DB.prepare("SELECT payload FROM records WHERE state='published' ORDER BY brand,reference LIMIT 1000").all<{payload:string}>();
 return results.map(x=>JSON.parse(x.payload)).filter(x=>!x.demo);
}
