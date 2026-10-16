import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {historyFixture,historyNow as now} from './fixtures/history.mjs';
import {researchWatches} from '../lib/research-catalogue.mjs';
import {publicWatch,publicCatalogue,publicPrices} from '../lib/public-catalogue.mjs';
import {historySeries} from '../lib/history.mjs';
import {validateRecord,searchWatches} from '../lib/domain.mjs';
const marker='PRIVATE_QA_MARKER_DO_NOT_SERIALIZE';
function privateFixture(){const w=historyFixture();w.internalNotes=marker;w.acquisitionCost=marker;w.sources[0].historyPermission=marker;w.sources[0].internalContact=marker;w.evidence.internalNotes=marker;w.prices[0].supplierContact=marker;w.prices[0].configurationMatch={reference:w.reference,dial:w.dial,bracelet:w.bracelet,material:w.material,size:w.size,internalNote:marker};return w;}

test('public watch fields are explicit, nested private metadata is absent and stored input is unchanged',()=>{
 const w=privateFixture(),before=JSON.stringify(w),p=publicWatch(w,{now});assert.ok(p);assert.ok(!JSON.stringify(p).includes(marker));assert.equal(JSON.stringify(w),before);assert.equal(p.prices.length,3);assert.equal(p.sources[0].historyPermission,undefined);assert.equal(p.sources[0].historyPermissionRecorded,true);assert.equal(historySeries(p,'IN','official_retail',now)[0].rows.length,3);
 const bad={...w,sources:w.sources.map(s=>({...s,historyPermission:undefined,historyPermissionRecorded:true}))};assert.equal(publicWatch(bad,{now}).sources[0].historyPermissionRecorded,undefined);assert.throws(()=>validateRecord(bad),/history permission/i);
});

test('draft, removed, excluded, converted, mismatched, malformed and duplicate price rows never cross the public boundary',()=>{
 const w=privateFixture(),base=w.prices[0],changes=[{status:'draft'},{status:'review'},{removed:true},{excluded:true},{converted:true},{variantId:'other'},{currency:'USD'},{country:'UNKNOWN'},{type:'unknown'},{amountMinor:0},{sourceId:'missing'},{evidence:''},{checkedAt:'2999-01-01'},{observedAt:'2999-01-01'},{configurationId:'wrong'},{sourceProductReference:'wrong'},{configurationMatch:{reference:'wrong'}}];
 const rows=changes.map((change,i)=>({...base,id:'withheld-'+i,...change}));rows.push(null,{},'malformed',{...base,id:'duplicate-price'},{...base,id:'duplicate-price',amountMinor:1});
 const p=publicWatch({...w,prices:[...w.prices,...rows]},{now});assert.deepEqual(p.prices.map(x=>x.id),w.prices.map(x=>x.id));assert.ok(!JSON.stringify(p).includes(marker));
 assert.equal(publicWatch({...w,status:'draft'},{now}),null);assert.equal(publicWatch({...w,demo:true},{now}),null);
 assert.equal(publicWatch({...w,demo:undefined},{now}),null);assert.throws(()=>validateRecord({...w,demo:undefined}),/demo must be false/);
});

test('unavailable sources, unsupported specs and unsafe URLs cannot acquire public provenance',()=>{
 const w=historyFixture();w.powerReserve=72;w.evidence.powerReserve='missing-source';const p=publicWatch(w,{now});assert.equal(p.powerReserve,null);assert.equal(p.evidence.powerReserve,undefined);
 assert.equal(publicWatch({...w,size:-1,evidence:{...w.evidence,size:w.sources[0].id}},{now}).size,null);
 for(const change of [{rights:'pending'},{checkedAt:'2999-01-01'},{url:'http://example.invalid'},{url:'https://user:password@example.invalid'},{url:'https://example.invalid/?api_token=secret'}])assert.equal(publicWatch({...w,sources:w.sources.map(s=>({...s,...change}))},{now}),null);
 assert.equal(publicWatch({...w,evidence:{...w.evidence,reference:'missing'}},{now}),null);
 assert.equal(publicWatch({...w,sources:[...w.sources,{...w.sources[0],title:'Conflicting source'}]},{now}),null);
});

test('photo metadata is bounded to approved exact matches and unapproved primary images remain unavailable',()=>{
 const w=structuredClone(researchWatches.find(w=>w.images?.length>1));w.image.privateNote=marker;w.images.forEach(p=>p.internalContact=marker);
 const p=publicWatch(w,{production:false,now});assert.equal(p.images.length,w.images.length);assert.ok(!JSON.stringify(p).includes(marker));assert.equal(p.image.license,w.image.license);assert.equal(p.image.checkedAt,w.image.checkedAt);
 for(const change of [{rights:'pending'},{matchStatus:'pending'},{reference:'other'},{variantId:'other'},{checkedAt:'2999-01-01'},{url:'//remote.invalid/photo.webp'},{url:'/watch-photos/%2e%2e/private'},{url:'/watch-photos/file.webp?token=secret'}])assert.equal(publicWatch({...w,image:{...w.image,...change}},{production:false,now}).image,null);
 const unsafe={...w,image:{...w.image,thumbnail:'https://remote.invalid/photo.webp',originalUrl:'/../private'}};const safe=publicWatch(unsafe,{production:false,now});assert.equal(safe.image.thumbnail,undefined);assert.equal(safe.image.originalUrl,undefined);
});

