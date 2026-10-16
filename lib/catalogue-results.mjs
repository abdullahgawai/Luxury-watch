import {searchWatches} from './domain.mjs';
const keys=['q','brand','size','material','movement','collection','sort','maxPrice','market'];
export const CATALOGUE_PAGE_SIZE=12;
export function catalogueResults(watches,query,requestedPage=1){
 const matches=searchWatches(watches,query,watches.flatMap(w=>w.prices),1000),total=matches.length,totalPages=Math.ceil(total/CATALOGUE_PAGE_SIZE);
 const parsed=/^[1-9]\d*$/.test(String(requestedPage))&&Number.isSafeInteger(Number(requestedPage))?Number(requestedPage):1;
 const page=Math.min(parsed,Math.max(totalPages,1)),start=(page-1)*CATALOGUE_PAGE_SIZE;
 return {rows:matches.slice(start,start+CATALOGUE_PAGE_SIZE),total,totalPages,page,from:total?start+1:0,to:Math.min(start+CATALOGUE_PAGE_SIZE,total)};
}
export function catalogueHref(path,query,page=1){
 const params=new URLSearchParams();
 for(const key of keys)if(query[key]&&!(key==='brand'&&path.startsWith('/brands/')))params.set(key,String(query[key]));
 if(page>1)params.set('page',String(page));
 return path+'?'+params.toString();
}
