// Local built-Worker verification only. No identity, provider or valid submission.
import assert from 'node:assert/strict';import http from 'node:http';
const origin='http://127.0.0.1:8796';
const mode=process.argv[2]||'all';assert.ok(['all','head','post-extra','post-query','post-admin'].includes(mode),'Choose all, head, post-extra, post-query or post-admin');
function request(path,method='GET'){
 return new Promise((resolve,reject)=>{
  const req=http.request(origin+path,{method,agent:false,headers:{Origin:origin,...(method==='POST'?{'Content-Type':'application/json'}:{})}},res=>{
   let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk;if(body.length>2000000)res.destroy(new Error('Unexpected response size'));});res.on('error',reject);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
  });req.setTimeout(10000,()=>req.destroy(new Error('Local API check timed out')));req.on('error',reject);req.end(method==='POST'?'{}':undefined);
 });
}
const results=[];
for(const path of ['all','head'].includes(mode)?['/api/watches?pageSize=1','/api/watches?unknown=1','/api/admin','/api/corrections','/api/unknown']:[]){
 const get=await request(path),head=await request(path,'HEAD');assert.equal(head.status,get.status);assert.equal(head.body,'');assert.equal(head.headers['cache-control'],'no-store');assert.equal(head.headers['x-robots-tag'],get.headers['x-robots-tag']);assert.equal(head.headers.allow,get.headers.allow);
 if(path==='/api/corrections'){assert.equal(get.status,405);assert.equal(get.headers.allow,'POST');}if(path==='/api/admin')assert.equal(get.status,403);
 results.push({path,headStatus:head.status,headBytes:head.body.length});
}
for(const [path,status,selection] of [['/api/corrections/extra',404,'post-extra'],['/api/corrections?unknown=1',400,'post-query'],['/api/admin/health/extra',403,'post-admin']]){
 if(mode!=='all'&&mode!==selection)continue;
 const response=await request(path,'POST');assert.equal(response.status,status,`${path}: ${response.body.slice(0,200)}`);assert.equal(response.headers['cache-control'],'no-store');results.push({path,postStatus:response.status});
}
console.log(JSON.stringify({passed:true,results}));
