import {test} from 'node:test';
import assert from 'node:assert/strict';
import {askingRange} from '../lib/domain.mjs';
const now=Date.parse('2026-10-17T12:00:00Z');
const match={variantId:'qa-watch',country:'AE',currency:'AED',condition:'Excellent',boxPapers:'Full set',sellerType:'dealer',type:'dealer_asking'};
const row=(i,extra={})=>({...match,id:'qa-'+i,listingKey:'qa-listing-'+i,status:'published',amountMinor:(100+i)*100,taxStatus:'Not stated',observedAt:'2026-10-15T12:00:00Z',checkedAt:'2026-10-16T12:00:00Z',...extra});
const rows=()=>Array.from({length:5},(_,i)=>row(i));
test('latest eligible comparable wins duplicate selection independent of array order',()=>{
 const prices=[...rows(),row(0,{id:'qa-new',amountMinor:15000,observedAt:'2026-10-16T12:00:00Z'})],copy=structuredClone(prices);
 const a=askingRange(prices,match,now),b=askingRange([...prices].reverse(),match,now);
 assert.deepEqual(a,b);assert.equal(a.count,5);assert.equal(a.duplicateObservations,1);assert.ok(a.observations.some(p=>p.id==='qa-new'));assert.deepEqual(a.window,{from:'2026-10-15T12:00:00Z',to:'2026-10-16T12:00:00Z'});assert.deepEqual(prices,copy);
});
test('conflicting duplicate evidence is withheld and cannot fill the five-offer threshold',()=>{
 for(const change of [{amountMinor:20000},{taxStatus:'Tax included'}]){
  const result=askingRange([...rows(),row(0,{id:'qa-conflict',...change})],match,now);
  assert.equal(result.range,null);assert.equal(result.count,4);assert.equal(result.conflictingListings,1);assert.equal(result.duplicateObservations,1);
 }
});
test('outliers are flagged without silently removing them from quartiles or counts',()=>{
 const result=askingRange([...rows(),row(5,{amountMinor:999999})],match,now);
 assert.equal(result.count,6);assert.deepEqual(result.reviewOutliers,['qa-5']);assert.ok(result.observations.some(p=>p.id==='qa-5'));assert.ok(result.range);
});
test('converted, foreign-currency and global offers never establish a local range',()=>{
 for(const extra of [{converted:true},{currency:'USD'},{country:'GLOBAL'}])assert.equal(askingRange([...rows().slice(0,4),row(4,extra)],match,now).range,null);
 assert.equal(askingRange(rows().map(p=>({...p,country:'GLOBAL'})),{...match,country:'GLOBAL'},now).count,0);
 assert.deepEqual(askingRange([],match,now).window,null);
});
