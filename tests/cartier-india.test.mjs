import {test} from 'node:test';
import assert from 'node:assert/strict';
import exclusive from '../docs/source-evidence/cartier-exclusive-retail-pass4.json' with {type:'json'};
import direct from '../docs/source-evidence/cartier-exclusive-direct-pass4.json' with {type:'json'};
import india from '../docs/source-evidence/cartier-india-pass4.json' with {type:'json'};
import {researchWatches} from '../lib/research-catalogue.mjs';
import {publishedObservations,reliableHistoryObservations,validateRecord} from '../lib/domain.mjs';
import {attachRetailResearch} from '../lib/retail-research.mjs';

test('India Cartier MRPs retain exact configurations, tax basis and original successful responses',()=>{
 assert.deepEqual(exclusive.observations.map(p=>[p.reference,p.amountMinor]),[['WSTA0040',59000000],['WSSA0086',49300000]]);
 for(const p of exclusive.observations){const w=researchWatches.find(w=>w.id===p.variantId),actual=publishedObservations(w,'IN').find(x=>x.id===p.id),response=direct.find(x=>x.url===p.sourceUrl);assert.ok(actual);assert.equal(actual.httpStatus,200);assert.equal(actual.responseSha256,response.sha256);assert.equal(actual.checkedAt,response.checkedAt);assert.equal(actual.currency,'INR');assert.equal(actual.amountMinor,Number(response.product.price)*100);assert.match(actual.taxStatus,/Inclusive of all taxes/);assert.match(actual.retailBasis,/Retailer-labelled MRP/);assert.equal(reliableHistoryObservations(w,'IN','official_retail').length,0);assert.doesNotThrow(()=>validateRecord(w,false));}
});

test('direct response evidence survives assembly and is required by protected record validation',()=>{
 const p=exclusive.observations[0],w={...researchWatches.find(w=>w.id===p.variantId),prices:[]};w.sources=w.sources.filter(s=>s.id!==p.id+'-source');const record=attachRetailResearch([w],[p],exclusive.reviewedSources)[0];assert.equal(record.prices[0].responseSha256,p.responseSha256);
 for(const change of [{responseSha256:''},{responseSha256:'not-a-checksum'},{httpStatus:429},{configurationId:undefined},{configurationMatch:undefined}]){const bad=structuredClone(record);Object.assign(bad.prices[0],change);assert.throws(()=>validateRecord(bad,false),/Direct source snapshot/);}
 const changed={...p,reference:'WSTA0041'};assert.throws(()=>attachRetailResearch([w],[changed],exclusive.reviewedSources),/configuration mismatch/);
});

test('the silver quartz Tank uses its own current SKU while mismatched listings stay unavailable',()=>{
 const w=researchWatches.find(w=>w.reference==='WSTA0041'),p=publishedObservations(w,'IN')[0],expected=india.observations.find(p=>p.reference==='WSTA0041'),source=w.sources.find(s=>s.id===p.sourceId);
 assert.equal(p.amountMinor,40400000);assert.equal(p.checkedAt,expected.checkedAt);assert.equal(p.responseSha256,expected.responseSha256);assert.match(source.authorisation.url,/stores.cartier.com\/search\?q=Mumbai/);assert.match(p.taxStatus,/Taxes included/);assert.equal(p.configurationId,w.configurationId);assert.doesNotThrow(()=>validateRecord(w,false));
 for(const ref of ['WSTA0056'])assert.equal(publishedObservations(researchWatches.find(w=>w.reference===ref),'IN').length,0);
 assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'IN')).length,19);assert.equal(researchWatches.flatMap(w=>publishedObservations(w,'AE')).length,24);
 assert.equal(india.unavailable.find(x=>x.attemptedReference==='WSTA0041').httpStatus,200);
 assert.equal(researchWatches.flatMap(w=>w.prices).filter(p=>p.sourceId.startsWith('cartier-wsta0040-silver-leather-retail-in-current-pass4')).length,0);
});
