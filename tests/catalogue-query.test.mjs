import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {catalogueQuery,cataloguePage} from '../lib/catalogue-query.mjs';
import {publicCatalogue} from '../lib/public-catalogue.mjs';
import {researchWatches} from '../lib/research-catalogue.mjs';
import {searchWatches} from '../lib/domain.mjs';
const all=publicCatalogue(researchWatches,{production:false});
const parse=q=>catalogueQuery(new URLSearchParams(q));
test('catalogue query validates ambiguity, bounds, local scope and safe whole-unit budgets',()=>{
 assert.deepEqual(parse('').query,{market:'IN',page:1,pageSize:24});
 for(const q of ['unknown=x','market=US','market=GLOBAL','market=IN&market=AE','q=a&q=b','q=','q=%00','q='+ 'a'.repeat(201),'brand='+ 'a'.repeat(121),'page=0','page=-1','page=1.5','page=1e2','page=01','page=1001','pageSize=0','pageSize=51','pageSize=NaN','maxPrice=0','maxPrice=-1','maxPrice=20.5','maxPrice=Infinity','maxPrice=9007199254740991','size=9','size=71','size=25.555','sort=unknown','sort='])assert.equal(parse(q).status,400,q);
 const q=parse('q=+Tank+&market=AE&size=25.50&sort=relevance&page=2&pageSize=5&maxPrice=20000').query;
 assert.equal(q.q,'Tank');assert.equal(q.size,'25.5');assert.equal(q.sort,'');assert.equal(q.page,2);assert.equal(q.pageSize,5);
 assert.equal(catalogueQuery(new URLSearchParams('market=IN'),{detail:true}).status,200);
 assert.equal(catalogueQuery(new URLSearchParams('q=Tank'),{detail:true}).status,400);
});
test('catalogue pagination reaches every configuration once and does not mutate source evidence',()=>{
 const before=JSON.stringify(all),ids=[];
 for(let page=1;page<=8;page++){const result=cataloguePage(all,parse('pageSize=5&page='+page).query);ids.push(...result.data.map(w=>w.id));assert.equal(result.pagination.total,39);assert.equal(result.pagination.totalPages,8);assert.equal(result.pagination.hasNext,page<8);assert.equal(result.pagination.previousPage,page>1?page-1:null);assert.ok(result.data.length<=5);}
 assert.equal(new Set(ids).size,39);assert.deepEqual(ids,searchWatches(all).map(w=>w.id));assert.equal(JSON.stringify(all),before);
 const empty=cataloguePage(all,parse('page=1000').query);assert.equal(empty.data.length,0);assert.equal(empty.pagination.nextPage,null);assert.equal(empty.pagination.previousPage,2);
 const noMatch=cataloguePage(all,parse('q=unknown-unmatched-watch').query);assert.equal(noMatch.pagination.totalPages,0);assert.equal(noMatch.pagination.previousPage,null);
});
test('API pagination can pass the UI 100-result bound without dropping configurations',()=>{
 const larger=Array.from({length:151},(_,i)=>({...all[0],id:'pagination-qa-'+i}));
 assert.equal(searchWatches(larger).length,100);
 const page=cataloguePage(larger,parse('page=3&pageSize=50').query);assert.equal(page.pagination.total,151);assert.equal(page.data.length,50);assert.equal(page.data[0].id,'pagination-qa-100');assert.equal(page.pagination.nextPage,4);
 assert.equal(cataloguePage(larger,parse('page=4&pageSize=50').query).data.length,1);
});
test('paged price filters retain exact local observations, missing states, dates and source fields',()=>{
 const ae=cataloguePage(all,parse('brand=Cartier&market=AE&maxPrice=20000&sort=price').query);
 assert.deepEqual(ae.data.map(w=>w.reference),['WSTA0108','WSSA0086']);assert.equal(ae.pagination.currency,'AED');
 assert.equal(cataloguePage(all,parse('q=WSTA0041&market=AE&maxPrice=9999999').query).data.length,0);
 const gap=cataloguePage(all,parse('q=WSTA-0041&market=AE').query).data[0];assert.equal(gap.image,null);assert.ok(gap.retailCoverageReviews.some(r=>r.country==='AE'&&r.reviewedAt));
 const india=cataloguePage(all,parse('q=WSTA0041&market=IN&maxPrice=500000').query);assert.equal(india.data.length,1);assert.equal(india.pagination.currency,'INR');assert.ok(india.data[0].prices.some(p=>p.country==='IN'&&p.amountMinor===40400000&&p.checkedAt.startsWith('2026-10-15')));
});
test('actual API rejects invalid list queries before database reads and protects every response from caching',async()=>{
 let reads=0,fail=false;
 globalThis.catalogueQueryEnv={DATA_MODE:'production',DB:{prepare(sql){assert.match(sql,/ORDER BY brand,reference,id LIMIT 1000/);reads++;if(fail)throw new Error('PRIVATE_DATABASE_SENTINEL');return {async all(){return {results:[]};}};}}};
 const bundled=await build({entryPoints:['app/api/[...path]/route.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'query-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const env=globalThis.catalogueQueryEnv',loader:'js'}));}}]});
 const {GET}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 const call=(path,query='')=>GET(new Request('https://test.invalid/api/'+path.join('/')+'?'+query),{params:Promise.resolve({path})});
 try{
  for(const q of ['pageSize=51','market=IN&market=AE','q=Tank&q=Speedy','privateToken=PRIVATE_QUERY_SENTINEL']){const r=await call(['watches'],q);assert.equal(r.status,400);assert.equal(r.headers.get('cache-control'),'no-store');assert.ok(!(await r.text()).includes('PRIVATE_QUERY_SENTINEL'));}
  assert.equal(reads,0);assert.equal((await call(['unknown'])).status,404);assert.equal(reads,0);
  let response=await call(['watches']);assert.equal(response.status,200);assert.equal(response.headers.get('x-robots-tag'),'noindex');assert.deepEqual((await response.json()).pagination,{page:1,pageSize:24,total:0,totalPages:0,hasPrevious:false,hasNext:false,previousPage:null,nextPage:null,market:'IN',currency:'INR'});
  response=await call(['watches','unknown']);assert.equal(response.status,404);assert.equal(response.headers.get('cache-control'),'no-store');
  fail=true;response=await call(['watches']);assert.equal(response.status,503);assert.equal(response.headers.get('cache-control'),'no-store');assert.ok(!(await response.text()).includes('PRIVATE_DATABASE_SENTINEL'));
 }finally{delete globalThis.catalogueQueryEnv;}
});
