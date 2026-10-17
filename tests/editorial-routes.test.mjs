import {test} from 'node:test';import assert from 'node:assert/strict';
import {editorialEndpoint,editorialQueryError} from '../lib/editorial-routes.mjs';
test('editorial endpoints match exact paths and bounded record identities',()=>{
 for(const [path,method,queue] of [[['corrections'],'POST',null],[['admin'],'GET',null],[['admin','health'],'GET',null],[['admin','imports'],'POST',null],[['admin','provider'],'POST',null],[['admin','records','qa-001'],'POST',null],[['admin','corrections','qa-001'],'POST',null],[['admin','revisions','qa-001'],'GET','revisions'],...['records','corrections','audit'].map(q=>[['admin','queues',q],'GET',q])])assert.deepEqual(editorialEndpoint(path),{method,queue});
 for(const path of [null,[],['unknown'],['corrections','extra'],['admin','health','extra'],['admin','imports','extra'],['admin','provider','extra'],['admin','records','id','extra'],['admin','corrections','id','extra'],['admin','queues','unknown'],['admin','records',''],['admin','records','slash/id'],['admin','records','line\nbreak'],['admin','records','x'.repeat(201)]])assert.equal(editorialEndpoint(path),null);
});
test('only paginated endpoints accept unique, bounded, meaningful state and cursor parameters',()=>{
 for(const path of [['corrections'],['admin'],['admin','health'],['admin','provider'],['admin','records','id']]){
  const route=editorialEndpoint(path);assert.equal(editorialQueryError(new URLSearchParams(),route),null);assert.ok(editorialQueryError(new URLSearchParams('state=all'),route));
 }
 for(const queue of ['records','corrections','audit','revisions']){
  const route=editorialEndpoint(queue==='revisions'?['admin','revisions','qa-id']:['admin','queues',queue]);
  for(const query of ['', 'state=all','state=all&cursor=abc_DEF-123'])assert.equal(editorialQueryError(new URLSearchParams(query),route),null);
  for(const query of ['unknown=1','state=all&state=all','cursor=a&cursor=b','state=','cursor=','cursor=%25','cursor='+'x'.repeat(1025),'state=unknown'])assert.ok(editorialQueryError(new URLSearchParams(query),route));
 }
 assert.equal(editorialQueryError(new URLSearchParams('state=pending'),editorialEndpoint(['admin','queues','corrections'])),null);
 assert.ok(editorialQueryError(new URLSearchParams('state=pending'),editorialEndpoint(['admin','queues','records'])));
});
