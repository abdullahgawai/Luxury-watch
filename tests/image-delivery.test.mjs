import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageSources} from '../lib/image-delivery.mjs';
import {licensedPhotos} from '../lib/research-catalogue.mjs';
test('thumbnail recovery uses only the same approved photograph and never a remote original or another configuration',()=>{
 for(const photo of licensedPhotos){assert.deepEqual(imageSources(photo,true),[photo.thumbnail,photo.url].filter((value,index,array)=>value&&array.indexOf(value)===index));assert.deepEqual(imageSources(photo),[photo.url]);assert.ok(!imageSources(photo,true).includes(photo.originalUrl));}
});
test('unapproved, missing, remote and malformed image paths produce no unlicensed fallback request',()=>{
 const photo=licensedPhotos[0];assert.deepEqual(imageSources(null),[]);assert.deepEqual(imageSources({...photo,rights:'pending'},true),[]);assert.deepEqual(imageSources({...photo,matchStatus:'pending'},true),[]);
 for(const url of ['https://external.test/a.jpg','//external.test/a.jpg','/\\external.test/a.jpg','/../private','/%2e%2e/private','/bad%path','/line\nbreak'])assert.deepEqual(imageSources({...photo,url,thumbnail:url},true),[]);
});
test('identical derivatives are attempted once and invalid thumbnails retain the approved full-size path',()=>{
 const photo=licensedPhotos[0];assert.deepEqual(imageSources({...photo,thumbnail:photo.url},true),[photo.url]);assert.deepEqual(imageSources({...photo,thumbnail:'https://external.test/photo.jpg'},true),[photo.url]);assert.deepEqual(imageSources({...photo,url:'/../private',thumbnail:undefined},true),[]);
});
