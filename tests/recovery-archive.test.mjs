import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {sealBackup,openBackup} from '../scripts/recovery-archive.mjs';
test('backup archives authenticate bytes, reject tampering/wrong keys and use fresh nonces',()=>{
 const key=randomBytes(32),data=Buffer.from("Synthetic SQL ' quote; ₹ / العربية"),a=sealBackup(data,key),b=sealBackup(data,key);assert.notDeepEqual(a,b);assert.deepEqual(openBackup(a,key),data);assert.throws(()=>openBackup(a,randomBytes(32)));for(const offset of [0,12,a.length-1]){const bad=Buffer.from(a);bad[offset]^=1;assert.throws(()=>openBackup(bad,key));}assert.throws(()=>openBackup(Buffer.from('short'),key));assert.throws(()=>sealBackup(data,Buffer.alloc(16)));
});
