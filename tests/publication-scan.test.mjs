import {test} from 'node:test';import assert from 'node:assert/strict';
import {scanPublicationText,sensitiveFile,privateFrameworkConfig,frameworkSecretExposures} from '../lib/publication-scan.mjs';
test('credential signatures return categories and locations without matched values',()=>{
 const cases=[['github_token',['gh','p_','a'.repeat(36)].join('')],['github_fine_grained_token',['github_','pat_','a'.repeat(50)].join('')],['openai_key',['sk-','proj-','a'.repeat(50)].join('')],['aws_access_key',['AK','IA','A'.repeat(16)].join('')],['private_key',['-----BEGIN ','PRIVATE KEY-----'].join('')],['embedded_url_credentials',['https:','//reader:','a'.repeat(20),'@example.invalid'].join('')]];
 for(const [kind,secret] of cases){const findings=scanPublicationText('safe line\n'+secret);assert.ok(findings.some(f=>f.kind===kind&&f.line===2));assert.equal(JSON.stringify(findings).includes(secret),false);for(const f of findings)assert.deepEqual(Object.keys(f).sort(),['kind','line']);}
});
test('hardcoded credential assignments are detected while explicit placeholders remain permissible',()=>{
 const name=['THEWATCHAPI_','TOKEN'].join(''),value=['synthetic-value-','1234567890'].join('');
 assert.ok(scanPublicationText(name+'="'+value+'"').some(f=>f.kind==='hardcoded_credential'));
 for(const value of ['PRIVATE_PROVIDER_TOKEN_SENTINEL','your_server_token','<secure runtime value>','${SERVER_TOKEN}','process.env.SERVER_TOKEN'])assert.deepEqual(scanPublicationText(name+'="'+value+'"'),[]);
 assert.deepEqual(scanPublicationText('const token=env.THEWATCHAPI_TOKEN;'),[]);
 assert.deepEqual(scanPublicationText("url.searchParams.set('api_token',token); throw new Error('?api_token='+token);"),[]);
});
test('framework configuration exceptions are limited to exact private paths and retain scanning of other fields',()=>{
 const secret='ab'.repeat(32),other=['sk-','proj-','b'.repeat(50)].join(''),raw=JSON.stringify({prerenderSecret:secret,other});
 for(const file of ['dist/server/vinext-server.json','dist/server/ssr/vinext-server.json']){const config=privateFrameworkConfig(raw,file);assert.equal(config.secret,secret);assert.equal(config.sanitized.includes(secret),false);assert.ok(scanPublicationText(config.sanitized).some(f=>f.kind==='openai_key'));}
 for(const file of ['dist/client/vinext-server.json','dist/client/config.json','other/vinext-server.json'])assert.equal(privateFrameworkConfig(raw,file),null);
 for(const raw of ['{}','[]','null',JSON.stringify({prerenderSecret:'short'})])assert.throws(()=>privateFrameworkConfig(raw,'dist/server/vinext-server.json'));
});
test('generated framework secret exposure is detected without returning its value',()=>{
 const secret='ab'.repeat(32),findings=frameworkSecretExposures('safe\n'+secret,[secret,secret]);assert.deepEqual(findings,[{kind:'framework_secret_exposure',line:2}]);assert.equal(JSON.stringify(findings).includes(secret),false);assert.deepEqual(frameworkSecretExposures('safe output',[secret]),[]);
});
test('review callbacks do not expose matched text through findings and can be disabled for artifacts',()=>{
 const value=['gh','p_','a'.repeat(36)].join('');let called=false;
 assert.deepEqual(scanPublicationText(value,{approved:(kind,raw,line)=>{called=true;assert.equal(kind,'github_token');assert.equal(raw,value);assert.equal(line,1);return true;}}),[]);assert.equal(called,true);
 assert.ok(scanPublicationText(value,{artifact:true}).some(f=>f.kind==='github_token'));
});
test('local QA markers fail only artifact scanning; source tests and labelled research are distinct',()=>{
 for(const marker of ['synthetic-history-qa','history-fixture.invalid','PRIVATE_PROVIDER_TOKEN_SENTINEL','local-synthetic-editor','SYNTHETIC RECEIPTS']){assert.deepEqual(scanPublicationText(marker),[]);assert.ok(scanPublicationText(marker,{artifact:true}).some(f=>f.kind==='local_qa_fixture'));}
 assert.deepEqual(scanPublicationText('Research preview · Source-checked snapshots · No live provider connection',{artifact:true}),[]);
});
test('sensitive filenames are blocked regardless of directory, with template and public-key exceptions',()=>{
 for(const name of ['.env','.env.local','legacy/.env.production','.dev.vars','server\\.dev.vars.local','id_rsa','keys/id_ed25519'])assert.equal(sensitiveFile(name),true,name);
 for(const name of ['.env.example','.env.template','.dev.vars.sample','id_rsa.pub','package.json','docs/PHOTOGRAPHY.md'])assert.equal(sensitiveFile(name),false,name);
});