test('the research catalogue retains its exact observations, dates, archived exclusions and licensed coverage',()=>{
 const original=JSON.stringify(researchWatches),all=publicCatalogue(researchWatches,{production:false,now});assert.equal(all.length,39);assert.equal(new Set(all.map(w=>w.brand+':'+w.reference)).size,38);assert.equal(all.filter(w=>w.image).length,9);assert.equal(all.flatMap(w=>w.images).length,10);
 assert.equal(all.flatMap(w=>w.prices).filter(p=>p.status==='published').length,43);assert.equal(all.flatMap(w=>w.prices).filter(p=>p.status==='archived_research').length,3);
 for(const w of all){const raw=researchWatches.find(r=>r.id===w.id);for(const key of ['brand','model','reference','dial','bracelet','material','size','movement','calibre','powerReserve','waterResistance','bezel','description'])assert.equal(w[key],raw[key]);for(const p of w.prices){const old=raw.prices.find(r=>r.id===p.id);for(const key of ['amountMinor','currency','country','type','observedAt','checkedAt','status','evidence','archivalReason'])assert.equal(p[key],old[key]);}for(const s of w.sources)assert.equal(s.checkedAt,raw.sources.find(r=>r.id===s.id).checkedAt);}
 const cartier=all.find(w=>w.reference==='WSTA0041');assert.equal(publicPrices(cartier,new URLSearchParams('market=AE')).body.observations.length,0);assert.equal(cartier.image,null);assert.ok(cartier.retailCoverageReviews.some(r=>r.country==='AE'&&r.reviewedAt));
 const poisoned={...cartier,retailCoverageReviews:cartier.retailCoverageReviews.map(r=>({...r,amountMinor:1}))};assert.equal(publicWatch(poisoned,{production:false,now}).retailCoverageReviews.length,0);
 const retailer=structuredClone(researchWatches.find(w=>w.sources.some(s=>s.authorisation)));for(const s of retailer.sources)if(s.authorisation)s.authorisation.internalContact=marker;const clean=publicWatch(retailer,{production:false,now});assert.ok(!JSON.stringify(clean).includes(marker));assert.ok(clean.sources.some(s=>s.authorisation?.checkedAt));
 assert.equal(searchWatches(all,{q:'WSTA-0041',market:'AE',maxPrice:'999999999'},all.flatMap(w=>w.prices)).length,0);assert.equal(JSON.stringify(researchWatches),original);
});

test('price API keeps original markets and archive labels separate and rejects ambiguous queries',()=>{
 const all=publicCatalogue(researchWatches,{production:false,now}),w=all.find(w=>w.prices.some(p=>p.status==='archived_research'));
 for(const market of ['IN','AE','GLOBAL']){const result=publicPrices(w,new URLSearchParams({market}));assert.equal(result.status,200);assert.ok(result.body.observations.every(p=>p.status==='published'&&p.country===market));assert.ok(result.body.archivedResearch.every(p=>p.status==='archived_research'&&p.country===market));for(const p of [...result.body.observations,...result.body.archivedResearch]){const source=w.sources.find(s=>s.id===p.sourceId);assert.equal(p.source.url,source.url);assert.equal(p.source.checkedAt,source.checkedAt);assert.equal(p.source.title,source.title);}}
 assert.ok(!JSON.stringify(publicPrices(privateFixture(),new URLSearchParams())).includes(marker));
 for(const query of ['market=US','market=IN&market=AE','type=wrong','type=official_retail&type=private_asking','unknown=x'])assert.equal(publicPrices(w,new URLSearchParams(query)).status,400);
});

test('actual catalogue and public API endpoints serialize no hidden fields, production fixtures or malformed rows',async()=>{
 const raw=privateFixture(),queries=[];globalThis.publicBoundaryEnv={DATA_MODE:'production',DB:{prepare(sql){queries.push(sql);return{async all(){return {results:[raw,{...raw,id:'draft-qa',status:'draft'},{...raw,id:'demo-qa',demo:true}].map(r=>({payload:JSON.stringify(r)})).concat({payload:'malformed-json'})};}}}}};
 const bundled=await build({entryPoints:['app/api/[...path]/route.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'public-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.publicBoundaryEnv',loader:'js'}));}}]});
 const {GET}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 const call=(path,query='')=>GET(new Request('https://test.invalid/api/'+path.join('/')+'?'+query),{params:Promise.resolve({path})});
 for(const path of [['watches'],['watches',raw.id],['watches',raw.id,'prices'],['watches',raw.id,'history']]){const response=await call(path,'market=IN');assert.equal(response.status,200);const text=await response.text();assert.ok(!text.includes(marker));assert.ok(!text.includes('demo-qa'));assert.ok(!text.includes('draft-qa'));}
 const ae=await call(['watches',raw.id,'prices'],'market=AE');assert.equal((await ae.json()).data.observations.length,0);assert.equal((await call(['watches',raw.id,'prices'],'market=US')).status,400);
 assert.ok(queries.every(sql=>/^SELECT payload FROM records WHERE state='published'/.test(sql)));delete globalThis.publicBoundaryEnv;
});

test('public page props and actual server-rendered detail retain evidence while excluding private markers',async()=>{
 const watch=publicWatch(privateFixture(),{now});assert.ok(!JSON.stringify({watches:[watch]}).includes(marker));
 const bundled=await build({entryPoints:['app/site.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom/server','react-dom/client']});const mod={exports:{}};new Function('require','module','exports',bundled.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
 const path=`/watches/${watch.brand.toLowerCase()}/${watch.reference.toLowerCase()}/${watch.id}`,html=renderToStaticMarkup(createElement(mod.exports.default,{page:path,watches:[watch],config:{name:'Synthetic QA only',demo:false},unavailable:false,initialQuery:{market:'IN'}}));assert.ok(!html.includes(marker));assert.match(html,/Source/);assert.match(html,/10,000\.25/);assert.match(html,/2026/);
});
