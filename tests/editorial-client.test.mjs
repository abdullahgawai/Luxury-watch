import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editorialQueueRequest,verifiedQueuePage,storedJSON} from '../lib/editorial-client.mjs';
const at='2026-10-17T00:00:00Z';
const rows={records:{id:'qa-record',brand:'Synthetic',reference:'QA-001',payload:'{broken',state:'draft',revision:1,updated_at:at},corrections:{id:'qa-correction',page:'/watches',field:'dial',claim:'x'.repeat(3000),contact:null,state:'pending',created_at:at},audit:{id:'qa-audit',actor:'qa-editor',entity_id:'qa-record',action:'import',old_value:null,new_value:'{broken',at},revisions:{id:'qa-revision',record_id:'qa-record',payload:'{}',actor:'qa-editor',revision:1,at}};
const page=row=>({rows:[row],hasMore:false,nextCursor:null,pageSize:25});
test('queue contract accepts all real queue shapes and preserves unreadable stored JSON for explicit recovery',()=>{
 for(const [kind,row] of Object.entries(rows)){const body=page(row),before=JSON.stringify(body);assert.equal(verifiedQueuePage(body,kind),body);assert.equal(JSON.stringify(body),before);}
 assert.deepEqual(storedJSON(null),{ok:true,value:null});assert.deepEqual(storedJSON('{broken'),{ok:false,value:null});assert.deepEqual(storedJSON('null'),{ok:true,value:null});assert.deepEqual(storedJSON('{"review":"pending"}'),{ok:true,value:{review:'pending'}});
});
test('malformed pagination, row objects, duplicate identities and invalid fields cannot enter queue rendering',()=>{
 for(const body of [null,{},page({...rows.records,brand:{private:'nested'}}),page({...rows.records,revision:0}),page({...rows.records,updated_at:'invalid'}),{...page(rows.records),rows:[rows.records,rows.records]},{...page(rows.records),rows:Array(26).fill(rows.records)},{...page(rows.records),pageSize:50},{...page(rows.records),hasMore:true,nextCursor:'abc'},{...page(rows.records),hasMore:false,nextCursor:'abc'}])assert.throws(()=>verifiedQueuePage(body,'records'),/could not be verified/);
 assert.throws(()=>verifiedQueuePage(page(rows.records),'unknown'),/could not be verified/);
 const full={rows:Array.from({length:25},(_,i)=>({...rows.records,id:'qa-'+i})),hasMore:true,nextCursor:'abc_123',pageSize:25};assert.equal(verifiedQueuePage(full,'records').rows.length,25);
});
test('queue requests have an actual deadline including JSON parsing, without retries',async()=>{
 let calls=0,requestSignal;
 await assert.rejects(()=>editorialQueueRequest('/local-test',{timeoutMs:10,fetcher:async(_url,options)=>{calls++;requestSignal=options.signal;return new Promise(()=>{});}}),/timed out/);assert.equal(calls,1);assert.equal(requestSignal.aborted,true);
 await assert.rejects(()=>editorialQueueRequest('/local-test',{timeoutMs:10,fetcher:async()=>({ok:true,json:()=>new Promise(()=>{})})}),/timed out/);
});
test('unmount cancellation and transport/JSON failures expose only controlled messages',async()=>{
 const controller=new AbortController();let calls=0;controller.abort();await assert.rejects(()=>editorialQueueRequest('/local-test',{signal:controller.signal,fetcher:async()=>{calls++;}}),/cancelled/);assert.equal(calls,0);
 const active=new AbortController(),request=editorialQueueRequest('/local-test',{signal:active.signal,fetcher:async()=>new Promise(()=>{})});active.abort();await assert.rejects(()=>request,/cancelled/);
 for(const fetcher of [async()=>{throw new Error('PRIVATE_NETWORK_SENTINEL');},async()=>({ok:false,json:async()=>({error:'PRIVATE_NETWORK_SENTINEL'})}),async()=>({ok:true,json:async()=>{throw new Error('PRIVATE_NETWORK_SENTINEL');}})])await assert.rejects(()=>editorialQueueRequest('/local-test',{fetcher}),error=>!error.message.includes('PRIVATE_NETWORK_SENTINEL')&&error.message.includes('Retry'));
 const result=await editorialQueueRequest('/local-test',{fetcher:async(_url,options)=>{assert.equal(options.cache,'no-store');return {ok:true,json:async()=>page(rows.records)};}});assert.deepEqual(result,page(rows.records));
});
