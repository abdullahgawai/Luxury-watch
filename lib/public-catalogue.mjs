import {publishedObservations,archivedResearchObservations,PRICE_TYPES,MARKET_CURRENCY} from './domain.mjs';
import {validateCoverageReview} from './retail-reviews.mjs';
import {validEvidenceDate} from './evidence-dates.mjs';

const text=(value,max=2000)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const dated=validEvidenceDate;
const pick=(value,keys)=>Object.fromEntries(keys.filter(key=>value[key]===null||['string','boolean'].includes(typeof value[key])||(typeof value[key]==='number'&&Number.isFinite(value[key]))).map(key=>[key,value[key]]));
function https(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&![...u.searchParams.keys()].some(key=>['token','apitoken','accesstoken','apikey','authorization'].includes(key.toLowerCase().replace(/[-_]/g,'')));}catch{return false;}}
function localAsset(value){try{return typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')&&!/[\\?#\u0000-\u001f]/.test(value)&&!decodeURIComponent(value).includes('..');}catch{return false;}}
const identity=['brand','model','reference','dial','bracelet','material','description'];
const specs=['size','movement','calibre','powerReserve','waterResistance','bezel'];
const priceFields=['id','variantId','type','amountMinor','currency','country','condition','boxPapers','sellerType','taxStatus','observedAt','checkedAt','sourceId','evidence','status','listingKey','saleEvidence','provider','assumptions','retailBasis','feeBasis','historyEligible','configurationId','sourceProductReference','retrievalMethod','publisherEffectiveAt','retrievalCacheAgeLabel','httpStatus','responseSha256','archivalReason'];
const photoFields=['id','url','thumbnail','originalUrl','sourceUrl','alt','rights','permission','holder','license','licenseUrl','changes','width','height','variantId','reference','matchStatus','matchEvidence','checkedAt','configurationNote','sha256'];
const publicPrice=p=>{const price=pick(p,priceFields);if(p.configurationMatch)price.configurationMatch=pick(p.configurationMatch,['reference','dial','bracelet','material','size']);return price;};

function publicSource(s,brand,production,now){
 if(!s||!text(s.id)||!text(s.title)||!https(s.url)||!dated(s.checkedAt,now)||!text(s.permission)||!text(s.method)||!['manufacturer','authorised_retailer','dealer','private_seller','provider','auction','editorial'].includes(s.category)||(production&&s.rights!=='approved')||!['approved','pending'].includes(s.rights))return null;
 const output=pick(s,['id','title','url','category','rights','permission','checkedAt','method']);
 if(s.category==='authorised_retailer'){
  const a=s.authorisation,hosts={Rolex:['www.rolex.com'],Omega:['www.omegawatches.com','www.omegawatches.com.hk'],Cartier:['stores.cartier.com','www.cartier.com'],Tudor:['www.tudorwatch.com']};
  if(!a||!https(a.url)||!hosts[brand]?.includes(new URL(a.url).hostname)||!text(a.title)||!text(a.evidence,10000)||!dated(a.checkedAt,now))return null;
  output.authorisation=pick(a,['url','title','evidence','checkedAt']);
 }
 // Keep permission/contract details in the protected payload, not in client props.
 if(s.historyAllowed===true&&s.rights==='approved'&&text(s.historyPermission)){
  output.historyAllowed=true;output.historyPermissionRecorded=true;
 }
 return output;
}

function publicPhoto(p,w,now){
 if(!p||p.rights!=='approved'||p.matchStatus!=='approved'||p.variantId!==w.id||p.reference!==w.reference||!localAsset(p.url)||!https(p.sourceUrl)||!https(p.licenseUrl)||!dated(p.checkedAt,now)||['id','alt','permission','holder','license','changes','matchEvidence'].some(key=>!text(p[key],10000))||!Number.isSafeInteger(p.width)||p.width<1||p.width>10000||!Number.isSafeInteger(p.height)||p.height<1||p.height>10000)return null;
 const photo=pick(p,photoFields);
 for(const key of ['thumbnail','originalUrl'])if(!localAsset(photo[key]))delete photo[key];
 return photo;
}

export function publicWatch(record,{production=true,now=Date.now()}={}){
 if(!record||record.status!=='published'||(production&&record.demo!==false)||!/^[a-z0-9][a-z0-9-]{2,100}$/.test(record.id||'')||!Array.isArray(record.sources)||!Array.isArray(record.prices))return null;
 const unique=record.sources.filter(s=>s&&record.sources.filter(other=>other?.id===s.id).length===1);
 const sources=unique.map(s=>publicSource(s,record.brand,production,now)).filter(Boolean),ids=new Set(sources.map(s=>s.id));
 if(identity.some(key=>!text(record[key])||!ids.has(record.evidence?.[key])))return null;
 const watch={...pick(record,['id',...identity,'configurationId']),demo:record.demo===true,status:'published',sources,evidence:{},prices:[],image:null,images:[]};
 for(const key of identity)watch.evidence[key]=record.evidence[key];
 for(const key of specs){const value=record[key],valid=key==='size'?typeof value==='number'&&value>=10&&value<=70:['powerReserve','waterResistance'].includes(key)?typeof value==='number'&&Number.isFinite(value)&&value>=0:text(value);watch[key]=ids.has(record.evidence?.[key])&&valid?value:null;if(watch[key]!==null)watch.evidence[key]=record.evidence[key];}
 for(const key of ['aliases','collections'])watch[key]=Array.isArray(record[key])?[...new Set(record[key].filter(value=>text(value,200)))].slice(0,key==='aliases'?30:10):[];
 const safeRecord={...record,prices:record.prices.filter(p=>p&&typeof p==='object'&&!Array.isArray(p)&&text(p.id)&&record.prices.filter(other=>other?.id===p.id).length===1)};
 const eligible=new Set([...publishedObservations(safeRecord,undefined,now),...archivedResearchObservations(safeRecord,undefined,now)]);
 watch.prices=record.prices.filter(p=>{
  if(!eligible.has(p)||!PRICE_TYPES.includes(p.type)||!['IN','AE','GLOBAL'].includes(p.country)||!['INR','AED','USD','EUR','GBP','CHF'].includes(p.currency)||!ids.has(p.sourceId)||['id','evidence','condition','boxPapers','sellerType','taxStatus'].some(key=>!text(p[key],10000)))return false;
  if(p.sourceProductReference&&p.sourceProductReference!==watch.reference)return false;
  if(p.configurationId&&p.configurationId!==watch.configurationId)return false;
  if(p.configurationMatch!==undefined&&(!p.configurationMatch||['reference','dial','bracelet','material','size'].some(key=>p.configurationMatch[key]!==watch[key])))return false;
  const source=sources.find(s=>s.id===p.sourceId);
  if(p.type==='official_retail'&&!['manufacturer','authorised_retailer'].includes(source.category))return false;
  if(p.type==='official_retail'&&source.category==='authorised_retailer'&&(!text(p.retailBasis)||p.sellerType!=='authorised_retailer'))return false;
  if(['dealer_asking','private_asking'].includes(p.type)&&!text(p.listingKey))return false;
  if(p.type==='verified_sale'&&!text(p.saleEvidence,10000))return false;
  if(p.type==='provider_estimate'&&(!text(p.provider)||!text(p.assumptions,10000)))return false;
  return true;
 }).map(publicPrice);
 const primary=publicPhoto(record.image,watch,now),gallery=Array.isArray(record.images)&&record.images.length?record.images.map(p=>publicPhoto(p,watch,now)).filter(Boolean):primary?[primary]:[];
 if(primary&&gallery.some(p=>p.id===primary.id&&p.url===primary.url)){watch.image=primary;watch.images=gallery;}
 if(!production&&watch.demo&&Array.isArray(record.retailCoverageReviews))watch.retailCoverageReviews=record.retailCoverageReviews.map(r=>{
  if(!r||!https(r.sourceUrl))return null;const review=pick(r,['variantId','reference','country','reviewedAt','sourceUrl','outcome','reason','offeredReference']);
  try{validateCoverageReview(r,watch,now);validateCoverageReview(review,watch,now);return review;}catch{return null;}
 }).filter(Boolean);
 return watch;
}

export function publicCatalogue(records,options){return records.map(record=>publicWatch(record,options)).filter(Boolean);}

export function publicPrices(w,params){
 if([...params.keys()].some(key=>!['market','type'].includes(key)||params.getAll(key).length!==1))return {status:400,body:{error:'Use one market and optional observation type.'}};
 const market=params.get('market')||'IN',type=params.get('type');
 if(!['IN','AE','GLOBAL'].includes(market)||(type!==null&&!PRICE_TYPES.includes(type)))return {status:400,body:{error:'Invalid price market or observation type.'}};
 const matches=p=>p.country===market&&(!type||p.type===type);
 const row=p=>{const source=w.sources.find(s=>s.id===p.sourceId),provenance=source?pick(source,['id','title','url','category','rights','permission','method','checkedAt']):null;if(provenance&&source.authorisation)provenance.authorisation=pick(source.authorisation,['url','title','evidence','checkedAt']);return {...publicPrice(p),source:provenance};};
 return {status:200,body:{variantId:w.id,market,currency:MARKET_CURRENCY[market]||null,observations:w.prices.filter(p=>p.status==='published'&&matches(p)).map(row),archivedResearch:w.prices.filter(p=>p.status==='archived_research'&&matches(p)).map(row)}};
}
