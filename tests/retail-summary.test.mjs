import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retailSummary,searchWatches} from '../lib/domain.mjs';
import {demoWatches} from '../lib/demo.mjs';
const now=Date.parse('2026-10-17T12:00:00Z');
const w=demoWatches[0];
const row=(id,extra={})=>({id,variantId:w.id,status:'published',type:'official_retail',amountMinor:100000,country:'IN',currency:'INR',condition:'New',boxPapers:'Full set',taxStatus:'Tax included',retailBasis:'Manufacturer retail',observedAt:'2026-10-16T12:00:00Z',checkedAt:'2026-10-16T13:00:00Z',...extra});
test('retail conflicts are independent of input order and preserve original evidence',()=>{
 const rows=[row('a'),row('b',{amountMinor:110000})],copy=structuredClone(rows);
 for(const prices of [rows,[...rows].reverse()]){
  const summary=retailSummary({...w,prices},'IN',now);
  assert.equal(summary.conflict,true);assert.equal(summary.observation,null);
  assert.deepEqual(summary.observations.map(p=>p.id),['a','b']);
 }
 assert.deepEqual(rows,copy);
});
test('identical latest amounts require comparable tax, condition and retail basis',()=>{
 for(const change of [{taxStatus:'Tax not stated'},{retailBasis:'Retailer web price'},{condition:'Used'},{boxPapers:'Not stated'}])assert.equal(retailSummary({...w,prices:[row('a'),row('b',change)]},'IN',now).conflict,true);
 const summary=retailSummary({...w,prices:[row('z',{sourceId:'second'}),row('a',{sourceId:'first'})]},'IN',now);
 assert.equal(summary.conflict,false);assert.equal(summary.observation.id,'a');assert.equal(summary.observations.length,2);
});
test('newest observation wins over older differences without using checked date as price date',()=>{
 const prices=[row('older',{amountMinor:90000,observedAt:'2026-10-15T12:00:00Z',checkedAt:'2026-10-17T11:00:00Z'}),row('latest')];
 assert.equal(retailSummary({...w,prices},'IN',now).observation.id,'latest');
 assert.equal(retailSummary({...w,prices:[]},'IN',now).observation,null);
});
test('equivalent timezone timestamps and sub-millisecond ties cannot silently select a conflicting price',()=>{
 for(const observedAt of ['2026-10-16T16:00:00+04:00','2026-10-16T12:00:00.0000001Z']){
  const summary=retailSummary({...w,prices:[row('a'),row('b',{amountMinor:110000,observedAt})]},'IN',now);
  assert.equal(summary.conflict,true);assert.equal(summary.observation,null);
 }
});
test('foreign, converted, removed, archived and invalid evidence cannot resolve a conflict',()=>{
 for(const extra of [{country:'AE',currency:'AED'},{converted:true},{removed:true},{excluded:true},{status:'archived_research'},{checkedAt:'invalid'},{amountMinor:0},{type:'dealer_asking'},{observedAt:'2027-01-01',checkedAt:'2027-01-01'}]){
  const summary=retailSummary({...w,prices:[row('valid'),row('invalid',{amountMinor:110000,...extra})]},'IN',now);
  assert.equal(summary.conflict,false);assert.equal(summary.observation.id,'valid');
 }
});
test('price filters exclude unresolved latest conflicts and sorting places them with unavailable prices',()=>{
 const second={...w,id:w.id+'-second'},prices=[row('a'),row('b',{amountMinor:110000}),row('c',{variantId:second.id,amountMinor:200000})];
 assert.deepEqual(searchWatches([w,second],{market:'IN',maxPrice:'5000'},prices).map(w=>w.id),[second.id]);
 assert.deepEqual(searchWatches([w,second],{market:'IN',sort:'price'},prices).map(w=>w.id),[second.id,w.id]);
});
