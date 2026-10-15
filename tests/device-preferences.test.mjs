import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectionIds,comparisonSelection,readDevicePreferences,writeDevicePreference,marketHref,comparisonHref} from '../lib/device-preferences.mjs';
const known=['first','second','third','fourth'];
function fixture(initial={}){const data=new Map(Object.entries(initial));return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};}
test('malformed saved data does not prevent market and comparison recovery or rewrite storage',()=>{
 const storage=fixture({'watch-market':'AE','watch-saved':'{broken','watch-compare':'["second","first","second","missing"]'}),before=[...storage.data];
 const result=readDevicePreferences(()=>storage,'',known);assert.equal(result.market,'AE');assert.deepEqual(result.saved,[]);assert.deepEqual(result.compare,['second','first']);assert.deepEqual(result.issues,['watch-saved']);assert.deepEqual([...storage.data],before);
});
test('inaccessible storage preserves explicit UAE/compare URLs and does not report a successful write',()=>{
 const unavailable=()=>{throw new DOMException('Blocked','SecurityError');};
 const result=readDevicePreferences(unavailable,'?market=AE&ids=second,first,second,missing',known);assert.equal(result.market,'AE');assert.deepEqual(result.compare,['second','first']);assert.equal(result.blocked.length,3);assert.equal(writeDevicePreference(unavailable,'watch-saved',['first']),false);
 const full=()=>({getItem:()=>null,setItem(){throw new DOMException('Full','QuotaExceededError');}});assert.equal(writeDevicePreference(full,'watch-compare',['first']),false);
});
test('shared comparison order, explicit empty selection, invalid market and unknown saved IDs are handled independently',()=>{
 const storage=fixture({'watch-market':'AE','watch-saved':'["first","withdrawn","first",null,7]','watch-compare':'["first","second"]'});
 assert.deepEqual(readDevicePreferences(()=>storage,'?market=invalid&ids=',known),{market:'AE',saved:['first','withdrawn'],compare:[],issues:[],blocked:[]});
 assert.deepEqual(comparisonSelection('fourth,third,second,first',known),['fourth','third','second']);assert.deepEqual(selectionIds({}),[]);
 storage.setItem('watch-compare','{}');assert.deepEqual(readDevicePreferences(()=>storage,'?ids=second',known).compare,['second']);
});
test('navigation preserves country, source anchors and explicit comparison state without transferring saved lists',()=>{
 assert.equal(marketHref('/watches?q=Tank#prices','AE'),'/watches?q=Tank&market=AE#prices');
 const link=comparisonHref(['second','first','second'],'AE'),url=new URL(link,'https://test.local');assert.equal(url.searchParams.get('ids'),'second,first');assert.equal(url.searchParams.get('market'),'AE');assert.ok(!url.searchParams.has('saved'));
 assert.equal(new URL(comparisonHref([],'AE'),'https://test.local').searchParams.get('ids'),'');
 for(const path of ['https://evil.test','//evil.test','/\\evil.test'])assert.throws(()=>marketHref(path,'AE'));
 const storage=fixture();assert.equal(writeDevicePreference(()=>storage,'watch-market','AE'),true);assert.equal(storage.getItem('watch-market'),'AE');assert.equal(writeDevicePreference(()=>storage,'watch-saved',['first']),true);assert.equal(storage.getItem('watch-saved'),'["first"]');
});
