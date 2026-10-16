import {searchWatches,MARKET_CURRENCY} from './domain.mjs';
const keys=new Set(['q','brand','size','material','movement','collection','sort','maxPrice','market','page','pageSize']);
const positiveInteger=value=>/^[1-9]\d*$/.test(value)&&Number.isSafeInteger(Number(value));
const invalid=message=>({status:400,error:message});
export function catalogueQuery(params,{detail=false}={}){
 for(const key of params.keys())if(!(detail?key==='market':keys.has(key))||params.getAll(key).length!==1)return invalid('Unsupported or repeated catalogue query parameter.');
 const market=params.get('market')??'IN';if(!['IN','AE'].includes(market))return invalid('Market must be IN or AE.');
 if(detail)return {status:200,query:{market}};
 const query={market};
 for(const key of ['q','brand','material','movement','collection']){
  if(!params.has(key))continue;const value=params.get(key);
  if(!value.trim()||value.length>(key==='q'?200:120)||/[\u0000-\u001f\u007f]/.test(value))return invalid('Search and filter text must be non-empty, bounded text.');
  query[key]=value.trim();
 }
 if(params.has('size')){const size=params.get('size');if(!/^\d{2}(?:\.\d{1,2})?$/.test(size)||Number(size)<10||Number(size)>70)return invalid('Case size must be between 10 and 70 mm.');query.size=String(Number(size));}
 if(params.has('maxPrice')){const value=params.get('maxPrice');if(!positiveInteger(value)||!Number.isSafeInteger(Number(value)*100))return invalid('Retail maximum must be a positive whole amount in the selected local currency.');query.maxPrice=value;}
 if(params.has('sort')){const sort=params.get('sort');if(!['relevance','name','price'].includes(sort))return invalid('Sort must be relevance, name or price.');query.sort=sort==='relevance'?'':sort;}
 for(const [key,fallback,max] of [['page',1,1000],['pageSize',24,50]]){const value=params.get(key);if(value!==null&&(!positiveInteger(value)||Number(value)>max))return invalid(key==='page'?'Page must be an integer from 1 to 1000.':'Page size must be an integer from 1 to 50.');query[key]=value===null?fallback:Number(value);}
 return {status:200,query};
}
// Input watches have already passed the public data projection. No provider calls.
export function cataloguePage(watches,query){
 const matches=searchWatches(watches,query,watches.flatMap(w=>w.prices),1000),{page,pageSize,market}=query;
 const total=matches.length,totalPages=Math.ceil(total/pageSize),hasPrevious=total>0&&page>1,hasNext=page<totalPages;
 return {data:matches.slice((page-1)*pageSize,page*pageSize),pagination:{page,pageSize,total,totalPages,hasPrevious,hasNext,previousPage:hasPrevious?Math.min(page-1,totalPages):null,nextPage:hasNext?page+1:null,market,currency:MARKET_CURRENCY[market]}};
}
