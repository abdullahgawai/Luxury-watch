export const PRICE_TYPES = ['official_retail','dealer_asking','private_asking','provider_estimate','verified_sale','dealer_purchase'];
export const MARKET_CURRENCY = { IN: 'INR', AE: 'AED' };
const day = 86400000;
export function fresh(p, now = Date.now()) {
  const t = Date.parse(p.checkedAt || p.observedAt);
  return Number.isFinite(t) && t <= now && now - t <= (p.type === 'official_retail' ? 30 : 7) * day;
}
export function percentile(values, q) {
  const a = [...values].sort((x,y) => x-y), pos = (a.length-1)*q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return a[lo] + (a[hi]-a[lo])*(pos-lo);
}
export function askingRange(prices, match, now = Date.now()) {
  const seen = new Set();
  const eligible = prices.filter(p => {
    if (!['dealer_asking','private_asking'].includes(match.type) || p.type !== match.type || p.status !== 'published' || p.removed || p.excluded || !Number.isSafeInteger(p.amountMinor) || p.amountMinor <= 0) return false;
    if (['variantId','country','currency','condition','boxPapers','sellerType'].some(k => !match[k] || p[k] !== match[k])) return false;
    const age = now - Date.parse(p.observedAt);
    if (!Number.isFinite(age) || age < 0 || age > 30*day || !fresh(p,now) || !p.listingKey || seen.has(p.listingKey)) return false;
    seen.add(p.listingKey); return true;
  });
  if(eligible.length < 5) return { count:eligible.length, range:null, observations:eligible };
  const a=eligible.map(p=>p.amountMinor);
  const q1=percentile(a,.25), q3=percentile(a,.75), iqr=q3-q1;
  return { count:a.length, range:{low:q1,median:percentile(a,.5),high:q3}, observations:eligible, reviewOutliers:eligible.filter(p=>p.amountMinor<q1-1.5*iqr||p.amountMinor>q3+1.5*iqr).map(p=>p.id) };
}
export function premium(market, retail) {
  if (!market || !retail || retail.type !== 'official_retail' || !Number.isSafeInteger(retail.amountMinor) || retail.amountMinor<=0 || !Number.isSafeInteger(market.amountMinor) || market.amountMinor<=0 || ['variantId','country','currency'].some(k=>!retail[k]||retail[k]!==market[k])) return null;
  return (market.amountMinor-retail.amountMinor)/retail.amountMinor*100;
}
export function convertPrice(p, fx, now=Date.now()) {
  if(!Number.isSafeInteger(p.amountMinor)||p.amountMinor<=0||!['INR','AED','USD','EUR','GBP','CHF'].includes(fx.quote)) throw new Error('Invalid conversion amount or currency');
  if(p.currency!==fx.base || !/^\d+(\.\d{1,8})?$/.test(fx.rate) || Number(fx.rate)<=0 || !fx.source || !Number.isFinite(Date.parse(fx.at)) || Date.parse(fx.at)>now) throw new Error('Invalid FX evidence');
  const [whole,frac='']=fx.rate.split('.'), factor=10n**BigInt(frac.length), rate=BigInt(whole+frac);
  const amountMinor=Number((BigInt(p.amountMinor)*rate+factor/2n)/factor);
  if(!Number.isSafeInteger(amountMinor)||amountMinor<=0)throw new Error('Converted amount exceeds supported precision');
  return { ...p, original:{amountMinor:p.amountMinor,currency:p.currency,country:p.country}, amountMinor,currency:fx.quote,converted:true,fx,stale:now-Date.parse(fx.at)>day };
}
export function searchWatches(watches, query={}, prices=[]) {
  const q=(query.q||'').trim().toLowerCase();
  let a=watches.filter(w=> (!q||[w.brand,w.model,w.reference,...w.aliases].join(' ').toLowerCase().includes(q)) && (!query.brand||w.brand===query.brand) && (!query.size||String(w.size)===query.size) && (!query.material||w.material===query.material) && (!query.movement||w.movement===query.movement) && (!query.collection||w.collections.includes(query.collection)));
  const val=w=>prices.filter(p=>p.variantId===w.id&&p.country===(query.market||'IN')&&p.currency===MARKET_CURRENCY[query.market||'IN']&&p.type==='official_retail'&&p.amountMinor>0).sort((x,y)=>Date.parse(y.observedAt)-Date.parse(x.observedAt))[0]?.amountMinor;
  if(query.maxPrice) a=a.filter(w=>val(w)!==undefined&&val(w)<=Number(query.maxPrice)*100);
  if(query.sort==='price') a.sort((x,y)=>(val(x)??Infinity)-(val(y)??Infinity));
  else if(query.sort==='name') a.sort((x,y)=>x.model.localeCompare(y.model));
  else a.sort((x,y)=>Number(y.reference.toLowerCase()===q)-Number(x.reference.toLowerCase()===q));
  return a.slice(0,100);
}
function fail(msg){throw new Error(msg);}
export function validateRecord(r, production=true) {
  if (!r || typeof r !== 'object' || !/^[a-z0-9][a-z0-9-]{2,100}$/.test(r.id||'')) fail('A stable lowercase variant ID is required');
  for(const k of ['brand','model','reference','dial','bracelet','material','description']) if(typeof r[k]!=='string'||!r[k].trim()||r[k].length>2000) fail('Missing or invalid '+k);
  if(!Array.isArray(r.aliases)||!Array.isArray(r.collections)||r.aliases.some(x=>typeof x!=='string')||r.collections.some(x=>typeof x!=='string')) fail('Aliases and collections must be arrays of strings');
  if (r.size !== null && (typeof r.size!=='number'||r.size<10||r.size>70)) fail('Invalid case size');
  if(production&&r.demo) fail('Demonstration records cannot enter production');
  if(!Array.isArray(r.sources)||!r.sources.length) fail('Source evidence required');
  if(r.sources.length>30||r.prices?.length>100||r.aliases.length>30||r.collections.length>10) fail('Record exceeds bounded import limits');
  if(new Set(r.sources.map(s=>s.id)).size!==r.sources.length) fail('Duplicate source identifiers');
  for(const s of r.sources){
    if(!/^[a-z0-9-]+$/.test(s.id||'')||typeof s.title!=='string'||!s.title||!['manufacturer','authorised_retailer','dealer','private_seller','provider','auction','editorial'].includes(s.category)) fail('Invalid source');
    let u; try{u=new URL(s.url);}catch{fail('Invalid source URL');} if(u.protocol!=='https:') fail('Sources require HTTPS');
    if(!s.permission||!s.method||!Number.isFinite(Date.parse(s.checkedAt))||Date.parse(s.checkedAt)>Date.now()) fail('Source permission, method and checked date required');
    if(production&&s.rights!=='approved') fail('Source rights must be approved');
  }
  for(const [k,v] of Object.entries({brand:r.brand,model:r.model,reference:r.reference,size:r.size,material:r.material,dial:r.dial,bracelet:r.bracelet,movement:r.movement,calibre:r.calibre,powerReserve:r.powerReserve,waterResistance:r.waterResistance,bezel:r.bezel,description:r.description})) if(v!==null&&v!==undefined&&(!r.evidence?.[k]||!r.sources.some(s=>s.id===r.evidence[k]))) fail('Missing field evidence: '+k);
  if(r.image){ if(!r.image.url?.startsWith('/')||r.image.url.startsWith('//')||r.image.rights!=='approved'||!r.image.permission||!r.image.holder||!r.image.alt) fail('Image rights and local asset required'); }
  if(!Array.isArray(r.prices)) fail('Prices must be an array');
  const keys=new Set();
  for(const p of r.prices){
    if(!p.id||keys.has(p.id)) fail('Duplicate/missing observation ID'); keys.add(p.id);
    if(p.variantId!==r.id||!PRICE_TYPES.includes(p.type)||!Number.isSafeInteger(p.amountMinor)||p.amountMinor<=0) fail('Invalid price/configuration');
    if(!['IN','AE','GLOBAL'].includes(p.country)||!['INR','AED','USD','EUR','GBP','CHF'].includes(p.currency)||p.converted) fail('Invalid original price scope/currency');
    if(MARKET_CURRENCY[p.country]&&p.currency!==MARKET_CURRENCY[p.country]) fail('Local price must use local currency');
    const s=r.sources.find(s=>s.id===p.sourceId); if(!s||!p.evidence||typeof p.evidence!=='string') fail('Price provenance required');
    if(!Number.isFinite(Date.parse(p.observedAt))||!Number.isFinite(Date.parse(p.checkedAt))||Date.parse(p.observedAt)>Date.now()||Date.parse(p.checkedAt)>Date.now()) fail('Valid observation and check dates required');
    if(['condition','boxPapers','sellerType','taxStatus'].some(k=>typeof p[k]!=='string'||!p[k])) fail('Price metadata required');
    if(p.type==='official_retail'&&!['manufacturer','authorised_retailer'].includes(s.category)) fail('Official retail requires an authorised source');
    if(['dealer_asking','private_asking'].includes(p.type)&&!p.listingKey) fail('Listing deduplication key required');
    if(p.type==='verified_sale'&&!p.saleEvidence) fail('Completed sale evidence required');
    if(p.type==='provider_estimate'&&(!p.assumptions||!p.provider)) fail('Provider estimate methodology required');
    if(p.removed&&p.type==='verified_sale') fail('Removed listings are not confirmed sales');
  }
  return r;
}
export function canEdit(userId, allowlist='') { return !!userId && allowlist.split(',').map(x=>x.trim()).filter(Boolean).includes(userId); }
export function nextState(current,action){const t={review:{draft:'review'},publish:{review:'published'},withdraw:{published:'draft'},revise:{draft:'draft'}};return t[action]?.[current]||null;}
