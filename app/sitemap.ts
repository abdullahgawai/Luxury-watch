import {catalogue,settings} from '../lib/catalogue';
import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
export default async function sitemap(){if(settings().demo)return [];const origin=env.SITE_ORIGIN||'https://luxury-watch-explorer-india-uae.spicyrat3.chatgpt.site';const watches=await catalogue();return ['','/watches','/brands','/market','/guide','/methodology',...watches.map(w=>`/watches/${w.brand.toLowerCase()}/${w.reference.toLowerCase()}/${w.id}`)].map(path=>({url:origin+path}));}
