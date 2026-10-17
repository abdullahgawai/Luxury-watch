// Labelled loopback-only correction simulation; no database, identity or forwarding.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';import {resolve} from 'node:path';import {createServer} from 'node:http';import {build} from 'esbuild';
const directory=resolve('.sites-runtime/correction-recovery-qa');await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.jsx');
await writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Correction from '../../app/correction-form';createRoot(document.getElementById('qa')).render(<main className="section prose"><p className="demo-banner">SYNTHETIC RECEIPTS — LOCAL QA ONLY — NO SUBMISSION STORED</p><h1>Correction recovery</h1><Correction/></main>);`);
await build({entryPoints:[entry],outfile:resolve(directory,'qa.js'),bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const cssDirectory=resolve('dist/client/_next/static/css');const css=(await Promise.all((await readdir(cssDirectory)).filter(n=>n.endsWith('.css')).map(n=>readFile(resolve(cssDirectory,n),'utf8')))).join('\n'),js=await readFile(resolve(directory,'qa.js'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local correction recovery simulation</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa"></div><script type="module" src="/qa.js"></script></body></html>';
let submissions=0,firstKey,firstBody;
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;const send=(body,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(JSON.stringify(body));};
 if(req.method==='POST'&&path==='/api/corrections'){
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000){send({},413);return;}}
  submissions++;const key=req.headers['idempotency-key'];
  if(submissions===1){firstKey=key;firstBody=raw;send({fields:{claim:{private:'PRIVATE_QA_SENTINEL'}},error:'PRIVATE_QA_SENTINEL'},400);return;}
  if(key!==firstKey||raw!==firstBody){send({},409);return;}
  if(submissions===2){send({fields:{claim:'PRIVATE_QA_SENTINEL'},error:'PRIVATE_QA_SENTINEL'},400);return;}
  send({id:key},201);return;
 }
 if(path.startsWith('/api/')){send({},403);return;}
 const content=path==='/'?['text/html',html]:path==='/qa.css'?['text/css',css]:path==='/qa.js'?['text/javascript',js]:null;
 if(!content){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':content[0],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(content[1]);
}).listen(8797,'127.0.0.1',()=>console.log('Synthetic correction recovery only: http://127.0.0.1:8797'));
