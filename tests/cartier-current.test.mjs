import {test} from 'node:test';
import assert from 'node:assert/strict';
import evidence from '../docs/source-evidence/cartier-current-pass3.json' with {type:'json'};
import {researchWatches} from '../lib/research-catalogue.mjs';
import {attachRetailResearch} from '../lib/retail-research.mjs';
import {publishedObservations,archivedResearchObservations,reliableHistoryObservations,observationStatus,validateRecord} from '../lib/domain.mjs';

test('Cartier local amounts retain exact references, retailer authority and successful source dates',()=>{
 assert.deepEqual(evidence.observations.map(p=>[p.reference,p.country,p.amountMinor]),[['WSSA0029','AE',3090000],['WSTA0108','AE',1500000],['WSSA0086','AE',1750000],['WSSA0029','IN',87000000]]);
 for(const p of evidence.observations){const w=researchWatches.find(w=>w.id===p.variantId),actual=publishedObservations(w,p.country).find(x=>x.id===p.id),source=w.sources.find(s=>s.id===actual.sourceId);assert.equal(actual.checkedAt,p.checkedAt);assert.equal(actual.amountMinor,p.amountMinor);assert.equal(actual.retrievalMethod,p.retrievalMethod);assert.equal(source.authorisation.httpStatus,200);assert.equal(new URL(source.authorisation.url).hostname,'stores.cartier.com');assert.equal(source.rights,'pending');assert.equal(actual.publisherEffectiveAt,null);assert.equal(reliableHistoryObservations(w,p.country,'official_retail').length,0);assert.doesNotThrow(()=>validateRecord(w,false));assert.throws(()=>validateRecord(w,true),/Demonstration/);}
});

test('direct snapshots need evidence and cannot imply a live feed or a trend',()=>{
 const p=evidence.observations[0],w={...researchWatches.find(w=>w.id===p.variantId),prices:[]};
 for(const change of [{httpStatus:429},{responseSha256:''},{responseSha256:'invented'},{retrievalMethod:'live_verified'},{reviewDecision:'archived_research',archivalReason:'old'}])assert.throws(()=>attachRetailResearch([w],[{...p,...change}],evidence.reviewedSources));
 const actual=attachRetailResearch([w],[p],evidence.reviewedSources)[0].prices[0];assert.match(observationStatus(actual),/Direct source snapshot/);assert.match(observationStatus(actual),/price may change/);assert.match(observationStatus(actual,Date.parse(actual.checkedAt)+31*86400000),/needs source recheck/);
});

test('new Cartier retailer evidence does not refresh older manufacturer amounts or fill gaps',()=>{
 const black=researchWatches.find(w=>w.reference==='WSTA0108'),old=archivedResearchObservations(black,'AE')[0],current=publishedObservations(black,'AE')[0];assert.equal(old.amountMinor,1460000);assert.equal(current.amountMinor,1500000);assert.notEqual(old.sourceId,current.sourceId);assert.notEqual(old.checkedAt,current.checkedAt);
 for(const ref of ['WSTA0040','WSTA0041','WSTA0056']){const w=researchWatches.find(w=>w.reference===ref);assert.equal(publishedObservations(w,'IN').length,0);assert.equal(publishedObservations(w,'AE').length,0);}
 assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'IN')).length,15);assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'AE')).length,23);
});
