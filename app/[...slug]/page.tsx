import Site from '../site';
import { catalogue, settings } from '../../lib/catalogue';
import type { Watch } from '../../lib/catalogue';
import { notFound } from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const path='/'+slug.join('/');let watches:Watch[]=[];try{watches=await catalogue();}catch{}const w=watches.find(w=>`/watches/${w.brand.toLowerCase()}/${w.reference.toLowerCase()}/${w.id}`===path);return {title:w?`${w.brand} ${w.model} · ${w.reference} | ${settings().name}`:`${slug[0].charAt(0).toUpperCase()+slug[0].slice(1)} | ${settings().name}`,description:w?w.description:'Independent watch research for India and the UAE.',alternates:{canonical:path}};}
export default async function Page({params,searchParams}:{params:Promise<{slug:string[]}>,searchParams:Promise<Record<string,string|string[]>>}){
 const {slug}=await params;const query=Object.fromEntries(Object.entries(await searchParams).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]));const page='/'+slug.join('/');let watches:Watch[]=[],error=false;try{watches=await catalogue();}catch{error=true;}
 const valid=['watches','brands','compare','market','guide','saved','methodology','corrections','contact','privacy','admin'];
 if(!valid.includes(slug[0]))notFound();
 if(slug[0]==='watches'&&slug.length>1&&!watches.some(w=>`/watches/${w.brand.toLowerCase()}/${w.reference.toLowerCase()}/${w.id}`===page)&&!error)notFound();
 if(slug[0]==='brands'&&slug.length>1&&!watches.some(w=>w.brand.toLowerCase()===slug[1]))notFound();
 if(slug[0]==='guide'&&slug.length>1&&!['reference','gmt','chronograph','power-reserve','automatic','water-resistance'].includes(slug[1]))notFound();
 return <Site page={page} watches={watches} config={settings()} unavailable={error} initialQuery={query}/>;
}
