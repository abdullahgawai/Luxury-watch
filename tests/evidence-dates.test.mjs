import {test} from 'node:test';import assert from 'node:assert/strict';
import {evidenceTimestamp,validEvidenceDate,validObservationDates} from '../lib/evidence-dates.mjs';
import {fresh,publishedObservations,askingRange,convertPrice,validateRecord} from '../lib/domain.mjs';
import {publicWatch} from '../lib/public-catalogue.mjs';import {historyFixture,historyNow as now} from './fixtures/history.mjs';
import {researchWatches} from '../lib/research-catalogue.mjs';
import {validateCoverageReview,coverageSnapshot} from '../lib/retail-reviews.mjs';
test('strict evidence dates preserve ISO dates, explicit offsets and original sub-millisecond source strings',()=>{
 for(const value of ['2024-02-29','2026-10-15','2026-10-15T09:24:18.4406753Z','2026-10-15T14:54:18.4406753+05:30','2026-10-15T13:24:18+04:00','2026-10-15T09:24Z']){assert.equal(evidenceTimestamp(value),Date.parse(value));assert.equal(typeof value,'string');}
 assert.equal(evidenceTimestamp('2026-10-15T09:24:18.4406753Z'),evidenceTimestamp('2026-10-15T14:54:18.4406753+05:30'));
});
test('unsupported-price coverage reviews retain truthful dates and exclude invalid dates from request snapshots',()=>{
 const watch=researchWatches[0],review={variantId:watch.id,reference:watch.reference,country:'AE',reviewedAt:'2026-10-15T00:00:00Z',sourceUrl:'https://example.invalid/date-test',outcome:'no_qualified_source',reason:'Synthetic date validation only.'};
 assert.equal(validateCoverageReview(review,watch,now),review);
 for(const reviewedAt of ['1','2026-02-30','2026-10-15T12:00:00']){const bad={...review,reviewedAt};assert.throws(()=>validateCoverageReview(bad,watch,now),/date/);assert.equal(coverageSnapshot([{...watch,retailCoverageReviews:[bad]}],now)[0].retailCoverageReviews.length,0);}
 assert.equal(coverageSnapshot([{...watch,retailCoverageReviews:[review]}],now)[0].retailCoverageReviews[0].reviewedAt,review.reviewedAt);
});
test('ambiguous, impossible, unzoned and non-string dates fail rather than normalizing',()=>{
 for(const value of [null,undefined,0,2026,new Date(),{},'1','10/11/2026','2026-2-03','2026-02-29','2024-02-30','2026-04-31','2026-00-01','2026-13-01','2026-10-00','2026-10-15T24:00:00Z','2026-10-15T12:60:00Z','2026-10-15T12:00:60Z','2026-10-15T12:00:00','2026-10-15 12:00:00Z','2026-10-15T12:00:00+24:00','2026-10-15T12:00:00+05:60','2026-10-15\n','2026-10-15T12:00:00Z\r\n'])assert.equal(evidenceTimestamp(value),null,String(value));
 assert.equal(validEvidenceDate('2999-01-01',now),false);assert.equal(validObservationDates('2026-10-16T10:00:00Z','2026-10-16T09:59:59Z',now),false);
 assert.equal(validObservationDates('2026-10-16T10:00:00+04:00','2026-10-16T11:30:00+05:30',now),true);
 assert.equal(validObservationDates('2026-10-15T09:24:18.4406753Z','2026-10-15T09:24:18.4406752Z',now),false);
 assert.equal(validObservationDates('2026-10-15T09:24:18.4406753Z','2026-10-15T14:54:18.4406753+05:30',now),true);
});
test('invalid or reversed evidence cannot become current prices, freshness or enough comparables',()=>{
 const w=historyFixture(),base={...w.prices[0],type:'dealer_asking',listingKey:'qa-0'};
 for(const change of [{observedAt:'2026-02-30'},{checkedAt:'1'},{checkedAt:undefined},{checkedAt:'2026-10-09T00:00:00Z'}]){const row={...base,...change};assert.equal(publishedObservations({...w,prices:[row]},'IN',now).length,0);assert.equal(fresh(row,now),false);}
 const rows=Array.from({length:5},(_,i)=>({...base,id:'qa-'+i,listingKey:'qa-'+i}));rows[4].checkedAt='2026-02-30';assert.equal(askingRange(rows,base,now).range,null);
 assert.throws(()=>convertPrice({amountMinor:100,currency:'USD',country:'GLOBAL'},{base:'USD',quote:'INR',rate:'1',source:'Synthetic QA',at:'2026-02-30'},now),/FX evidence/);
});
test('editorial import and public projection reject invalid source, price and licence dates without rewriting input',()=>{
 const record=historyFixture(),before=JSON.stringify(record);assert.equal(validateRecord(record),record);assert.ok(publicWatch(record,{now}));assert.equal(JSON.stringify(record),before);
 for(const checkedAt of ['1','2026-02-30','2026-10-15T10:00:00']){const bad={...record,sources:record.sources.map(s=>({...s,checkedAt}))};assert.throws(()=>validateRecord(bad),/date/);assert.equal(publicWatch(bad,{now}),null);}
 const badPrice={...record,prices:[{...record.prices[0],checkedAt:'2026-10-09T00:00:00Z'}]};assert.throws(()=>validateRecord(badPrice),/dates/);assert.equal(publicWatch(badPrice,{now}).prices.length,0);
 const photoRecord=structuredClone(researchWatches.find(w=>w.image));for(const checkedAt of [undefined,'1','2026-02-30']){const photo={...photoRecord.image,checkedAt},bad={...photoRecord,image:photo,images:[photo]};assert.throws(()=>validateRecord(bad,false),/date/);assert.equal(publicWatch(bad,{production:false,now}).image,null);}
});
