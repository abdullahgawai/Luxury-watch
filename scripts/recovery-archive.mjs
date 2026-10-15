import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
const magic=Buffer.from('LWXBACKUP1\n');
function checkKey(key){if(!Buffer.isBuffer(key)||key.length!==32)throw new Error('A 32-byte backup key is required');}
export function sealBackup(bytes,key){
 checkKey(key);const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(magic);
 const encrypted=Buffer.concat([cipher.update(bytes),cipher.final()]);return Buffer.concat([magic,nonce,cipher.getAuthTag(),encrypted]);
}
export function openBackup(archive,key){
 checkKey(key);if(archive.length<magic.length+28||!archive.subarray(0,magic.length).equals(magic))throw new Error('Invalid backup archive');
 const offset=magic.length,decipher=createDecipheriv('aes-256-gcm',key,archive.subarray(offset,offset+12));decipher.setAAD(magic);decipher.setAuthTag(archive.subarray(offset+12,offset+28));
 return Buffer.concat([decipher.update(archive.subarray(offset+28)),decipher.final()]);
}
