const keys=['watch-market','watch-saved','watch-compare'];
export function selectionIds(value){
 if(!Array.isArray(value))return [];
 return [...new Set(value.filter(id=>typeof id==='string'&&id.length>0&&id.length<=200&&!/[\u0000-\u001f]/.test(id)))];
}
export function comparisonSelection(value,knownIds){
 const ids=typeof value==='string'?value.split(','):value;
 return selectionIds(ids).filter(id=>knownIds.includes(id)).slice(0,3);
}
export function readDevicePreferences(getStorage,search,knownIds){
 const issues=[],blocked=[];
 function read(key,list=false){
  try{const raw=getStorage().getItem(key);if(raw===null)return list?[]:null;
   if(raw.length>256000)throw new Error('Preference exceeds supported size');
   if(!list)return raw;
   const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('Selection must be an array');return selectionIds(parsed);
  }catch(error){if(error instanceof SyntaxError||error?.message==='Selection must be an array'||error?.message==='Preference exceeds supported size')issues.push(key);else blocked.push(key);return list?[]:null;}
 }
 // Each key is independent: one corrupt selection cannot erase the market or the other list.
 const storedMarket=read('watch-market'),saved=read('watch-saved',true),storedCompare=read('watch-compare',true),params=new URLSearchParams(search),urlMarket=params.get('market');
 const market=['IN','AE'].includes(urlMarket)?urlMarket:['IN','AE'].includes(storedMarket)?storedMarket:'IN';
 return {market,saved,compare:comparisonSelection(params.has('ids')?params.get('ids'):storedCompare,knownIds),issues,blocked};
}
export function writeDevicePreference(getStorage,key,value){
 if(!keys.includes(key))throw new Error('Unsupported preference key');
 try{getStorage().setItem(key,key==='watch-market'?value:JSON.stringify(value));return true;}catch{return false;}
}
export function marketHref(path,market){
 const base='https://device-preferences.invalid',url=new URL(path,base);
 if(!path.startsWith('/')||path.startsWith('//')||url.origin!==base)throw new Error('Expected a local navigation path');
 url.searchParams.set('market',market==='AE'?'AE':'IN');return url.pathname+url.search+url.hash;
}
export function comparisonHref(ids,market){return marketHref('/compare?'+new URLSearchParams({ids:selectionIds(ids).slice(0,3).join(',')}),market);}
