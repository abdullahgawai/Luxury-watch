import Site from '../site';
import {catalogue,settings} from '../../lib/catalogue';
import type {Watch} from '../../lib/catalogue';
import {notFound} from 'next/navigation';
import {publicRoute,routeExists,routeWatch} from '../../lib/public-routes.mjs';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}){
 const {slug}=await params,route=publicRoute(slug);if(!route)notFound();
 let watches:Watch[]=[],unavailable=false;
 if(['watch','brand'].includes(route.kind)){try{watches=await catalogue();}catch{unavailable=true;}if(!unavailable&&!routeExists(route,watches))notFound();}
 const w=routeWatch(route,watches);
 return {title:unavailable?`Catalogue unavailable | ${settings().name}`:w?`${w.brand} ${w.model} · ${w.reference} | ${settings().name}`:`${slug[0].charAt(0).toUpperCase()+slug[0].slice(1)} | ${settings().name}`,description:w?w.description:'Independent watch research for India and the UAE.',alternates:{canonical:route.path}};
}
export default async function Page({params,searchParams}:{params:Promise<{slug:string[]}>,searchParams:Promise<Record<string,string|string[]>>}){
 const {slug}=await params,route=publicRoute(slug);if(!route)notFound();
 const query=Object.fromEntries(Object.entries(await searchParams).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));
 let watches:Watch[]=[],unavailable=false;try{watches=await catalogue();}catch{unavailable=true;}
 if(!unavailable&&!routeExists(route,watches))notFound();
 return <Site page={route.path} watches={watches} config={settings()} unavailable={unavailable} initialQuery={query}/>;
}
