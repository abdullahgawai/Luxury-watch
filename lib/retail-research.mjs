// Research-only assembly: checked snapshots do not become live prices or production records.
export function attachRetailResearch(watches,observations,reviewedSources=[]){
 const output=watches.map(w=>({...w,sources:[...w.sources],prices:[...w.prices]}));
 const seen=new Set(output.flatMap(w=>w.prices.map(p=>p.id)));
 for(const observation of observations){
  if(observation.type!=='official_retail'||!['manufacturer','authorised_retailer'].includes(observation.sellerType))throw new Error('Evidenced retail observation required');
  const w=output.find(w=>w.id===observation.variantId);
  if(!w||!w.demo)throw new Error('Retail research requires an isolated catalogue configuration');
  for(const field of ['reference','dial','bracelet','material','size','configurationId'])if(observation[field]!==w[field])throw new Error('Retail configuration mismatch: '+field);
  const source=new URL(observation.sourceUrl),expectedLocale=observation.country==='IN'?'en-in':observation.country==='AE'?'ar-ae':null;
  const reviewed=reviewedSources.find(s=>s.id===observation.reviewedSourceId&&s.brand===w.brand&&s.country===observation.country&&s.category===observation.sellerType&&s.productUrls?.includes(observation.sourceUrl)&&s.configurationBindings?.some(b=>b.sourceUrl===observation.sourceUrl&&b.variantId===w.id&&b.reference===w.reference&&b.configurationId===w.configurationId));
  const rolexMatch=w.brand==='Rolex'&&observation.sellerType==='manufacturer'&&source.hostname==='www.rolex.com'&&source.pathname.startsWith('/'+expectedLocale+'/watches/')&&source.pathname.split('/').pop()===w.configurationId;
  if(!expectedLocale||source.protocol!=='https:'||(!rolexMatch&&!reviewed))throw new Error('Regional reviewed source does not match');
  if(reviewed?.category==='authorised_retailer'&&(!reviewed.authorisation?.url||!reviewed.authorisation?.evidence||!reviewed.authorisation?.checkedAt||!observation.retailBasis))throw new Error('Retailer authorisation and retail basis required');
  if(observation.currency!==(observation.country==='IN'?'INR':'AED')||!Number.isSafeInteger(observation.amountMinor)||observation.amountMinor<=0||observation.converted)throw new Error('Original local price required');
  if(seen.has(observation.id))throw new Error('Duplicate retail research observation');seen.add(observation.id);
  if(observation.reviewDecision&&!['published','archived_research'].includes(observation.reviewDecision))throw new Error('Invalid research review decision');
  if(observation.reviewDecision==='archived_research'&&!observation.archivalReason)throw new Error('Archival reason required');
  if(observation.retrievalMethod&&!['cached_web_research','direct_public_http','direct_source_snapshot'].includes(observation.retrievalMethod))throw new Error('Unsupported research retrieval method');
  if(observation.retrievalMethod==='direct_source_snapshot'&&(observation.reviewDecision==='archived_research'||observation.httpStatus!==200||!observation.responseSha256||!/^[a-f0-9]{64}$/i.test(observation.responseSha256)))throw new Error('Direct snapshot needs successful response evidence');
  const sourceId=observation.id+'-source';
  w.sources.push({id:sourceId,title:reviewed?.title||`${w.brand} official ${observation.country==='IN'?'India':'UAE'} retail page`,url:observation.sourceUrl,category:observation.sellerType,rights:'pending',permission:'Source-checked research snapshot; production publication review pending',checkedAt:observation.checkedAt,method:observation.method,...(reviewed?.authorisation?{authorisation:reviewed.authorisation}:{})});
  w.prices.push({id:observation.id,variantId:w.id,configurationId:w.configurationId,configurationMatch:Object.fromEntries(['reference','dial','bracelet','material','size'].map(k=>[k,w[k]])),country:observation.country,currency:observation.currency,amountMinor:observation.amountMinor,type:'official_retail',sourceId,status:observation.reviewDecision==='archived_research'?'archived_research':'published',archivalReason:observation.archivalReason,condition:observation.condition,boxPapers:observation.boxPapers,sellerType:observation.sellerType,taxStatus:observation.taxStatus,observedAt:observation.observedAt,checkedAt:observation.checkedAt,publisherEffectiveAt:null,...(observation.retrievalMethod==='direct_source_snapshot'?{httpStatus:observation.httpStatus,responseSha256:observation.responseSha256}:{}),retrievalMethod:observation.retrievalMethod==='direct_source_snapshot'?'direct_source_snapshot':'cached_web_research',retrievalCacheAgeLabel:observation.retrievalCacheAgeLabel,retailBasis:observation.retailBasis||'Manufacturer stated retail',evidence:observation.evidence+' '+observation.method});
 }
 return output;
}
