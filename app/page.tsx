import Site from './site';
import { catalogue, settings } from '../lib/catalogue';
import type { Watch } from '../lib/catalogue';
export const dynamic='force-dynamic';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]>>}){const query=Object.fromEntries(Object.entries(await searchParams).map(([key,value])=>[key,Array.isArray(value)?value[0]:value]));let watches:Watch[]=[],error=false;try{watches=await catalogue();}catch{error=true;}return <Site page="/" watches={watches} config={settings()} unavailable={error} initialQuery={query}/>;}
