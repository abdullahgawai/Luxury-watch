import {test} from 'node:test';
import assert from 'node:assert/strict';
import evidence from '../docs/source-evidence/retail-gap-expansion.json' with {type:'json'};
import direct from '../docs/source-evidence/tudor-uae-direct-pass2.json' with {type:'json'};
import {researchWatches} from '../lib/research-catalogue.mjs';
import {attachRetailResearch} from '../lib/retail-research.mjs';
import {publishedObservations,archivedResearchObservations,reliableHistoryObservations,fresh,premium,searchWatches,validateRecord} from '../lib/domain.mjs';

test('seven exact local retail additions retain original amounts and successful retrieval dates',()=>{
 assert.equal(evidence.observations.length,9);
 const current=evidence.observations.filter(p=>!p.reviewDecision);
 assert.equal(current.length,7);
 assert.deepEqual(current.map(p=>[p.reference,p.amountMinor]),[['M79470-0001',1822000],['M79830RB-0001',1892000],['M25600TN-0001',2160000],['M79950-0001',1442000],['M7941A1A0RU-0001',1912000],['M79000N-0001',1692000],['210.30.42.20.01.001',69030000]]);
 for(const p of current){const w=researchWatches.find(w=>w.id===p.variantId),actual=publishedObservations(w,p.country).find(x=>x.id===p.id);assert.ok(actual);assert.equal(actual.checkedAt,p.checkedAt);assert.equal(actual.amountMinor,p.amountMinor);assert.equal(actual.configurationId,w.configurationId);assert.ok(w.sources.find(s=>s.id===actual.sourceId).authorisation.evidence);assert.doesNotThrow(()=>validateRecord(w,false));if(w.brand==='Tudor'){const r=direct.find(r=>r.url===p.sourceUrl),offer=r.structured[0].offers[0];assert.equal(r.status,200);assert.equal(r.sku,w.reference);assert.equal(offer.priceCurrency,'AED');assert.equal(Number(offer.price)*100,p.amountMinor);}}
 assert.equal(researchWatches.filter(w=>w.brand!=='Cartier').flatMap(w=>publishedObservations(w,'IN')).length,14);
 assert.equal(researchWatches.filter(w=>w.brand!=='Cartier').flatMap(w=>publishedObservations(w,'AE')).length,20);
});

test('older Cartier source amounts never become current retail, price-filter matches or trend points',()=>{
 for(const reference of ['WSTA0108','WSSA0086']){const w=researchWatches.find(w=>w.reference===reference),old=archivedResearchObservations(w,'AE');assert.equal(old.length,1);assert.equal(old[0].status,'archived_research');assert.ok(old[0].archivalReason);assert.equal(fresh(old[0]),false);assert.ok(publishedObservations(w,'AE').every(p=>p.id!==old[0].id));assert.equal(reliableHistoryObservations(w,'AE','official_retail').length,0);assert.equal(searchWatches([{...w,prices:old}],{market:'AE',maxPrice:'999999'},old).length,0);assert.equal(premium({...old[0],type:'provider_estimate'},old[0]),null);assert.equal(w.image,null);assert.equal(w.calibre,null);assert.doesNotThrow(()=>validateRecord(w,false));assert.throws(()=>validateRecord(w,true),/Demonstration/);}
 assert.equal(archivedResearchObservations(researchWatches.find(w=>w.reference==='WSTA0108'),'AE')[0].amountMinor,1460000);
 assert.equal(archivedResearchObservations(researchWatches.find(w=>w.reference==='WSSA0086'),'AE')[0].amountMinor,1750000);
 assert.equal(reliableHistoryObservations(researchWatches.find(w=>w.reference==='WSTA0040'),'AE','official_retail').length,0);
});

test('archived evidence has the same currency, variant, removal and date protections',()=>{
 const w=researchWatches.find(w=>w.reference==='WSTA0108'),p=w.prices[0];
 for(const change of [{variantId:'other'},{type:'verified_sale'},{currency:'USD'},{removed:true},{excluded:true},{converted:true},{checkedAt:'invalid'},{observedAt:'2999-01-01'},{archivalReason:''},{status:'draft'}])assert.equal(archivedResearchObservations({...w,prices:[{...p,...change}]},'AE').length,0);
 assert.equal(archivedResearchObservations(w,'IN').length,0);
 const record=structuredClone(w);record.prices[0].archivalReason='';assert.throws(()=>validateRecord(record,false),/Archived research/);
 const obs=evidence.observations.find(p=>p.reviewDecision),clean={...w,prices:[]};assert.throws(()=>attachRetailResearch([clean],[{...obs,archivalReason:''}],evidence.reviewedSources),/Archival reason/);
});

test('nearby Tudor colours and straps cannot inherit a sourced local amount',()=>{
 const black=researchWatches.find(w=>w.reference==='M79000N-0001'),p=evidence.observations.find(p=>p.reference===black.reference),w={...black,prices:[]};
 for(const change of [{reference:'M79000B-0001'},{bracelet:'Black rubber strap'},{dial:'Blue, domed'},{sourceUrl:p.sourceUrl.replace('black-bay-54-4','black-bay-54-5')}])assert.throws(()=>attachRetailResearch([w],[{...p,...change}],evidence.reviewedSources));
 assert.equal(researchWatches.find(w=>w.reference==='M25707B-0001').prices.length,0);
 const pro={...researchWatches.find(w=>w.reference==='M79470-0001'),prices:[]};
 const reassigned={...p,variantId:pro.id,...Object.fromEntries(['reference','configurationId','dial','bracelet','material','size'].map(k=>[k,pro[k]]))};
 assert.throws(()=>attachRetailResearch([pro],[reassigned],evidence.reviewedSources),/Regional reviewed source/);
 assert.throws(()=>attachRetailResearch([w],[{...p,reviewDecision:'unreviewed'}],evidence.reviewedSources),/review decision/);
});
