import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {historyFixture,historyNow as now} from './fixtures/history.mjs';
import {researchWatches} from '../lib/research-catalogue.mjs';
import {historySeries,historyResponse,historyDate,historyMoney} from '../lib/history.mjs';
import {reliableHistoryObservations,validateRecord} from '../lib/domain.mjs';

test('history requires reviewed observations, explicit source rights and known comparison metadata',()=>{
 const record=historyFixture();assert.equal(reliableHistoryObservations(record,'IN','official_retail',now).length,3);
 for(const change of [{historyEligible:false},{historyEligible:undefined},{retrievalMethod:'cached_web_research'},{retrievalMethod:'direct_source_snapshot'},{condition:'Unknown'},{boxPapers:'Not stated'},{taxStatus:'Tax status not confirmed'},{retailBasis:undefined},{evidence:''},{checkedAt:'2026-10-09T12:00:00Z'},{observedAt:'2026-10-10'},{sourceId:'missing'},{sourceProductReference:'OTHER'},{configurationId:'OTHER'},{configurationMatch:{reference:'OTHER'}},{status:'draft'},{removed:true},{excluded:true},{converted:true},{observedAt:'2999-01-01T00:00:00Z'}]){
  const w={...record,prices:record.prices.map(p=>({...p,...change}))};assert.equal(historySeries(w,'IN','official_retail',now).length,0,JSON.stringify(change));
 }
 for(const change of [{historyAllowed:false},{historyPermission:''},{rights:'pending'},{url:'http://history-fixture.invalid/test'},{checkedAt:'2999-01-01T00:00:00Z'}])assert.equal(historySeries({...record,sources:record.sources.map(s=>({...s,...change}))},'IN','official_retail',now).length,0);
 assert.equal(historySeries({...record,demo:true},'IN','official_retail',now).length,0);
 assert.equal(historySeries({...record,status:'draft'},'IN','official_retail',now).length,0);
});

test('series keep tax, retail basis, currency, scope, source, provider assumptions and offer identities separate',()=>{
 const w=historyFixture(),first=w.prices[0];
 for(const change of [{condition:'Excellent'},{boxPapers:'Watch only'},{sellerType:'authorised_retailer'},{taxStatus:'Tax excluded'},{retailBasis:'Other basis'}])assert.equal(historySeries({...w,prices:[...w.prices,{...first,id:'different',...change}]},'IN','official_retail',now).length,2);
 const global=w.prices.map(p=>({...p,country:'GLOBAL',currency:'USD',type:'provider_estimate',provider:'Synthetic provider',assumptions:'Synthetic sample A'}));
 for(const change of [{currency:'CHF'},{provider:'Other synthetic provider'},{assumptions:'Synthetic sample B'}])assert.equal(historySeries({...w,prices:[...global,{...global[0],id:'different',...change}]},'GLOBAL','provider_estimate',now).length,2);
 const asking=w.prices.map(p=>({...p,type:'dealer_asking',listingKey:'synthetic-offer-a'}));assert.equal(historySeries({...w,prices:[...asking,{...asking[0],id:'different',listingKey:'synthetic-offer-b'}]},'IN','dealer_asking',now).length,2);
 const sales=w.prices.map(p=>({...p,type:'verified_sale',saleEvidence:'Synthetic receipt',feeBasis:'Premium included'}));assert.equal(historySeries({...w,prices:[...sales,{...sales[0],id:'different',feeBasis:'Premium excluded'}]},'IN','verified_sale',now).length,2);
 assert.equal(historySeries({...w,prices:global},'IN','provider_estimate',now).length,0);
 const secondSource={...w.sources[0],id:'synthetic-source-b'};assert.equal(historySeries({...w,sources:[...w.sources,secondSource],prices:[...w.prices,{...first,id:'different',sourceId:secondSource.id}]},'IN','official_retail',now).length,2);
});

test('repeat checks cannot create history and conflicting amounts at one instant are withheld',()=>{
 const w=historyFixture(),first=w.prices[0],before=JSON.stringify(w);
 const duplicate={...first,id:'duplicate',observedAt:'2026-10-11T03:00:00+05:30',checkedAt:'2026-10-16T11:00:00Z'};
 const one=historySeries({...w,prices:[first,duplicate]},'IN','official_retail',now)[0];assert.equal(one.rows.length,1);assert.equal(one.available,false);assert.equal(one.duplicates,1);assert.equal(one.rows[0].id,'duplicate');assert.equal(one.rows[0].checkedAt,duplicate.checkedAt);
 const conflict={...first,id:'conflict',amountMinor:first.amountMinor+1};const g=historySeries({...w,prices:[...w.prices,conflict]},'IN','official_retail',now)[0];assert.equal(g.conflicts,1);assert.equal(g.rows.length,2);assert.equal(g.available,true);assert.ok(!g.rows.some(p=>p.id===first.id||p.id==='conflict'));
 assert.equal(JSON.stringify(w),before);
});

