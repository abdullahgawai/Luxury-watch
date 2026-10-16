// Loopback-only write-confirmation simulation. No hosted identity, database or forwarding.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';import {resolve} from 'node:path';import {createServer} from 'node:http';import {build} from 'esbuild';
const directory=resolve('.sites-runtime/editor-write-qa');await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.jsx');
await writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '../../app/editorial-workspace';createRoot(document.getElementById('qa')).render(<main className="section"><p className="demo-banner">SYNTHETIC WRITE RECEIPTS — LOCAL QA ONLY — NO HOSTED ACCESS</p><h1>Editorial write recovery</h1><Workspace/></main>);`);
await build({entryPoints:[entry],outfile:resolve(directory,'qa.js'),bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const cssDirectory=resolve('dist/client/_next/static/css');const css=(await Promise.all((await readdir(cssDirectory)).filter(n=>n.endsWith('.css')).map(n=>readFile(resolve(cssDirectory,n),'utf8')))).join('\n'),js=await readFile(resolve(directory,'qa.js'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local editorial write simulation</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa"></div><script type="module" src="/qa.js"></script></body></html>';
let imports=0,firstKey=null,state='review',revision=1;const envelope=rows=>({rows,hasMore:false,nextCursor:null,pageSize:25});
createServer(async(req,res)=>{const path=new URL(req.url,'http://127.0.0.1').pathname;const send=(body,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
 if(req.method==='POST'){
  if(!['/api/admin/imports','/api/admin/records/synthetic-review-record'].includes(path)){send({error:'Not available in this simulation'},403);return;}
  let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000){send({error:'Synthetic request limit'},413);return;}}
  let body;try{body=JSON.parse(raw);}catch{send({error:'Invalid synthetic JSON'},400);return;}
  if(path==='/api/admin/imports'){imports++;if(imports===1){firstKey=req.headers['idempotency-key'];setTimeout(()=>send({}),900);return;}if(imports===2&&req.headers['idempotency-key']!==firstKey){send({error:'Retry key changed'},409);return;}send({id:body.record?.id,state:'draft'},201);return;}
  state=body.action==='publish'?'published':'draft';revision++;send({id:'synthetic-review-record',state,revision});return;
 }
 if(path==='/api/admin'){send({userId:'local-simulation-editor'});return;}
 if(path==='/api/admin/queues/records'){send(envelope([{id:'synthetic-review-record',brand:'Synthetic review',reference:'QA-REVIEW',payload:'{}',state,revision,updated_at:'2026-10-17T00:00:00Z'}]));return;}
 if(path.startsWith('/api/admin/queues/')||path.startsWith('/api/admin/revisions/')){send(envelope([]));return;}
 if(path.startsWith('/api/')){send({error:'Not available in this simulation'},403);return;}
 const content=path==='/qa.css'?['text/css',css]:path==='/qa.js'?['text/javascript',js]:['text/html',html];res.writeHead(200,{'Content-Type':content[0],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(content[1]);
}).listen(8797,'127.0.0.1',()=>console.log('Synthetic editor writes only: http://127.0.0.1:8797'));
