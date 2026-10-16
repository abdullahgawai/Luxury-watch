import {env} from 'cloudflare:workers';
import {publicWatch} from './public-catalogue.mjs';
const scanLimit=5000;
const catalogueLimit=1000;
export async function operationalHealth(database:D1Database,now=Date.now()){
 const [records,corrections,observations,evaluations,published]=await Promise.all([
  database.prepare('SELECT state,COUNT(*) AS count FROM records GROUP BY state').all<{state:string,count:number}>(),
  database.prepare("SELECT COUNT(*) AS count,MIN(created_at) AS oldest FROM corrections WHERE state='pending'").first<{count:number,oldest:string|null}>(),
  database.prepare("SELECT o.payload FROM observations o JOIN records r ON r.id=o.record_id WHERE r.state='published' LIMIT ?").bind(scanLimit+1).all<{payload:string}>(),
  database.prepare("SELECT COUNT(*) AS count FROM audit WHERE entity_id='thewatchapi' AND action='evaluate' AND at>=?").bind(new Date(now-3600000).toISOString()).first<{count:number}>(),
  database.prepare("SELECT payload FROM records WHERE state='published' ORDER BY brand,reference LIMIT ?").bind(catalogueLimit+1).all<{payload:string}>()
 ]);
 const counts=Object.fromEntries(records.results.map(r=>[r.state,r.count]));
 let stale=0,invalid=0,checkedCount=0;
 for(const row of observations.results.slice(0,scanLimit)){
  try{const p=JSON.parse(row.payload);if(p.status!=='published')continue;checkedCount++;const checked=Date.parse(p.checkedAt),window=(p.type==='official_retail'?30:7)*86400000;
   if(!Number.isFinite(checked)||checked>now)invalid++;else if(now-checked>window)stale++;
  }catch{checkedCount++;invalid++;}
 }
 // Match the production reader's first 1000 rows, regardless of research mode.
 // Aggregate only: rejected payloads and protected metadata never leave this check.
 const publication={checked:0,visible:0,withheld:0,invalidPayloads:0,withheldPrices:0,withheldPhotos:0,truncated:published.results.length>catalogueLimit};
 for(const row of published.results.slice(0,catalogueLimit)){
  publication.checked++;
  let record;try{record=JSON.parse(row.payload);}catch{publication.invalidPayloads++;publication.withheld++;continue;}
  const watch=publicWatch(record,{production:true,now});
  if(!watch){publication.withheld++;continue;}
  publication.visible++;
  publication.withheldPrices+=record.prices.filter((p:any)=>p?.status==='published'&&!watch.prices.some(q=>q.id===p.id&&q.status==='published')).length;
  if(record.image&&!watch.image)publication.withheldPhotos++;
 }
 const warnings:string[]=[];
 if(env.DATA_MODE!=='production')warnings.push('Research mode is active; production data publication is not verified.');
 if(env.DATA_MODE==='production'&&!counts.published)warnings.push('The production catalogue has no published records.');
 if(stale)warnings.push('Published price observations need source rechecks.');
 if(invalid)warnings.push('Published price check dates or payloads need editorial review.');
 if(observations.results.length>scanLimit)warnings.push('Observation scan limit reached; counts describe a partial scan.');
 if(publication.withheld)warnings.push('Published records are withheld by production source, identity or rights checks; review them in the editorial queue.');
 if(publication.withheldPrices)warnings.push('Published price entries are withheld by public evidence checks; review exact configurations, sources and dates.');
 if(publication.withheldPhotos)warnings.push('Primary photos are withheld by publication checks; review licensing and exact configuration evidence.');
 if(publication.truncated)warnings.push('Production catalogue limit reached; only the first 1000 published records are checked and served.');
 if(env.THEWATCHAPI_ENABLED==='true'&&!env.THEWATCHAPI_TOKEN)warnings.push('Provider evaluation is enabled without a configured token.');
 return {status:warnings.length?'needs_attention':'ok',checkedAt:new Date(now).toISOString(),database:'ok',dataMode:env.DATA_MODE==='production'?'production':'research',records:{draft:counts.draft||0,review:counts.review||0,published:counts.published||0},publication,corrections:{pending:corrections?.count||0,oldestPendingAt:corrections?.oldest||null},prices:{checked:checkedCount,stale,invalid,truncated:observations.results.length>scanLimit},provider:{enabled:env.THEWATCHAPI_ENABLED==='true',tokenConfigured:!!env.THEWATCHAPI_TOKEN,evaluationsLastHour:evaluations?.count||0},automation:{alerts:'not_configured',hostedRestore:'not_verified'},warnings};
}
