import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editorialWrite,confirmedEditorialWrite,importAttempt} from '../lib/editorial-write.mjs';
const body={record:{id:'qa-import-record'}};
test('import attempt keys persist for unchanged content and change only with a different attempt',()=>{
 let calls=0;const key=()=>String(++calls),first=importAttempt(null,'first',key);assert.equal(importAttempt(first,'first',key),first);assert.equal(calls,1);assert.notEqual(importAttempt(first,'changed',key).key,first.key);assert.equal(calls,2);
});
test('only matching import, record revision and moderation confirmations are accepted',()=>{
 assert.equal(confirmedEditorialWrite('/api/admin/imports',body,201,{id:body.record.id,state:'draft'}),true);assert.equal(confirmedEditorialWrite('/api/admin/imports',body,200,{id:body.record.id,idempotent:true}),true);
 for(const result of [{},{id:'different',state:'draft'},{id:body.record.id,state:'published'},null,[]])assert.equal(confirmedEditorialWrite('/api/admin/imports',body,201,result),false);
 for(const [action,state] of Object.entries({review:'review',publish:'published',withdraw:'draft',revise:'draft',rollback:'draft'})){assert.equal(confirmedEditorialWrite('/api/admin/records/qa-record',{action,revision:2},200,{id:'qa-record',state,revision:3}),true);assert.equal(confirmedEditorialWrite('/api/admin/records/qa-record',{action,revision:2},200,{id:'qa-record',state,revision:2}),false);}
 assert.equal(confirmedEditorialWrite('/api/admin/corrections/qa-correction',{state:'resolved'},200,{state:'resolved'}),true);assert.equal(confirmedEditorialWrite('/api/admin/corrections/qa-correction',{state:'resolved'},200,{state:'accepted'}),false);
});
test('single write forwards the stable key and rejects ambiguous success without a retry',async()=>{
 let calls=0;
 await assert.rejects(()=>editorialWrite('/api/admin/imports',body,{key:'stable-key',fetcher:async(_url,options)=>{calls++;assert.equal(options.method,'POST');assert.equal(options.headers['Idempotency-Key'],'stable-key');assert.deepEqual(JSON.parse(options.body),body);return {ok:true,status:200,json:async()=>({})};}}),/could not be confirmed/);assert.equal(calls,1);
 const result=await editorialWrite('/api/admin/imports',body,{key:'stable-key',fetcher:async()=>({ok:true,status:200,json:async()=>({id:body.record.id,idempotent:true})})});assert.equal(result.id,body.record.id);
});
test('write deadlines cover fetch and parsing; cancellation and failures preserve uncertainty without exposing payloads',async()=>{
 let calls=0,signal;
 await assert.rejects(()=>editorialWrite('/api/admin/imports',body,{timeoutMs:10,fetcher:async(_url,options)=>{calls++;signal=options.signal;return new Promise(()=>{});}}),/draft is preserved/);assert.equal(calls,1);assert.equal(signal.aborted,true);
 await assert.rejects(()=>editorialWrite('/api/admin/imports',body,{timeoutMs:10,fetcher:async()=>({ok:true,json:()=>new Promise(()=>{})})}),/could not be confirmed/);
 const controller=new AbortController();controller.abort();await assert.rejects(()=>editorialWrite('/api/admin/imports',body,{signal:controller.signal,fetcher:async()=>{throw new Error('Unexpected request');}}),/could not be confirmed/);
 for(const status of [400,403,409,413,429,503])await assert.rejects(()=>editorialWrite('/api/admin/imports',body,{fetcher:async()=>({ok:false,status,json:async()=>({error:'PRIVATE_WRITE_SENTINEL'})})}),e=>!e.message.includes('PRIVATE_WRITE_SENTINEL'));
});
