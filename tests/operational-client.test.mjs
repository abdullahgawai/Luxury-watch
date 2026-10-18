import {test} from 'node:test';
import assert from 'node:assert/strict';
import {operationalWarnings} from '../lib/operational-warnings.mjs';
import {verifiedOperationalReport,operationalCheckRequest} from '../lib/operational-client.mjs';
const report=()=>{const body={status:'needs_attention',checkedAt:'2026-10-17T00:00:00Z',database:'ok',dataMode:'research',records:{draft:1,review:2,published:4},publication:{checked:4,visible:1,withheld:3,invalidPayloads:1,withheldPrices:1,withheldPhotos:1,truncated:false},corrections:{pending:2,oldestPendingAt:null},prices:{checked:3,stale:1,invalid:1,truncated:false},provider:{enabled:false,tokenConfigured:false,evaluationsLastHour:0},automation:{alerts:'not_configured',hostedRestore:'not_verified'},warnings:[]};body.warnings=operationalWarnings(body);return body;};
test('operational reports preserve dates and reject success while required services remain unverified',()=>{
 const body=report(),before=JSON.stringify(body);assert.equal(verifiedOperationalReport(body),body);assert.equal(JSON.stringify(body),before);
 const clean={...report(),status:'ok',warnings:[]};assert.throws(()=>verifiedOperationalReport(clean),/could not be verified/);
});
test('incomplete, contradictory and unsafe check responses cannot render a success',()=>{
 const variants=[null,[],{}, {...report(),checkedAt:'invalid'},{...report(),status:'ok'},{...report(),warnings:['duplicate','duplicate']},{...report(),warnings:[{private:'data'}]},{...report(),publication:{...report().publication,visible:-1}},{...report(),publication:{...report().publication,withheld:1}},{...report(),records:{...report().records,published:0}},{...report(),prices:{...report().prices,stale:3}},{...report(),provider:{evaluationsLastHour:0}},{...report(),corrections:{pending:NaN,oldestPendingAt:null}},{...report(),automation:{alerts:'configured',hostedRestore:'verified'}}];
 for(const body of variants)assert.throws(()=>verifiedOperationalReport(body),/could not be verified/);
});
test('health reads are bounded through JSON parsing, cancel safely and never retry or mutate',async()=>{
 let calls=0,signal;
 await assert.rejects(()=>operationalCheckRequest({timeoutMs:10,fetcher:async(url,options)=>{assert.equal(url,'/api/admin/health');assert.equal(options.method,undefined);assert.equal(options.cache,'no-store');calls++;signal=options.signal;return new Promise(()=>{});}}),/timed out/);assert.equal(calls,1);assert.equal(signal.aborted,true);
 await assert.rejects(()=>operationalCheckRequest({timeoutMs:10,fetcher:async()=>({ok:true,json:()=>new Promise(()=>{})})}),/timed out/);
 const controller=new AbortController();controller.abort();await assert.rejects(()=>operationalCheckRequest({signal:controller.signal,fetcher:async()=>{calls++;}}),/unavailable/);assert.equal(calls,1);
 const active=new AbortController(),pending=operationalCheckRequest({signal:active.signal,fetcher:async()=>new Promise(()=>{})});active.abort();await assert.rejects(()=>pending,/unavailable/);
});

test('every known attention condition must retain its warning even in a structurally valid report',()=>{
 const body=report();
 for(const warning of body.warnings){const hidden={...body,warnings:body.warnings.filter(w=>w!==warning)};assert.throws(()=>verifiedOperationalReport(hidden),/could not be verified/);}
 const production={...body,dataMode:'production',publication:{...body.publication,visible:4,withheld:0,invalidPayloads:0,withheldPrices:0,withheldPhotos:0},prices:{checked:0,stale:0,invalid:0,truncated:false}};
 production.warnings=operationalWarnings(production);
 assert.equal(production.warnings.length,2);assert.ok(production.warnings.some(w=>w.includes('alerts')));assert.ok(production.warnings.some(w=>w.includes('database restore')));
 assert.equal(verifiedOperationalReport(production),production);
 assert.throws(()=>verifiedOperationalReport({...production,status:'ok',warnings:[]}),/could not be verified/);
});
test('HTTP and parse errors stay private and a fresh explicit retry can recover',async()=>{
 for(const fetcher of [async()=>{throw new Error('PRIVATE_SENTINEL');},async()=>({ok:false,json:async()=>({error:'PRIVATE_SENTINEL'})}),async()=>({ok:true,json:async()=>{throw new Error('PRIVATE_SENTINEL');}})])await assert.rejects(()=>operationalCheckRequest({fetcher}),e=>!e.message.includes('PRIVATE_SENTINEL')&&e.message.includes('Run the check again'));
 const body=report();assert.equal(await operationalCheckRequest({fetcher:async()=>({ok:true,json:async()=>body})}),body);
});
