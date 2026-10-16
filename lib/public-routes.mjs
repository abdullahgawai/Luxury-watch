const sections=new Set(['watches','brands','compare','market','guide','saved','methodology','credits','coverage','corrections','contact','privacy','admin']);
const guides=new Set(['reference','gmt','chronograph','power-reserve','automatic','water-resistance']);
export function publicRoute(slug){
 if(!Array.isArray(slug)||!slug.length||slug.some(s=>typeof s!=='string'||!s||s.length>120)||!sections.has(slug[0]))return null;
 const path='/'+slug.join('/');
 if(slug.length===1)return {path,kind:'section'};
 if(slug[0]==='guide'&&slug.length===2&&guides.has(slug[1]))return {path,kind:'guide'};
 if(slug[0]==='brands'&&slug.length===2&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug[1]))return {path,kind:'brand',brand:slug[1]};
 if(slug[0]==='watches'&&slug.length===4&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug[1])&&/^[a-z0-9][a-z0-9.-]{0,119}$/.test(slug[2])&&/^[a-z0-9][a-z0-9-]{2,100}$/.test(slug[3]))return {path,kind:'watch'};
 return null;
}
export function routeWatch(route,watches){return route.kind==='watch'?watches.find(w=>`/watches/${w.brand.toLowerCase()}/${w.reference.toLowerCase()}/${w.id}`===route.path):undefined;}
export function routeExists(route,watches){return route.kind==='watch'?!!routeWatch(route,watches):route.kind==='brand'?watches.some(w=>w.brand.toLowerCase()===route.brand):true;}
export function catalogueDependent(path){return ['watches','brands','compare','market','saved','coverage'].some(section=>path==='/'+section||path.startsWith('/'+section+'/'));}
export function retryPageHref(path,query,market){const params=new URLSearchParams();for(const [key,value] of Object.entries(query))if(typeof value==='string')params.set(key,value);params.set('market',market==='AE'?'AE':'IN');return path+'?'+params;}
