import {reliableHistoryObservations,PRICE_TYPES} from './domain.mjs';

export function historySeries(w,country,type,now=Date.now()){
 const groups=new Map();
 for(const p of reliableHistoryObservations(w,country,type,now)){
  const source=w.sources.find(s=>s.id===p.sourceId);
  const basis={currency:p.currency,condition:p.condition,boxPapers:p.boxPapers,sellerType:p.sellerType,taxStatus:p.taxStatus,sourceId:p.sourceId,retailBasis:type==='official_retail'?p.retailBasis:'',feeBasis:type==='verified_sale'?p.feeBasis:'',provider:type==='provider_estimate'?p.provider:'',assumptions:type==='provider_estimate'?p.assumptions:'',offer:['dealer_asking','private_asking','dealer_purchase'].includes(type)?p.listingKey:''};
  const id=JSON.stringify([country,type,...Object.values(basis)]);
  if(!groups.has(id))groups.set(id,{id,country,type,basis,source:{id:source.id,title:source.title,url:source.url,checkedAt:source.checkedAt},rows:[],duplicates:0,conflicts:0});
  groups.get(id).rows.push(p);
 }
 return [...groups.values()].map(group=>{
  const points=new Map();
  for(const p of group.rows){const at=Date.parse(p.observedAt);if(!points.has(at))points.set(at,[]);points.get(at).push(p);}
  const rows=[];
  for(const observations of points.values()){
   if(new Set(observations.map(p=>p.amountMinor)).size>1){group.conflicts++;continue;}
   group.duplicates+=observations.length-1;
   // A repeat retrieval cannot become an additional historical point.
   rows.push([...observations].sort((a,b)=>Date.parse(b.checkedAt)-Date.parse(a.checkedAt)||String(a.id).localeCompare(String(b.id)))[0]);
  }
  rows.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)||String(a.id).localeCompare(String(b.id)));
  return {...group,rows,available:rows.length>=2};
 }).sort((a,b)=>a.id.localeCompare(b.id));
}

export function historyResponse(w,params,now=Date.now()){
 const allowed=['market','type','series'];
 if([...params.keys()].some(key=>!allowed.includes(key)||params.getAll(key).length!==1))return {status:400,body:{error:'Use one market, type and optional series parameter.'}};
 const market=params.get('market')||'IN',type=params.get('type')||'official_retail',selected=params.get('series');
 if(!['IN','AE','GLOBAL'].includes(market)||!PRICE_TYPES.includes(type)||(selected!==null&&(!selected||selected.length>20000)))return {status:400,body:{error:'Invalid history market, observation type or series.'}};
 const groups=historySeries(w,market,type,now),chosen=selected?groups.find(g=>g.id===selected):groups.find(g=>g.available)||groups[0];
 if(selected&&!chosen)return {status:404,body:{error:'Comparable history series not found.'}};
 const series=groups.map(({rows,...g})=>({...g,observationCount:rows.length}));
 const observations=chosen?.available?chosen.rows.map(p=>({id:p.id,amountMinor:p.amountMinor,currency:p.currency,country:p.country,type:p.type,observedAt:p.observedAt,checkedAt:p.checkedAt,evidence:p.evidence,...(p.type==='verified_sale'?{saleEvidence:p.saleEvidence}:{}),source:chosen.source})):[];
 return {status:200,body:{variantId:w.id,market,type,status:chosen?.available?'available':'unavailable',series,selectedSeries:chosen?.id||null,observations,message:chosen?.available?'Actual observations only; no interpolation or inferred sales.':'At least two distinct, comparable, explicitly approved observations with source history permission are required. Research snapshots and demonstration records do not create history.'}};
}

export function historyDate(value){return new Date(value).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Kolkata',hour12:false})+' IST';}
export function historyMoney(minor,currency){return new Intl.NumberFormat(currency==='INR'?'en-IN':'en-AE',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(minor/100);}
