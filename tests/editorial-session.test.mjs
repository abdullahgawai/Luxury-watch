import {test} from 'node:test';import assert from 'node:assert/strict';
import {editorAccess,providerEvaluation,verifiedProviderEvaluation} from '../lib/editorial-session.mjs';
const fetchJSON=(body,status=200)=>async()=>({ok:status===200,status,json:async()=>body});
const candidate=()=>({brand:'Synthetic',model:null,reference:'QA-001',size:36,material:null,movement:null,providerUpdatedAt:null,variantMapping:'unresolved',scope:'GLOBAL',prices:[],image:null});
const result=()=>({status:'needs_review',candidates:[candidate()],examined:1,rejectedCandidates:0,truncated:false,quota:null});
test('editor access requires a bounded stable string and never echoes errors',async()=>{
 assert.equal(await editorAccess({fetcher:fetchJSON({userId:'test-editor'})}),'test-editor');
 for(const body of [null,{},[],{userId:{}},{userId:''},{userId:' '},{userId:'x'.repeat(201)},{userId:'test\neditor'}])await assert.rejects(()=>editorAccess({fetcher:fetchJSON(body)}),/could not be confirmed/);
 await assert.rejects(()=>editorAccess({fetcher:fetchJSON({error:'PRIVATE_SENTINEL'},403)}),e=>e.message.includes('denied')&&!e.message.includes('PRIVATE_SENTINEL'));
 await assert.rejects(()=>editorAccess({fetcher:async()=>{throw new Error('PRIVATE_SENTINEL');}}),e=>e.message.includes('retry')&&!e.message.includes('PRIVATE_SENTINEL'));
});
test('session operations have fetch and parsing deadlines, cancellation and one request only',async()=>{
 for(const operation of [options=>editorAccess(options),options=>providerEvaluation('QA-001',options)]){
  let calls=0,signal;await assert.rejects(()=>operation({timeoutMs:10,fetcher:async(_url,init)=>{calls++;signal=init.signal;return new Promise(()=>{});}}));assert.equal(calls,1);assert.equal(signal.aborted,true);
  await assert.rejects(()=>operation({timeoutMs:10,fetcher:async()=>({ok:true,json:()=>new Promise(()=>{})})}));
  const aborted=new AbortController();aborted.abort();await assert.rejects(()=>operation({signal:aborted.signal,fetcher:async()=>{calls++;}}));assert.equal(calls,1);
  const active=new AbortController(),pending=operation({signal:active.signal,fetcher:async()=>new Promise(()=>{})});active.abort();await assert.rejects(()=>pending);
 }
});
test('provider evaluation validates references before requests and preserves explicit quotas and uncertainty',async()=>{
 let calls=0;
 for(const reference of ['', ' ', '<script>', 'x'.repeat(61)])await assert.rejects(()=>providerEvaluation(reference,{fetcher:async()=>{calls++;}}),/Enter a reference/);assert.equal(calls,0);
 const body=await providerEvaluation('QA-001',{fetcher:async(url,init)=>{calls++;assert.equal(url,'/api/admin/provider');assert.equal(init.method,'POST');assert.deepEqual(JSON.parse(init.body),{reference:'QA-001'});assert.equal(init.cache,'no-store');return {ok:true,json:async()=>({status:'not_configured',message:'PRIVATE_SENTINEL'})};}});assert.deepEqual(body,{status:'not_configured'});assert.equal(calls,1);
 for(const [status,match] of [[429,/one hour/],[403,/denied/],[503,/may count/]])await assert.rejects(()=>providerEvaluation('QA-001',{fetcher:fetchJSON({error:'PRIVATE_SENTINEL'},status)}),e=>match.test(e.message)&&!e.message.includes('PRIVATE_SENTINEL'));
});
test('provider rendering projects reviewed fields and rejects local prices, photos and malformed candidates',()=>{
 const body=result();body.private='PRIVATE_SENTINEL';body.candidates[0].private='PRIVATE_SENTINEL';const projected=verifiedProviderEvaluation(body);assert.equal(JSON.stringify(projected).includes('PRIVATE_SENTINEL'),false);assert.equal(projected.candidates[0].scope,'GLOBAL');
 for(const status of ['not_configured','authentication_failed','rate_limited','upstream_error','response_too_large','schema_changed','provider_unavailable'])assert.deepEqual(verifiedProviderEvaluation({status,secret:'PRIVATE_SENTINEL'}),{status});
 assert.deepEqual(verifiedProviderEvaluation({status:'no_matches',candidates:[],examined:0,rejectedCandidates:0,truncated:false,quota:100}),{status:'no_matches',candidates:[],examined:0,rejectedCandidates:0,truncated:false,quota:100});
 for(const bad of [null,{}, {...result(),quota:-1},{...result(),examined:2},{...result(),truncated:true},{...result(),status:'no_matches'},...[
  {scope:'AE'},{prices:[{amount:1}]},{image:'unlicensed.jpg'},{brand:{}},{size:Infinity},{variantMapping:'approved'},{providerUpdatedAt:'invalid'},{providerUpdatedAt:'2999-01-01T00:00:00Z'}
 ].map(override=>({...result(),candidates:[{...candidate(),...override}]}))])assert.throws(()=>verifiedProviderEvaluation(bad),/could not be verified/);
});
