import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {catalogueResults,catalogueHref} from '../lib/catalogue-results.mjs';
import {publicCatalogue} from '../lib/public-catalogue.mjs';
import {researchWatches} from '../lib/research-catalogue.mjs';
const all=publicCatalogue(researchWatches,{production:false});
test('customer catalogue pages cover every loaded configuration without duplication or data mutation',()=>{
 const original=JSON.stringify(all),ids=[];
 for(let page=1;page<=4;page++){const r=catalogueResults(all,{market:'AE'},page);assert.equal(r.total,39);assert.equal(r.totalPages,4);assert.equal(r.from,(page-1)*12+1);assert.equal(r.to,Math.min(page*12,39));assert.ok(r.rows.length<=12);ids.push(...r.rows.map(w=>w.id));}
 assert.equal(ids.length,39);assert.equal(new Set(ids).size,39);assert.equal(JSON.stringify(all),original);
 const larger=Array.from({length:151},(_,i)=>({...all[0],id:'page-fixture-'+i}));assert.equal(catalogueResults(larger,{},13).rows.length,7);assert.equal(catalogueResults(larger,{},13).rows[6].id,'page-fixture-150');
});
test('customer pagination handles invalid pages, empty results and reduced filter matches',()=>{
 for(const value of ['0','-1','1e2','NaN','1.5','01','9007199254740992'])assert.equal(catalogueResults(all,{},value).page,1);
 assert.equal(catalogueResults(all,{},999).page,4);
 const filtered=catalogueResults(all,{q:'WSTA0041',market:'AE'},4);assert.equal(filtered.page,1);assert.equal(filtered.total,1);assert.equal(filtered.rows[0].image,null);
 const empty=catalogueResults(all,{q:'unknown-unmatched-reference'},2);assert.deepEqual([empty.total,empty.page,empty.totalPages,empty.from,empty.to],[0,1,0,0,0]);
 assert.equal(catalogueResults(all,{q:'WSTA0041',market:'AE',maxPrice:'500000'},1).total,0);
 assert.equal(catalogueResults(all,{q:'WSTA0041',market:'IN',maxPrice:'500000'},1).total,1);
});
test('page links retain safe search/filter/currency state and fixed brand scope',()=>{
 const q={q:'Tank & green',brand:'Cartier',sort:'price',market:'AE',maxPrice:'20000',size:'25.5',privateField:'not-public'};
 const href=catalogueHref('/watches',q,2),u=new URL(href,'https://test.invalid');assert.equal(u.searchParams.get('q'),q.q);assert.equal(u.searchParams.get('market'),'AE');assert.equal(u.searchParams.get('page'),'2');assert.equal(u.searchParams.get('privateField'),null);assert.ok(!catalogueHref('/watches',q,1).includes('page='));
 const brand=new URL(catalogueHref('/brands/cartier',q,2),'https://test.invalid');assert.equal(brand.pathname,'/brands/cartier');assert.equal(brand.searchParams.get('brand'),null);assert.equal(brand.searchParams.get('sort'),'price');
});
test('actual server-rendered catalogue includes 12 cards and accessible native page links before hydration',async()=>{
 const bundle=await build({entryPoints:['app/catalogue.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react/jsx-dev-runtime']});const mod={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
 const render=initialQuery=>renderToStaticMarkup(createElement(mod.exports.default,{watches:all,market:'AE',page:'/watches',initialQuery,card:w=>createElement('article',{key:w.id,'data-variant':w.id},w.reference)}));
 const html=render({page:'2',market:'AE'});assert.equal((html.match(/data-variant=/g)||[]).length,12);assert.match(html,/Showing 13–24/);assert.match(html,/aria-label="Catalogue result pages"/);assert.match(html,/rel="prev"/);assert.match(html,/rel="next"/);assert.match(html,/page=3#catalogue-results/);
 const first=render({market:'AE'});assert.ok(!first.includes('rel="prev"'));assert.match(first,/page=2#catalogue-results/);
 const last=render({page:'4',market:'AE'});assert.equal((last.match(/data-variant=/g)||[]).length,3);assert.ok(!last.includes('rel="next"'));
});
