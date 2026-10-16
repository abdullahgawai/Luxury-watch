import { env } from 'cloudflare:workers';
import { researchWatches } from './research-catalogue.mjs';
import {coverageSnapshot} from './retail-reviews.mjs';
import {publicCatalogue} from './public-catalogue.mjs';
export type Source = {id:string,title:string,url:string,category:string,rights:string,permission:string,checkedAt:string,method:string,historyAllowed?:boolean,historyPermission?:string,historyPermissionRecorded?:boolean,authorisation?:{url:string,title:string,evidence:string,checkedAt:string}};
export type Photo = {id:string,url:string,thumbnail?:string,originalUrl?:string,sourceUrl:string,alt:string,rights:string,permission:string,holder:string,license:string,licenseUrl:string,changes:string,width:number,height:number,variantId:string,reference:string,matchStatus:string,checkedAt?:string,configurationNote?:string};
export type RetailCoverageReview = {variantId:string,reference:string,country:string,reviewedAt:string,sourceUrl:string,outcome:string,reason:string,offeredReference?:string};
export type Watch = {id:string,brand:string,model:string,reference:string,configurationId?:string,dial:string,bracelet:string,material:string,size:number|null,movement:string|null,calibre:string|null,powerReserve:number|null,waterResistance:number|null,bezel:string|null,description:string,aliases:string[],collections:string[],sources:Source[],prices:any[],retailCoverageReviews?:RetailCoverageReview[],image:Photo|null,images?:Photo[],evidence:Record<string,string>,demo:boolean,status:string};
export function settings(){return {name:env.SITE_NAME||'Luxury Watch Explorer',demo:env.DATA_MODE!=='production'};}
export async function catalogue():Promise<Watch[]>{
 if(settings().demo) return publicCatalogue(coverageSnapshot(researchWatches),{production:false});
 if(!env.DB) throw new Error('Catalogue database unavailable');
 const {results}=await env.DB.prepare("SELECT payload FROM records WHERE state='published' ORDER BY brand,reference,id LIMIT 1000").all<{payload:string}>();
 return publicCatalogue(results.flatMap(x=>{try{return [JSON.parse(x.payload)];}catch{return [];} }));
}
