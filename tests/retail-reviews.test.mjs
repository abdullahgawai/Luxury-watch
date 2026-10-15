import {test} from 'node:test';
import assert from 'node:assert/strict';
import reviews from '../docs/source-evidence/cartier-two-gaps-pass8.json' with {type:'json'};
import current from '../docs/source-evidence/cartier-uae-pass7.json' with {type:'json'};
import {researchWatches} from '../lib/research-catalogue.mjs';
import {attachCoverageReviews,validateCoverageReview,coverageSnapshot} from '../lib/retail-reviews.mjs';
import {attachRetailResearch} from '../lib/retail-research.mjs';
import {publishedObservations,reliableHistoryObservations,validateRecord,searchWatches} from '../lib/domain.mjs';

test('different priced references remain dated coverage reviews, never UAE prices or photo approvals',()=>{
 assert.equal(reviews.observations.length,0);assert.deepEqual(reviews.gapReviews.map(r=>[r.reference,r.offeredReference]),[['WSTA0041','WSTA0109'],['WSTA0056','WSTA0115']]);
 for(const r of reviews.gapReviews){const w=researchWatches.find(w=>w.id===r.variantId);assert.equal(w.retailCoverageReviews.length,1);assert.equal(w.retailCoverageReviews[0].reviewedAt,r.reviewedAt);assert.equal(publishedObservations(w,'AE').length,0);assert.equal(reliableHistoryObservations(w,'AE','official_retail').length,0);assert.equal(searchWatches([w],{market:'AE',maxPrice:'9999999'},w.prices).length,0);assert.ok(!('amountMinor' in r));assert.doesNotThrow(()=>validateRecord(w,false));}
 assert.equal(researchWatches.find(w=>w.reference==='WSTA0041').image,null);assert.match(researchWatches.find(w=>w.reference==='WSTA0056').image.configurationNote,/does not state the full commercial reference/);
});

test('coverage checks reject price fields, wrong configurations, future dates and production promotion',()=>{
 const r=reviews.gapReviews[0],w=researchWatches.find(w=>w.id===r.variantId),base={...w,retailCoverageReviews:undefined};
 for(const change of [{reference:'WSTA0109'},{variantId:'other'},{country:'GLOBAL'},{reviewedAt:'2999-01-01'},{sourceUrl:'http://example.com'},{offeredReference:w.reference},{amountMinor:100},{checkedAt:r.reviewedAt},{currency:'AED'}])assert.throws(()=>validateCoverageReview({...r,...change},w));
 const attached=attachCoverageReviews([base],[r])[0];assert.deepEqual(attached.prices,base.prices);assert.deepEqual(attached.sources,base.sources);assert.equal(base.retailCoverageReviews,undefined);assert.throws(()=>attachCoverageReviews([{...base,demo:false}],[r]),/isolated/);assert.throws(()=>validateRecord({...attached,demo:false},true),/coverage reviews cannot enter production/);
});

test('known priced source SKU mismatches block research assembly and protected record validation',()=>{
 const p=current.observations[0],original=researchWatches.find(w=>w.id===p.variantId),w={...original,prices:[],sources:original.sources.filter(s=>s.id!==p.id+'-source')};assert.throws(()=>attachRetailResearch([w],[{...p,sourceProductReference:'WSTA0109'}],current.reviewedSources),/Priced source reference mismatch/);
 const good=attachRetailResearch([w],[{...p,sourceProductReference:w.reference}],current.reviewedSources)[0];assert.equal(good.prices[0].sourceProductReference,w.reference);assert.doesNotThrow(()=>validateRecord(good,false));good.prices[0].sourceProductReference='WSTA0109';assert.throws(()=>validateRecord(good,false),/Priced source reference mismatch/);
});

test('Worker startup needs no wall clock and request snapshots still hide future reviews',async()=>{
 const originalNow=Date.now;let startup;
 try{Date.now=()=>0;startup=await import('../lib/research-catalogue.mjs?zero-clock-startup');assert.equal(startup.researchWatches.length,researchWatches.length);}finally{Date.now=originalNow;}
 const r=reviews.gapReviews[0],w=startup.researchWatches.find(w=>w.id===r.variantId),before=Date.parse(r.reviewedAt)-1,after=Date.parse(r.reviewedAt)+1;
 assert.equal(coverageSnapshot([w],0)[0].retailCoverageReviews.length,0);assert.equal(coverageSnapshot([w],before)[0].retailCoverageReviews.length,0);assert.equal(coverageSnapshot([w],after)[0].retailCoverageReviews.length,1);assert.equal(w.retailCoverageReviews.length,1);
 assert.throws(()=>validateCoverageReview({...r,reviewedAt:'2999-01-01'},w),/review date/);
});
