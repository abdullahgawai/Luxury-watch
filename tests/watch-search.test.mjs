import {test} from 'node:test';
import assert from 'node:assert/strict';
import {researchWatches} from '../lib/research-catalogue.mjs';
import {rankedMatches,searchSuggestions} from '../lib/watch-search.mjs';
import {searchWatches} from '../lib/domain.mjs';

test('punctuation-free references identify only existing exact configurations and outrank incidental text',()=>{
 const moon=researchWatches.find(w=>w.reference==='311.30.42.30.01.005');
 const decoy={...moon,id:'test-only-decoy',reference:'OTHER',model:'31130423001005 comparison',aliases:[]};
 for(const q of ['31130423001005','311.30.42.30.01.005','311 30 42 30 01 005',' ３１１３０４２３００１００５ '])assert.equal(rankedMatches([decoy,...researchWatches],q)[0].id,moon.id);
 assert.deepEqual(searchWatches(researchWatches,{q:'cartier wsta0041'}).map(w=>w.reference),['WSTA0041']);
 assert.deepEqual(searchWatches(researchWatches,{q:'WSTA-0041'}).map(w=>w.reference),['WSTA0041']);
});

test('curated nicknames remain search aids and never synthesize an unknown watch',()=>{
 assert.ok(searchSuggestions(researchWatches,'SPEEDY').every(w=>w.aliases.some(alias=>alias.toLowerCase().includes('speedy'))));
 assert.ok(searchSuggestions(researchWatches,'SPEEDY').length>0);
 for(const q of ['nonexistent unicorn reference','---','...',''])assert.equal(searchSuggestions(researchWatches,q).length,0,q);
 assert.equal(searchSuggestions([], 'Cartier').length,0);
});

test('suggestions are bounded, stable, deduplicated and preserve exact variant objects without modifying data',()=>{
 const before=JSON.stringify(researchWatches),input=[...researchWatches,...researchWatches],all=rankedMatches(input,'rolex'),suggestions=searchSuggestions(input,'rolex');
 assert.equal(suggestions.length,6);assert.equal(new Set(suggestions.map(w=>w.id)).size,6);
 assert.deepEqual(suggestions.map(w=>w.id),[...new Set(all.map(w=>w.id))].slice(0,6));
 for(const w of suggestions)assert.ok(researchWatches.includes(w));
 const variants=searchSuggestions(researchWatches,'126000');
 assert.equal(variants.length,2);assert.notEqual(variants[0].dial,variants[1].dial);
 assert.equal(JSON.stringify(researchWatches),before);
});

test('reference normalization retains filter eligibility and never fills absent local prices',()=>{
 const allPrices=researchWatches.flatMap(w=>w.prices),q='WSTA-0041';
 assert.equal(searchWatches(researchWatches,{q,brand:'Omega'},allPrices).length,0);
 assert.equal(searchWatches(researchWatches,{q,market:'AE',maxPrice:'999999999'},allPrices).length,0);
 const india=searchWatches(researchWatches,{q,market:'IN',maxPrice:'999999999'},allPrices);
 assert.equal(india.length,1);assert.equal(india[0].reference,'WSTA0041');
});
