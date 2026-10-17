import {validateCoverageReview} from './retail-reviews.mjs';
import {rankedMatches} from './watch-search.mjs';
import {evidenceTimestamp,validEvidenceDate,validObservationDates} from './evidence-dates.mjs';
export const PRICE_TYPES = ['official_retail','dealer_asking','private_asking','provider_estimate','verified_sale','dealer_purchase'];
export const MARKET_CURRENCY = { IN: 'INR', AE: 'AED' };
const day = 86400000;
export function fresh(p, now = Date.now()) {
  if(p.status==='archived_research')return false;
  const t = evidenceTimestamp(p.checkedAt);
  return validObservationDates(p.observedAt,p.checkedAt,now) && now - t <= (p.type === 'official_retail' ? 30 : 7) * day;
}
export function publishedObservations(w,country,now=Date.now()){
 return (w.prices||[]).filter(p=>p.variantId===w.id&&p.status==='published'&&!p.removed&&!p.excluded&&!p.converted&&Number.isSafeInteger(p.amountMinor)&&p.amountMinor>0&&(!country||p.country===country)&&(!MARKET_CURRENCY[p.country]||p.currency===MARKET_CURRENCY[p.country])&&validObservationDates(p.observedAt,p.checkedAt,now));
}
// A headline amount must never depend on array order when newest evidence disagrees.
// Original observations remain available separately with their sources and dates.
export function retailSummary(w,country,now=Date.now()){
 const rows=publishedObservations(w,country,now).filter(p=>p.type==='official_retail');
 const latest=rows.length?Math.max(...rows.map(p=>Date.parse(p.observedAt))):null;
 const observations=rows.filter(p=>Date.parse(p.observedAt)===latest).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 const basis=p=>JSON.stringify(['amountMinor','currency','condition','boxPapers','taxStatus','retailBasis'].map(key=>p[key]??null));
 const conflict=new Set(observations.map(basis)).size>1;
 return {observation:conflict?null:observations[0]??null,conflict,observations};
}
export function observationStatus(p,now=Date.now()){
 if(p.status==='archived_research')return 'Archived cached source · current retail unavailable';
 if(p.retrievalMethod==='direct_source_snapshot')return fresh(p,now)?'Direct source snapshot · price may change':'Direct source snapshot · needs source recheck';
 if(p.retrievalMethod==='cached_web_research')return fresh(p,now)?'Research snapshot · live price not verified':'Research snapshot · needs source recheck · live price not verified';
 return fresh(p,now)?'Within source-check window':'Needs source recheck';
}
export function archivedResearchObservations(w,country,now=Date.now()){
 const archived=(w.prices||[]).filter(p=>p.type==='official_retail'&&p.status==='archived_research'&&p.retrievalMethod==='cached_web_research'&&p.archivalReason);
 const eligible=new Set(publishedObservations({id:w.id,prices:archived.map(p=>({...p,status:'published'}))},country,now).map(p=>p.id));
 return archived.filter(p=>eligible.has(p.id));
}
function historyProblem(w,p,s,now=Date.now()){
 const text=value=>typeof value==='string'&&value.trim().length>0&&value.length<=500;
 if(p.historyEligible!==true)return 'Explicit observation history review required';
 if(typeof p.id!=='string'||!p.id||typeof p.evidence!=='string'||!p.evidence.trim())return 'Original observation identity and evidence required for history';
 if(s?.rights!=='approved'||s.historyAllowed!==true||!(s.historyPermissionRecorded===true||(typeof s.historyPermission==='string'&&s.historyPermission.trim())))return 'Explicit approved source history permission required';
 if(!validEvidenceDate(s.checkedAt,now))return 'Valid source check date required for history';
 try{if(new URL(s.url).protocol!=='https:')return 'HTTPS history source required';}catch{return 'HTTPS history source required';}
 if(['cached_web_research','direct_source_snapshot'].includes(p.retrievalMethod))return 'Research snapshots cannot qualify for history';
 if(!['INR','AED','USD','EUR','GBP','CHF'].includes(p.currency))return 'Unsupported history currency';
 if(['condition','boxPapers','sellerType','taxStatus'].some(key=>!text(p[key])||/unknown|unavailable|not (stated|confirmed|recorded)/i.test(p[key])))return 'Known comparable condition, box/papers, seller and tax basis required for history';
 if(['retailBasis','feeBasis','provider','assumptions','listingKey'].some(key=>p[key]!==undefined&&p[key]!==null&&!text(p[key])))return 'Invalid history comparison metadata';
 if(!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(p.observedAt||'')||!validObservationDates(p.observedAt,p.checkedAt,now))return 'Original timestamp and subsequent check required for history';
 if(p.type==='official_retail'&&!text(p.retailBasis))return 'Retail basis required for history';
 if(p.type==='verified_sale'&&(!text(p.feeBasis)||!text(p.saleEvidence)))return 'Verified-sale fee basis and completed transaction evidence required for history';
 if(p.type==='provider_estimate'&&(!text(p.provider)||!text(p.assumptions)))return 'Provider and comparable assumptions required for history';
 if(['dealer_asking','private_asking','dealer_purchase'].includes(p.type)&&!text(p.listingKey))return 'Stable offer identity required for history';
 if(p.sourceProductReference&&p.sourceProductReference!==w.reference)return 'History reference mismatch';
 if(p.configurationId&&p.configurationId!==w.configurationId)return 'History configuration mismatch';
 if(p.configurationMatch&&['reference','dial','bracelet','material','size'].some(key=>p.configurationMatch[key]!==w[key]))return 'History configuration mismatch';
 return null;
}
export function reliableHistoryObservations(w,country,type,now=Date.now()){
 if(w.demo||w.status!=='published'||!PRICE_TYPES.includes(type)||!['IN','AE','GLOBAL'].includes(country))return [];
 return publishedObservations(w,country,now).filter(p=>p.type===type&&!historyProblem(w,p,w.sources?.find(s=>s.id===p.sourceId),now));
}
export function percentile(values, q) {
  const a = [...values].sort((x,y) => x-y), pos = (a.length-1)*q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return a[lo] + (a[hi]-a[lo])*(pos-lo);
}
export function askingRange(prices, match, now = Date.now()) {
  const candidates = prices.filter(p => {
    if (!['IN','AE'].includes(match.country)||!['dealer_asking','private_asking'].includes(match.type) || p.type !== match.type || p.status !== 'published' || p.removed || p.excluded || p.converted || p.currency!==MARKET_CURRENCY[p.country] || !Number.isSafeInteger(p.amountMinor) || p.amountMinor <= 0) return false;
    if (['variantId','country','currency','condition','boxPapers','sellerType'].some(k => !match[k] || p[k] !== match[k])) return false;
    const age = now - Date.parse(p.observedAt);
    return Number.isFinite(age) && age >= 0 && age <= 30*day && fresh(p,now) && typeof p.listingKey==='string' && !!p.listingKey.trim();
  });
  const listings=new Map();for(const p of candidates){if(!listings.has(p.listingKey))listings.set(p.listingKey,[]);listings.get(p.listingKey).push(p);}
  const eligible=[];let conflictingListings=0;
  for(const rows of listings.values()){
    const latest=Math.max(...rows.map(p=>Date.parse(p.observedAt))),newest=rows.filter(p=>Date.parse(p.observedAt)===latest);
    if(new Set(newest.map(p=>JSON.stringify([p.amountMinor,p.taxStatus??null]))).size>1){conflictingListings++;continue;}
    eligible.push(newest.sort((a,b)=>String(a.id).localeCompare(String(b.id)))[0]);
  }
  eligible.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||String(a.id).localeCompare(String(b.id)));
  const summary={count:eligible.length,observations:eligible,duplicateObservations:candidates.length-listings.size,conflictingListings,window:eligible.length?{from:eligible[0].observedAt,to:eligible.at(-1).observedAt}:null};
  if(eligible.length < 5) return {...summary,range:null,reviewOutliers:[]};
  const a=eligible.map(p=>p.amountMinor);
  const q1=percentile(a,.25), q3=percentile(a,.75), iqr=q3-q1;
  return { ...summary, range:{low:q1,median:percentile(a,.5),high:q3}, reviewOutliers:eligible.filter(p=>p.amountMinor<q1-1.5*iqr||p.amountMinor>q3+1.5*iqr).map(p=>p.id) };
}
export function premium(market, retail) {
  if(market?.status==='archived_research'||retail?.status==='archived_research')return null;
  if (!market || !retail || retail.type !== 'official_retail' || !Number.isSafeInteger(retail.amountMinor) || retail.amountMinor<=0 || !Number.isSafeInteger(market.amountMinor) || market.amountMinor<=0 || ['variantId','country','currency'].some(k=>!retail[k]||retail[k]!==market[k])) return null;
  return (market.amountMinor-retail.amountMinor)/retail.amountMinor*100;
}
export function convertPrice(p, fx, now=Date.now()) {
  if(!Number.isSafeInteger(p.amountMinor)||p.amountMinor<=0||!['INR','AED','USD','EUR','GBP','CHF'].includes(fx.quote)) throw new Error('Invalid conversion amount or currency');
  if(p.currency!==fx.base || !/^\d+(\.\d{1,8})?$/.test(fx.rate) || Number(fx.rate)<=0 || !fx.source || !validEvidenceDate(fx.at,now)) throw new Error('Invalid FX evidence');
  const [whole,frac='']=fx.rate.split('.'), factor=10n**BigInt(frac.length), rate=BigInt(whole+frac);
  const amountMinor=Number((BigInt(p.amountMinor)*rate+factor/2n)/factor);
  if(!Number.isSafeInteger(amountMinor)||amountMinor<=0)throw new Error('Converted amount exceeds supported precision');
  return { ...p, original:{amountMinor:p.amountMinor,currency:p.currency,country:p.country}, amountMinor,currency:fx.quote,converted:true,fx,stale:now-Date.parse(fx.at)>day };
}
export function searchWatches(watches, query={}, prices=[], limit=100) {
  let a=rankedMatches(watches,query.q||'').filter(w=> (!query.brand||w.brand===query.brand) && (!query.size||String(w.size)===query.size) && (!query.material||w.material===query.material) && (!query.movement||w.movement===query.movement) && (!query.collection||w.collections.includes(query.collection)));
  const val=w=>retailSummary({...w,prices},query.market||'IN').observation?.amountMinor;
  if(query.maxPrice) a=a.filter(w=>val(w)!==undefined&&val(w)<=Number(query.maxPrice)*100);
  if(query.sort==='price') a.sort((x,y)=>(val(x)??Infinity)-(val(y)??Infinity));
  else if(query.sort==='name') a.sort((x,y)=>x.model.localeCompare(y.model));
  return a.slice(0,Number.isInteger(limit)&&limit>0?Math.min(limit,1000):100);
}
function fail(msg){throw new Error(msg);}
export function validateRecord(r, production=true) {
  if (!r || typeof r !== 'object' || !/^[a-z0-9][a-z0-9-]{2,100}$/.test(r.id||'')) fail('A stable lowercase variant ID is required');
  for(const k of ['brand','model','reference','dial','bracelet','material','description']) if(typeof r[k]!=='string'||!r[k].trim()||r[k].length>2000) fail('Missing or invalid '+k);
  if(!Array.isArray(r.aliases)||!Array.isArray(r.collections)||r.aliases.some(x=>typeof x!=='string')||r.collections.some(x=>typeof x!=='string')) fail('Aliases and collections must be arrays of strings');
  if (r.size !== null && (typeof r.size!=='number'||r.size<10||r.size>70)) fail('Invalid case size');
  if(production&&r.demo!==false) fail('Demonstration or unclassified records cannot enter production; demo must be false');
  if(r.retailCoverageReviews!==undefined){if(production)fail('Research coverage reviews cannot enter production');if(!Array.isArray(r.retailCoverageReviews)||r.retailCoverageReviews.length>10)fail('Invalid coverage reviews');for(const review of r.retailCoverageReviews)validateCoverageReview(review,r);}
  if(!Array.isArray(r.sources)||!r.sources.length) fail('Source evidence required');
  if(r.sources.length>30||r.prices?.length>100||r.aliases.length>30||r.collections.length>10) fail('Record exceeds bounded import limits');
  if(new Set(r.sources.map(s=>s.id)).size!==r.sources.length) fail('Duplicate source identifiers');
  for(const s of r.sources){
    if(!/^[a-z0-9-]+$/.test(s.id||'')||typeof s.title!=='string'||!s.title||!['manufacturer','authorised_retailer','dealer','private_seller','provider','auction','editorial'].includes(s.category)) fail('Invalid source');
    let u; try{u=new URL(s.url);}catch{fail('Invalid source URL');} if(u.protocol!=='https:') fail('Sources require HTTPS');
    if(!s.permission||!s.method||!validEvidenceDate(s.checkedAt)) fail('Source permission, method and valid ISO check date required');
    if(production&&s.rights!=='approved') fail('Source rights must be approved');
    if(s.historyAllowed!==undefined&&typeof s.historyAllowed!=='boolean')fail('History permission must be explicitly true or false');
    if(s.historyAllowed===true&&(s.rights!=='approved'||typeof s.historyPermission!=='string'||!s.historyPermission.trim()||s.historyPermission.length>2000))fail('Approved source history permission details required');
    if(s.category==='authorised_retailer'){
      const a=s.authorisation,hosts={Rolex:['www.rolex.com'],Omega:['www.omegawatches.com','www.omegawatches.com.hk'],Cartier:['stores.cartier.com','www.cartier.com'],Tudor:['www.tudorwatch.com']};
      let u;try{u=new URL(a?.url);}catch{fail('Manufacturer retailer-authorisation evidence required');}
      if(u.protocol!=='https:'||!hosts[r.brand]?.includes(u.hostname)||!a.title||!a.evidence||!validEvidenceDate(a.checkedAt))fail('Manufacturer retailer-authorisation evidence required');
    }
  }
  for(const [k,v] of Object.entries({brand:r.brand,model:r.model,reference:r.reference,size:r.size,material:r.material,dial:r.dial,bracelet:r.bracelet,movement:r.movement,calibre:r.calibre,powerReserve:r.powerReserve,waterResistance:r.waterResistance,bezel:r.bezel,description:r.description})) if(v!==null&&v!==undefined&&(!r.evidence?.[k]||!r.sources.some(s=>s.id===r.evidence[k]))) fail('Missing field evidence: '+k);
  const photos=r.images?.length?r.images:r.image?[r.image]:[];
  if(!Array.isArray(photos)||photos.length>12)fail('Invalid image gallery');
  if(r.image&&photos.length&&!photos.some(p=>p.url===r.image.url))fail('Primary image must belong to the gallery');
  for(const p of [...photos,...(r.image?[r.image]:[])]){
    if(!p.url?.startsWith('/')||p.url.startsWith('//')||p.url.includes('..')||p.rights!=='approved'||!p.permission||!p.holder||!p.alt)fail('Image rights and local asset required');
    if(p.variantId!==r.id||p.reference!==r.reference||p.matchStatus!=='approved'||!p.matchEvidence)fail('Approved exact-configuration image match required');
    if(!p.license||!p.changes||![p.licenseUrl,p.sourceUrl].every(u=>{try{return new URL(u).protocol==='https:';}catch{return false;}}))fail('Image licence, source and changes required');
    for(const k of ['thumbnail','originalUrl'])if(p[k]&&(!p[k].startsWith('/')||p[k].startsWith('//')||p[k].includes('..')))fail('Image derivatives and originals require local asset paths');
    if(!Number.isSafeInteger(p.width)||p.width<=0||p.width>10000||!Number.isSafeInteger(p.height)||p.height<=0||p.height>10000)fail('Image dimensions required');
    if(!validEvidenceDate(p.checkedAt))fail('Valid image licence-check date required');
  }
  if(!Array.isArray(r.prices)) fail('Prices must be an array');
  const keys=new Set();
  for(const p of r.prices){
    if(!p.id||keys.has(p.id)) fail('Duplicate/missing observation ID'); keys.add(p.id);
    if(p.variantId!==r.id||!PRICE_TYPES.includes(p.type)||!Number.isSafeInteger(p.amountMinor)||p.amountMinor<=0) fail('Invalid price/configuration');
    if(p.sourceProductReference&&p.sourceProductReference!==r.reference)fail('Priced source reference mismatch');
    if(p.configurationId&&p.configurationId!==r.configurationId)fail('Price configuration identifier mismatch');
    if(p.configurationMatch&&['reference','dial','bracelet','material','size'].some(k=>p.configurationMatch[k]!==r[k]))fail('Price configuration evidence mismatch');
    if(!['IN','AE','GLOBAL'].includes(p.country)||!['INR','AED','USD','EUR','GBP','CHF'].includes(p.currency)||p.converted) fail('Invalid original price scope/currency');
    if(MARKET_CURRENCY[p.country]&&p.currency!==MARKET_CURRENCY[p.country]) fail('Local price must use local currency');
    const s=r.sources.find(s=>s.id===p.sourceId); if(!s||!p.evidence||typeof p.evidence!=='string') fail('Price provenance required');
    if(!validObservationDates(p.observedAt,p.checkedAt)) fail('Valid ISO observation and subsequent check dates required');
    if(['condition','boxPapers','sellerType','taxStatus'].some(k=>typeof p[k]!=='string'||!p[k])) fail('Price metadata required');
    if(p.type==='official_retail'&&!['manufacturer','authorised_retailer'].includes(s.category)) fail('Official retail requires an authorised source');
    if(p.type==='official_retail'&&s.category==='authorised_retailer'&&(p.sellerType!=='authorised_retailer'||!p.retailBasis))fail('Retailer price basis required');
    if(['dealer_asking','private_asking'].includes(p.type)&&!p.listingKey) fail('Listing deduplication key required');
    if(p.type==='verified_sale'&&!p.saleEvidence) fail('Completed sale evidence required');
    if(p.type==='provider_estimate'&&(!p.assumptions||!p.provider)) fail('Provider estimate methodology required');
    if(p.removed&&p.type==='verified_sale') fail('Removed listings are not confirmed sales');
    if(p.retrievalMethod==='direct_source_snapshot'&&(p.httpStatus!==200||!/^[a-f0-9]{64}$/i.test(p.responseSha256||'')||!p.configurationId||!p.configurationMatch))fail('Direct source snapshot requires successful response and exact configuration evidence');
    if(p.status==='archived_research'&&(p.type!=='official_retail'||p.retrievalMethod!=='cached_web_research'||!p.archivalReason))fail('Archived research needs its cache limitation and reason');
    if(p.historyEligible!==undefined&&typeof p.historyEligible!=='boolean')fail('Observation history eligibility must be explicitly true or false');
    if(p.historyEligible===true){const problem=historyProblem(r,p,s);if(problem)fail(problem);if(r.demo)fail('Demonstration observations cannot qualify for history');}
  }
  return r;
}
export function canEdit(userId, allowlist='') { return !!userId && allowlist.split(',').map(x=>x.trim()).filter(Boolean).includes(userId); }
export function nextState(current,action){const t={review:{draft:'review'},publish:{review:'published'},withdraw:{published:'draft'},revise:{draft:'draft'}};return t[action]?.[current]||null;}
