import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateCorrection} from '../lib/correction-input.mjs';
const valid={page:'/watches/cartier/test?market=AE',field:'Retail price',claim:'Please review this source; synthetic validation test only.',contact:''};
test('correction validation preserves market context and normalizes text without requiring email',()=>{
 const result=validateCorrection({...valid,field:' Retail price ',claim:' '+valid.claim+' '});assert.equal(result.valid,true);assert.equal(result.values.page,valid.page);assert.equal(result.values.field,'Retail price');assert.equal(result.values.claim,valid.claim);assert.equal(result.values.contact,'');
});
test('correction errors are field-specific for invalid paths, oversized text, malformed objects and email',()=>{
 for(const page of ['//evil.test','/\\evil.test','/line\nbreak','https://evil.test','/'+'x'.repeat(301)])assert.ok(validateCorrection({...valid,page}).errors.page);
 assert.ok(validateCorrection({...valid,claim:'x'.repeat(3001)}).errors.claim);assert.ok(validateCorrection({...valid,field:'x'}).errors.field);
 for(const contact of ['invalid',[],{},7])assert.ok(validateCorrection({...valid,contact}).errors.contact);
 for(const input of [null,[],{},'bad']){const result=validateCorrection(input);assert.equal(result.valid,false);assert.ok(result.errors.page&&result.errors.field&&result.errors.claim);}
 assert.ok(validateCorrection({...valid,website:'bot'}).errors.form);
});
