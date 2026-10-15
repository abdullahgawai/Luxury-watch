import {test} from 'node:test';
import assert from 'node:assert/strict';
import evidence from '../docs/source-evidence/cartier-uae-pass7.json' with {type:'json'};
import {researchWatches} from '../lib/research-catalogue.mjs';
import {publishedObservations,archivedResearchObservations,reliableHistoryObservations,validateRecord,searchWatches} from '../lib/domain.mjs';

test('Tank XL UAE current retail has its own successful original AED check and exact binding',()=>{
 const expected=evidence.observations[0],w=researchWatches.find(w=>w.reference==='WSTA0040'),p=publishedObservations(w,'AE')[0],source=w.sources.find(s=>s.id===p.sourceId);
 assert.equal(p.id,expected.id);assert.equal(p.amountMinor,2080000);assert.equal(p.currency,'AED');assert.equal(p.httpStatus,200);assert.equal(p.responseSha256,expected.responseSha256);assert.equal(p.checkedAt,'2026-10-15T18:52:45Z');assert.equal(p.observedAt,p.checkedAt);assert.equal(p.configurationId,w.configurationId);assert.deepEqual(p.configurationMatch,Object.fromEntries(['reference','dial','bracelet','material','size'].map(k=>[k,w[k]])));assert.match(p.taxStatus,/Taxes included/);assert.match(p.retailBasis,/catalogue\/list price/);assert.equal(source.authorisation.checkedAt,'2026-10-15T09:04:38Z');assert.equal(source.rights,'pending');assert.doesNotThrow(()=>validateRecord(w,false));assert.throws(()=>validateRecord(w,true),/Demonstration/);assert.equal(searchWatches([w],{market:'AE',maxPrice:'20800'},w.prices).length,1);
});

test('successful new observation does not refresh the old cache or imply a price trend',()=>{
 const w=researchWatches.find(w=>w.reference==='WSTA0040'),current=publishedObservations(w,'AE')[0],old=archivedResearchObservations(w,'AE')[0];assert.equal(old.amountMinor,2080000);assert.equal(old.checkedAt,'2026-10-15T09:35:30Z');assert.equal(old.status,'archived_research');assert.notEqual(old.sourceId,current.sourceId);assert.notEqual(old.id,current.id);assert.equal(current.publisherEffectiveAt,null);assert.equal(reliableHistoryObservations(w,'AE','official_retail').length,0);assert.equal(publishedObservations(w,'IN')[0].amountMinor,59000000);
 for(const ref of ['WSTA0041','WSTA0056'])assert.equal(publishedObservations(researchWatches.find(w=>w.reference===ref),'AE').length,0);
 assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'AE')).length,24);assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'IN')).length,19);
});
