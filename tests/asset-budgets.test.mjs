import {test} from 'node:test';import assert from 'node:assert/strict';
import {assetKind,assetBudgetReport} from '../lib/asset-budgets.mjs';
const limits={javascriptTotalGzip:180000,javascriptFileGzip:70000,cssTotalGzip:12000,displayPhotoBytes:250000};
const rows=()=>[{path:'_next/app.js',bytes:150000,gzip:60000},{path:'_next/app.css',bytes:30000,gzip:9000},{path:'watch-photos/exact.webp',bytes:230000,gzip:230100}];
test('asset scope counts display derivatives and excludes optional original downloads',()=>{
 assert.equal(assetKind('_next/chunk.MJS'),'javascript');assert.equal(assetKind('_next/site.CSS'),'css');
 assert.equal(assetKind('watch-photos/exact-small.webp'),'photo');assert.equal(assetKind('watch-photos/originals/exact.jpg'),null);assert.equal(assetKind('readme.txt'),null);
 const data=rows(),copy=structuredClone(data),r=assetBudgetReport(data,limits);assert.equal(r.passed,true);assert.equal(r.measurements.javascriptTotalGzip,60000);assert.equal(r.measurements.largestDisplayPhotoBytes,230000);assert.deepEqual(data,copy);
});
test('each exceeded budget fails, with exact boundary values allowed',()=>{
 const at=rows();at[0].gzip=70000;at[1].gzip=12000;at[2].bytes=250000;assert.equal(assetBudgetReport(at,limits).passed,true);
 for(const [index,field,value,kind] of [[0,'gzip',70001,'javascript_file_gzip'],[1,'gzip',12001,'css_total_gzip'],[2,'bytes',250001,'display_photo_bytes']]){const data=rows();data[index][field]=value;assert.ok(assetBudgetReport(data,limits).violations.some(v=>v.kind===kind));}
 const many=Array.from({length:3},(_,i)=>({path:'chunk-'+i+'.js',bytes:100000,gzip:65000}));assert.ok(assetBudgetReport([...many,rows()[1]],limits).violations.some(v=>v.kind==='javascript_total_gzip'));
});
test('missing build sections and malformed configuration or measurements fail closed',()=>{
 for(const data of [[],[rows()[0]],[rows()[1]], [...rows(),rows()[0]],rows().map(r=>({...r,gzip:NaN}))])assert.throws(()=>assetBudgetReport(data,limits));
 for(const config of [{...limits,cssTotalGzip:0},{...limits,extra:1},{}])assert.throws(()=>assetBudgetReport(rows(),config));
 for(const path of ['../outside.js','/outside.js','a\\b.js','a/../b.css'])assert.throws(()=>assetKind(path));
});
