// Labelled loopback-only session simulation. No identity forwarding, database or provider.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';import {resolve} from 'node:path';import {createServer} from 'node:http';import {build} from 'esbuild';
const directory=resolve('.sites-runtime/editor-session-qa');await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.jsx');
await writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '../../app/editorial-workspace';createRoot(document.getElementById('qa')).render(<main className="section"><p className="demo-banner">SYNTHETIC SESSION — LOCAL QA ONLY — NO HOSTED ACCESS</p><h1>Editorial access recovery</h1><Workspace/></main>);`);
await build({entryPoints:[entry],outfile:resolve(directory,'qa.js'),bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const cssDirectory=resolve('dist/client/_next/static/css');const css=(await Promise.all((await readdir(cssDirectory)).filter(n=>n.endsWith('.css')).map(n=>readFile(resolve(cssDirectory,n),'utf8')))).join('\n'),js=await readFile(resolve(directory,'qa.js'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local editor session simulation</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa"></div><script type="module" src="/qa.js"></script></body></html>';
let access=0,evaluations=0;
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;const send=(body,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(JSON.stringify(body));};
 if(req.method==='GET'&&path==='/api/admin'){access++;send(access===1?{userId:{unverified:'PRIVATE_QA_SENTINEL'}}:{userId:'local-synthetic-editor'});return;}
 if(req.method==='GET'&&path.startsWith('/api/admin/queues/')){send({rows:[],hasMore:false,nextCursor:null,pageSize:25});return;}
 if(req.method==='POST'&&path==='/api/admin/provider'){
  let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>1000){send({},413);return;}}
  evaluations++;if(evaluations===1){send({status:'not_configured',private:'PRIVATE_QA_SENTINEL'});return;}
  if(evaluations===2){send({status:'needs_review',candidates:'PRIVATE_QA_SENTINEL'});return;}
  if(evaluations===3){send({error:'PRIVATE_QA_SENTINEL'},429);return;}
  send({status:'no_matches',candidates:[],examined:0,rejectedCandidates:0,truncated:false,quota:null});return;
 }
 if(path.startsWith('/api/')){send({error:'Not available in this simulation'},403);return;}
 const content=path==='/'?['text/html',html]:path==='/qa.css'?['text/css',css]:path==='/qa.js'?['text/javascript',js]:null;
 if(!content){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':content[0],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(content[1]);
}).listen(8797,'127.0.0.1',()=>console.log('Synthetic editor session only: http://127.0.0.1:8797'));