test('protected imports require explicit history approval without changing ordinary price publication',()=>{
 const w=historyFixture();assert.doesNotThrow(()=>validateRecord(w));
 for(const change of [{historyAllowed:'yes'},{historyAllowed:true,historyPermission:''},{historyAllowed:true,rights:'pending'}])assert.throws(()=>validateRecord({...w,sources:w.sources.map(s=>({...s,...change}))}));
 for(const change of [{historyEligible:'yes'},{historyEligible:true,taxStatus:'Unknown'},{historyEligible:true,retrievalMethod:'cached_web_research'}])assert.throws(()=>validateRecord({...w,prices:w.prices.map(p=>({...p,...change}))}));
 assert.doesNotThrow(()=>validateRecord({...w,prices:w.prices.map(p=>({...p,historyEligible:undefined,taxStatus:'Tax status not confirmed'})),sources:w.sources.map(({historyAllowed,historyPermission,...s})=>s)}));
 const sale={...w.prices[0],type:'verified_sale',saleEvidence:'Synthetic sale evidence'};assert.throws(()=>validateRecord({...w,prices:[sale]}),/fee basis/);
 assert.throws(()=>validateRecord({...w,prices:[{...sale,feeBasis:'Premium included',saleEvidence:{unreviewed:true}}]}),/completed transaction evidence/);
 const ask={...w.prices[0],type:'dealer_purchase'};assert.throws(()=>validateRecord({...w,prices:[ask]}),/offer identity/);
});

test('history API returns one original series, rejects invalid selectors and exposes no arbitrary payload fields',()=>{
 const w=historyFixture();w.prices[0].privateNote='must not leave test boundary';w.sources[0].internalContact='must not leave test boundary';
 const result=historyResponse(w,new URLSearchParams('market=IN&type=official_retail'),now);assert.equal(result.status,200);assert.equal(result.body.status,'available');assert.equal(result.body.observations.length,3);assert.ok(!JSON.stringify(result).includes('must not leave'));assert.ok(!JSON.stringify(result.body.series).includes('historyPermission'));
 for(const query of ['market=US','type=sold','market=IN&market=AE','unknown=x','series=','series='+encodeURIComponent('x'.repeat(20001))])assert.equal(historyResponse(w,new URLSearchParams(query),now).status,400);
 assert.equal(historyResponse(w,new URLSearchParams('series=absent'),now).status,404);
 const select=new URLSearchParams({market:'IN',type:'official_retail',series:result.body.selectedSeries});assert.equal(historyResponse(w,select,now).body.observations.length,3);
 const one=historyResponse({...w,prices:[w.prices[0]]},new URLSearchParams(),now);assert.equal(one.body.status,'unavailable');assert.deepEqual(one.body.observations,[]);
 for(const watch of researchWatches)for(const market of ['IN','AE','GLOBAL'])assert.equal(historyResponse(watch,new URLSearchParams({market}),now).body.status,'unavailable');
});

test('history API route uses the shared policy with strict paths and sanitized service errors',async()=>{
 const bundled=await build({entryPoints:['app/api/[...path]/route.ts'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'history-route-fixtures',setup(b){b.onResolve({filter:/lib\/catalogue$/},()=>({path:'catalogue',namespace:'fixture'}));b.onResolve({filter:/lib\/editorial$/},()=>({path:'editorial',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='catalogue'?'export async function catalogue(){if(globalThis.historyApiFailure)throw Error("SECRET database details");return [globalThis.historyApiFixture]}; export function settings(){return {demo:false}}':'export async function editorialApi(){throw Error("not used")}',loader:'js'}));}}]});
 const {GET}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));globalThis.historyApiFixture=historyFixture();
 const call=async(path,query='')=>GET(new Request('https://test.invalid/api/'+path.join('/')+'?'+query),{params:Promise.resolve({path})});
 const good=await call(['watches','synthetic-history-qa','history'],'market=IN');assert.equal(good.status,200);assert.equal(good.headers.get('cache-control'),'no-store');assert.equal((await good.json()).data.observations.length,3);
 assert.equal((await call(['watches','missing','history'])).status,404);assert.equal((await call(['watches','synthetic-history-qa','history','extra'])).status,404);assert.equal((await call(['watches','synthetic-history-qa','unknown'])).status,404);assert.equal((await call(['watches','synthetic-history-qa','history'],'market=US')).status,400);
 globalThis.historyApiFailure=true;const fail=await call(['watches','synthetic-history-qa','history']);assert.equal(fail.status,503);assert.ok(!(await fail.text()).includes('SECRET'));delete globalThis.historyApiFailure;delete globalThis.historyApiFixture;
});

test('rendered chart and table retain minor units, explicit IST dates, source checks and a flat-value domain',async()=>{
 const bundled=await build({entryPoints:['app/history-series-view.tsx'],bundle:true,write:false,platform:'node',format:'esm',jsx:'automatic'});const {default:View}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 const w=historyFixture(),g=historySeries(w,'IN','official_retail',now)[0],html=renderToStaticMarkup(createElement(View,{series:g,typeLabel:'Official retail'}));assert.equal((html.match(/<circle /g)||[]).length,3);assert.match(html,/10,000\.25/);assert.match(html,/Source checked/);assert.match(html,/Observation evidence/);assert.match(html,/scope="col"/);assert.match(html,/11 Oct 2026, 03:00:00 IST/);assert.match(html,/no connecting line/i);
 assert.match(historyDate('2026-10-10T21:30:00Z'),/11 Oct 2026, 03:00:00 IST/);assert.match(historyMoney(10025,'AED'),/100\.25/);
 const flat=historySeries({...w,prices:w.prices.map(p=>({...p,amountMinor:10025}))},'IN','official_retail',now)[0];const rendered=renderToStaticMarkup(createElement(View,{series:flat,typeLabel:'Official retail'}));assert.ok(!/NaN|Infinity/.test(rendered));assert.equal((rendered.match(/cy="145"/g)||[]).length,3);
});
