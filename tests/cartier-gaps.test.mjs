import {test} from 'node:test';
import assert from 'node:assert/strict';
import evidence from '../docs/source-evidence/cartier-gap-pass5.json' with {type:'json'};
import cached from '../docs/source-evidence/cartier-uae-archive-pass5.json' with {type:'json'};
import {researchWatches} from '../lib/research-catalogue.mjs';
import {publishedObservations,archivedResearchObservations,reliableHistoryObservations,searchWatches,validateRecord,fresh,premium} from '../lib/domain.mjs';

test('black Tank India retail uses the independently matching current source without replacing UAE evidence',()=>{
 const expected=evidence.observations[0],w=researchWatches.find(w=>w.reference==='WSTA0108'),p=publishedObservations(w,'IN')[0],source=w.sources.find(s=>s.id===p.sourceId);
 assert.equal(p.id,expected.id);assert.equal(p.amountMinor,42300000);assert.equal(p.currency,'INR');assert.equal(p.checkedAt,expected.checkedAt);assert.equal(p.responseSha256,expected.responseSha256);assert.equal(p.httpStatus,200);assert.match(p.taxStatus,/Inclusive of all taxes/);assert.match(source.url,/exclusivelinesindia.com\/p\/cartier-tank-WSTA0108$/);assert.match(source.authorisation.url,/stores.cartier.com/);assert.equal(publishedObservations(w,'AE')[0].amountMinor,1500000);assert.equal(archivedResearchObservations(w,'AE')[0].amountMinor,1460000);assert.doesNotThrow(()=>validateRecord(w,false));assert.throws(()=>validateRecord(w,true),/Demonstration/);assert.equal(w.image,null);
});

test('rate-limited UAE Tank XL keeps its cached amount outside current retail and history',()=>{
 const w=researchWatches.find(w=>w.reference==='WSTA0040'),p=archivedResearchObservations(w,'AE')[0];assert.equal(p.id,cached.observations[0].id);assert.equal(p.amountMinor,2080000);assert.equal(p.currency,'AED');assert.match(p.archivalReason,/HTTP 429/);assert.match(p.retrievalCacheAgeLabel,/2 days/);assert.equal(p.publisherEffectiveAt,null);assert.equal(publishedObservations(w,'AE').length,1);assert.ok(publishedObservations(w,'AE').every(x=>x.id!==p.id));assert.equal(reliableHistoryObservations(w,'AE','official_retail').length,0);assert.equal(searchWatches([{...w,prices:[p]}],{market:'AE',maxPrice:'999999'},[p]).length,0);assert.equal(fresh(p),false);assert.equal(premium({...p,type:'provider_estimate'},p),null);assert.equal(publishedObservations(w,'IN')[0].amountMinor,59000000);assert.doesNotThrow(()=>validateRecord(w,false));
});

test('remaining unsupported Cartier prices stay unavailable and archived coverage stays separate',()=>{
 const green=researchWatches.find(w=>w.reference==='WSTA0056'),silver=researchWatches.find(w=>w.reference==='WSTA0041');assert.equal(publishedObservations(green,'IN').length,0);assert.equal(publishedObservations(green,'AE').length,0);assert.equal(publishedObservations(silver,'AE').length,0);assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'IN')).length,19);assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'AE')).length,24);assert.equal(researchWatches.flatMap(w=>archivedResearchObservations(w,'AE')).length,3);
});
