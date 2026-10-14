// Research-only assembly: checked snapshots do not become live prices or production records.
export function attachRetailResearch(watches,observations){
 const output=watches.map(w=>({...w,sources:[...w.sources],prices:[...w.prices]}));
 const seen=new Set(output.flatMap(w=>w.prices.map(p=>p.id)));
 for(const observation of observations){
  if(observation.type!=='official_retail'||observation.sellerType!=='manufacturer')throw new Error('Manufacturer retail observation required');
  const w=output.find(w=>w.id===observation.variantId);
  if(!w||!w.demo)throw new Error('Retail research requires an isolated catalogue configuration');
  for(const field of ['reference','dial','bracelet','material','size','configurationId'])if(observation[field]!==w[field])throw new Error('Retail configuration mismatch: '+field);
  const source=new URL(observation.sourceUrl),expectedLocale=observation.country==='IN'?'en-in':observation.country==='AE'?'ar-ae':null;
  if(!expectedLocale||source.protocol!=='https:'||source.hostname!=='www.rolex.com'||!source.pathname.startsWith('/'+expectedLocale+'/watches/')||source.pathname.split('/').pop()!==w.configurationId)throw new Error('Regional manufacturer source does not match');
  if(observation.currency!==(observation.country==='IN'?'INR':'AED')||!Number.isSafeInteger(observation.amountMinor)||observation.amountMinor<=0||observation.converted)throw new Error('Original local price required');
  if(seen.has(observation.id))throw new Error('Duplicate retail research observation');seen.add(observation.id);
  const sourceId=observation.id+'-source';
  w.sources.push({id:sourceId,title:`${w.brand} official ${observation.country==='IN'?'India':'UAE'} retail page`,url:observation.sourceUrl,category:'manufacturer',rights:'pending',permission:'Source-checked research snapshot; production publication review pending',checkedAt:observation.checkedAt,method:observation.method});
  w.prices.push({id:observation.id,variantId:w.id,configurationId:w.configurationId,configurationMatch:Object.fromEntries(['reference','dial','bracelet','material','size'].map(k=>[k,w[k]])),country:observation.country,currency:observation.currency,amountMinor:observation.amountMinor,type:'official_retail',sourceId,status:'published',condition:observation.condition,boxPapers:observation.boxPapers,sellerType:observation.sellerType,taxStatus:observation.taxStatus,observedAt:observation.observedAt,checkedAt:observation.checkedAt,publisherEffectiveAt:null,retrievalMethod:'cached_web_research',retrievalCacheAgeLabel:observation.retrievalCacheAgeLabel,evidence:observation.evidence+' '+observation.method});
 }
 return output;
}
