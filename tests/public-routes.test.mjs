import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {publicRoute,routeExists,catalogueDependent,retryPageHref} from '../lib/public-routes.mjs';
import {researchWatches} from '../lib/research-catalogue.mjs';
test('only supported page shapes, glossary entries and exact watch URL structures resolve',()=>{
 for(const page of ['watches','brands','compare','market','guide','saved','methodology','credits','coverage','corrections','contact','privacy','admin'])assert.ok(publicRoute([page]));
 for(const guide of ['reference','gmt','chronograph','power-reserve','automatic','water-resistance'])assert.ok(publicRoute(['guide',guide]));
 for(const w of researchWatches)assert.ok(publicRoute(['watches',w.brand.toLowerCase(),w.reference.toLowerCase(),w.id]));
 for(const slug of [[],null,['unknown'],['compare','extra'],['admin','imports'],['brands','cartier','extra'],['guide','reference','extra'],['guide','unknown'],['watches','cartier'],['watches','cartier','wsta0041'],['watches','cartier','wsta0041','cartier-wsta0041-silver-leather','extra'],['brands','../private'],['watches','cartier','a/b','valid-id']])assert.equal(publicRoute(slug),null,JSON.stringify(slug));
});
test('healthy catalogue lookup distinguishes unpublished routes and outage retry preserves URL state',()=>{
 const w=researchWatches[0],route=publicRoute(['watches',w.brand.toLowerCase(),w.reference.toLowerCase(),w.id]);assert.equal(routeExists(route,researchWatches),true);assert.equal(routeExists({...route,path:route.path+'-missing'},researchWatches),false);assert.equal(routeExists(publicRoute(['brands','cartier']),researchWatches),true);assert.equal(routeExists(publicRoute(['brands','unknown']),researchWatches),false);
 const query={q:'Tank & green',page:'2',sort:'price',ids:'watch-one,watch-two',market:'IN',maxPrice:'500000'};const u=new URL(retryPageHref('/compare',query,'AE'),'https://test.invalid');for(const [key,value]of Object.entries(query))assert.equal(u.searchParams.get(key),key==='market'?'AE':value);
 assert.equal(catalogueDependent('/guide/reference'),false);for(const path of ['/watches','/brands/cartier','/saved','/compare','/coverage','/market'])assert.equal(catalogueDependent(path),true);
});
let routeModule;
async function bundledRoutes(){if(routeModule)return routeModule;const b=await build({entryPoints:['app/[...slug]/page.tsx'],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom/server','react-dom/client'],plugins:[{name:'route-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const env=globalThis.routeTestEnv',loader:'js'}));b.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'nav'}));b.onLoad({filter:/.*/,namespace:'nav'},()=>({contents:'export function notFound(){throw new Error("QA_NOT_FOUND");}',loader:'js'}));}}]});const mod={exports:{}};new Function('require','module','exports',b.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);return routeModule=mod.exports;}
test('actual page and metadata handlers reject malformed paths before catalogue reads and distinguish outages',async()=>{
 let reads=0,fail=false;globalThis.routeTestEnv={DATA_MODE:'production',DB:{prepare(){reads++;if(fail)throw new Error('PRIVATE_ROUTE_DATABASE_SENTINEL');return {async all(){return {results:[]};}};}}};const mod=await bundledRoutes(),args=slug=>({params:Promise.resolve({slug}),searchParams:Promise.resolve({market:'AE',q:'Tank',page:'2'})});
 try{
  for(const slug of [['compare','extra'],['brands','cartier','extra'],['guide','reference','extra']]){await assert.rejects(()=>mod.default(args(slug)),/QA_NOT_FOUND/);await assert.rejects(()=>mod.generateMetadata(args(slug)),/QA_NOT_FOUND/);}assert.equal(reads,0);
  await assert.rejects(()=>mod.default(args(['brands','cartier'])),/QA_NOT_FOUND/);
  const slug=['watches','cartier','wsta0041','cartier-wsta0041-silver-leather'];await assert.rejects(()=>mod.default(args(slug)),/QA_NOT_FOUND/);
  fail=true;for(const path of [['brands','cartier'],slug]){const result=await mod.default(args(path));assert.equal(result.props.unavailable,true);assert.equal(result.props.initialQuery.market,'AE');const html=renderToStaticMarkup(result);assert.match(html,/Catalogue temporarily unavailable/);assert.ok(!html.includes('No matching configurations'));assert.ok(!html.includes('PRIVATE_ROUTE_DATABASE_SENTINEL'));assert.match(html,/q=Tank/);assert.match(html,/page=2/);const metadata=await mod.generateMetadata(args(path));assert.match(metadata.title,/Catalogue unavailable/);}
 }finally{delete globalThis.routeTestEnv;}
});
test('actual unavailable Site render keeps saved/comparison pages distinct from empty selections',async()=>{
 globalThis.routeTestEnv={DATA_MODE:'production',DB:{prepare(){throw new Error('Simulated outage');}}};const mod=await bundledRoutes();
 try{for(const section of ['saved','compare','coverage','market','watches']){const result=await mod.default({params:Promise.resolve({slug:[section]}),searchParams:Promise.resolve({market:'IN',ids:'example-watch',q:'Tank',page:'2'})});const html=renderToStaticMarkup(result);assert.match(html,/Retry this page/);assert.match(html,/Catalogue temporarily unavailable/);assert.match(html,/ids=example-watch/);assert.ok(!html.includes('No matching configurations'));assert.ok(!html.includes('0 exact configurations'));}}finally{delete globalThis.routeTestEnv;}
});
