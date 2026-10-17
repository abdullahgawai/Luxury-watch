import {test} from 'node:test';import assert from 'node:assert/strict';
import {correctionResponse,submitCorrection} from '../lib/correction-client.mjs';
const key='12345678-1234-4123-8123-123456789abc',other='12345678-1234-4123-8123-123456789def';
test('only a created receipt matching the current submission confirms a correction',()=>{
 assert.deepEqual(correctionResponse(201,{id:key,private:'PRIVATE_SENTINEL'},key),{receipt:key});
 for(const [status,body] of [[200,{id:key}],[201,{id:other}],[201,null],[201,[]],[201,{}],[503,{id:key}]])assert.throws(()=>correctionResponse(status,body,key),/Receipt could not be confirmed/);
});
test('server field errors use bounded known keys and local wording without unsafe payload rendering',()=>{
 const safe=correctionResponse(400,{fields:{claim:'PRIVATE_SENTINEL',contact:'PRIVATE_SENTINEL'},error:'PRIVATE_SENTINEL'},key);assert.deepEqual(Object.keys(safe.fields),['claim','contact']);assert.equal(JSON.stringify(safe).includes('PRIVATE_SENTINEL'),false);
 for(const fields of [null,[],{},'bad',{claim:{}},{claim:['bad']},{claim:''},{claim:'x'.repeat(501)},{unknown:'text'},JSON.parse('{"__proto__":"text"}')])assert.throws(()=>correctionResponse(400,{fields},key),/Receipt could not be confirmed/);
 for(const status of [403,409,413,429]){const result=correctionResponse(status,{error:{private:'PRIVATE_SENTINEL'}},key);assert.equal(JSON.stringify(result).includes('PRIVATE_SENTINEL'),false);assert.ok(result.message);assert.equal(result.receipt,undefined);}
});
test('correction requests preserve exact body and retry key, never automatically repeating a write',async()=>{
 let calls=0;const signature='{"page":"/test?market=AE","field":"dial","claim":"Synthetic test only","contact":""}';
 const fetcher=async(url,options)=>{calls++;assert.equal(url,'/api/corrections');assert.equal(options.method,'POST');assert.equal(options.body,signature);assert.equal(options.headers['Idempotency-Key'],key);assert.equal(options.cache,'no-store');return {status:calls===1?200:201,json:async()=>({id:key})};};
 await assert.rejects(()=>submitCorrection(signature,key,{fetcher}),/Receipt could not be confirmed/);assert.equal(calls,1);assert.deepEqual(await submitCorrection(signature,key,{fetcher}),{receipt:key});assert.equal(calls,2);
});
test('deadlines cover fetch and JSON parsing, with pre/in-flight cancellation and private failures withheld',async()=>{
 let calls=0,signal;await assert.rejects(()=>submitCorrection('{}',key,{timeoutMs:10,fetcher:async(_url,options)=>{calls++;signal=options.signal;return new Promise(()=>{});}}),/Receipt could not be confirmed/);assert.equal(calls,1);assert.equal(signal.aborted,true);
 await assert.rejects(()=>submitCorrection('{}',key,{timeoutMs:10,fetcher:async()=>({status:201,json:()=>new Promise(()=>{})})}),/Receipt could not be confirmed/);
 const aborted=new AbortController();aborted.abort();await assert.rejects(()=>submitCorrection('{}',key,{signal:aborted.signal,fetcher:async()=>{calls++;}}));assert.equal(calls,1);
 const active=new AbortController(),pending=submitCorrection('{}',key,{signal:active.signal,fetcher:async()=>new Promise(()=>{})});active.abort();await assert.rejects(()=>pending);
 for(const fetcher of [async()=>{throw new Error('PRIVATE_SENTINEL');},async()=>({status:400,json:async()=>{throw new Error('PRIVATE_SENTINEL');}})])await assert.rejects(()=>submitCorrection('{}',key,{fetcher}),e=>e.message.includes('text is preserved')&&!e.message.includes('PRIVATE_SENTINEL'));
 await assert.rejects(()=>submitCorrection('{}','invalid-key',{fetcher:async()=>{calls++;}}));assert.equal(calls,1);
});
