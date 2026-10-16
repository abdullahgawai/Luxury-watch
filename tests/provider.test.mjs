import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const token='PRIVATE_PROVIDER_TOKEN_SENTINEL';
globalThis.providerBoundaryEnv={THEWATCHAPI_ENABLED:'true',THEWATCHAPI_TOKEN:token};
const bundle=await build({entryPoints:['lib/provider.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'provider-env',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},()=>({contents:'export const env=globalThis.providerBoundaryEnv',loader:'js'}));}}]});
const {evaluateTheWatchAPI}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const json=(data,headers={})=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json',...headers}});
async function mocked(implementation,check){const original=globalThis.fetch;globalThis.fetch=implementation;try{return await check();}finally{globalThis.fetch=original;}}
const candidate={brand:'Synthetic brand',model:'Synthetic model',reference_number:'QA-001',case_diameter:40,case_material:'Steel',movement:'Automatic',last_updated:'2026-01-01T00:00:00Z'};
test('disabled/missing credentials and invalid references make no provider request',async()=>{
 await mocked(()=>{throw new Error('Unexpected request');},async()=>{const env=globalThis.providerBoundaryEnv;env.THEWATCHAPI_ENABLED='false';assert.equal((await evaluateTheWatchAPI('QA-001')).status,'not_configured');env.THEWATCHAPI_ENABLED='true';delete env.THEWATCHAPI_TOKEN;assert.equal((await evaluateTheWatchAPI('QA-001')).status,'not_configured');env.THEWATCHAPI_TOKEN=token;for(const ref of ['', '  ','QA\n001','x'.repeat(61),'https://unsafe.invalid'])await assert.rejects(()=>evaluateTheWatchAPI(ref),/Invalid reference/);});
});
test('evaluation sends one bounded request and returns only unresolved safe candidate fields',async()=>{
 let calls=0;await mocked(async(url,options)=>{calls++;assert.equal(url.hostname,'api.thewatchapi.com');assert.equal(url.searchParams.get('api_token'),token);assert.equal(options.redirect,'error');assert.equal(options.headers.Accept,'application/json');assert.ok(options.signal instanceof AbortSignal);return json({data:[{...candidate,internalContact:token,price:1,image:'https://unlicensed.invalid'}]},{'X-UsageLimit-Limit':'500'});},async()=>{const result=await evaluateTheWatchAPI('QA-001');assert.equal(result.status,'needs_review');assert.equal(result.quota,500);assert.equal(result.examined,1);assert.equal(result.rejectedCandidates,0);assert.equal(result.truncated,false);assert.deepEqual(result.candidates,[{brand:candidate.brand,model:candidate.model,reference:'QA-001',size:40,material:'Steel',movement:'Automatic',providerUpdatedAt:candidate.last_updated,variantMapping:'unresolved',scope:'GLOBAL',prices:[],image:null}]);assert.ok(!JSON.stringify(result).includes(token));});assert.equal(calls,1);
});
test('candidate caps and field validation reject malformed rows and prevent token echoes',async()=>{
 const rows=[null,[],false,{reference_number:token},{reference_number:'QA-002',brand:token,model:{nested:token},case_diameter:900,case_material:'x'.repeat(201),movement:'bad\nfield',last_updated:'2999-01-01T00:00:00Z'},...Array.from({length:30},()=>({...candidate}))];
 await mocked(async()=>json({data:rows},{'X-UsageLimit-Limit':token}),async()=>{const r=await evaluateTheWatchAPI('QA-001');assert.equal(r.examined,25);assert.equal(r.truncated,true);assert.equal(r.rejectedCandidates,4);assert.equal(r.candidates.length,21);assert.equal(r.quota,null);for(const key of ['brand','model','size','material','movement','providerUpdatedAt'])assert.equal(r.candidates[0][key],null);assert.ok(!JSON.stringify(r).includes(token));});
});
test('oversized advertised and streamed bodies are cancelled without returning any payload',async()=>{
 let cancelled=0;
 for(const advertised of [true,false]){const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(200000));controller.enqueue(new Uint8Array(70000));},cancel(){cancelled++;}});await mocked(async()=>new Response(stream,{headers:{'content-type':'application/json',...(advertised?{'content-length':'270000'}:{})}}),async()=>{assert.deepEqual(await evaluateTheWatchAPI('QA-001'),{status:'response_too_large'});});}
 assert.equal(cancelled,2);
});
test('invalid JSON/schema/encoding and unsupported media types never return candidates',async()=>{
 const responses=[new Response('<html>bad</html>',{headers:{'content-type':'text/html'}}),new Response('{invalid',{headers:{'content-type':'application/json'}}),json(null),json([]),json({data:{}}),new Response(new Uint8Array([255]),{headers:{'content-type':'application/json'}})];
 for(const response of responses)await mocked(async()=>response,async()=>assert.deepEqual(await evaluateTheWatchAPI('QA-001'),{status:'schema_changed'}));
 await mocked(async()=>json({data:[]}),async()=>{const result=await evaluateTheWatchAPI('QA-001');assert.equal(result.status,'no_matches');assert.deepEqual(result.candidates,[]);});
});
test('authentication, throttling and upstream failures are sanitized and never automatically retried',async()=>{
 for(const [status,expected] of [[401,'authentication_failed'],[403,'authentication_failed'],[429,'rate_limited'],[500,'upstream_error'],[302,'upstream_error']]){let calls=0;await mocked(async()=>{calls++;return new Response(token,{status});},async()=>{assert.deepEqual(await evaluateTheWatchAPI('QA-001'),{status:expected,httpStatus:status});});assert.equal(calls,1);}
 let calls=0;await mocked(async()=>{calls++;throw new Error('https://unsafe.invalid?api_token='+token);},async()=>{const r=await evaluateTheWatchAPI('QA-001');assert.equal(r.status,'provider_unavailable');assert.ok(!JSON.stringify(r).includes(token));});assert.equal(calls,1);
});
