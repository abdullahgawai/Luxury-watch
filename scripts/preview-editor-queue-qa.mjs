// Loopback-only synthetic editor UI. No host identity, database, credentials or forwarding.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
const directory=resolve('.sites-runtime/editor-queue-qa');await mkdir(directory,{recursive:true});const entry=resolve(directory,'entry.jsx');
await writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '../../app/editorial-workspace';createRoot(document.getElementById('qa')).render(<main className="section"><p className="demo-banner">SYNTHETIC EDITOR QUEUE — LOOPBACK QA ONLY — NO HOSTED ACCESS</p><h1>Editorial recovery test</h1><Workspace/></main>);`);
await build({entryPoints:[entry],outfile:resolve(directory,'qa.js'),bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const cssDirectory=resolve('dist/client/_next/static/css');const css=(await Promise.all((await readdir(cssDirectory)).filter(n=>n.endsWith('.css')).map(n=>readFile(resolve(cssDirectory,n),'utf8')))).join('\n'),js=await readFile(resolve(directory,'qa.js'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local editor queue simulation</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa"></div><script type="module" src="/qa.js"></script></body></html>';
let recordReads=0;const envelope=rows=>({rows,hasMore:false,nextCursor:null,pageSize:25});
createServer((req,res)=>{const path=new URL(req.url,'http://127.0.0.1').pathname;let body;
 if(path.startsWith('/api/')&&req.method!=='GET'){res.writeHead(403,{'Content-Type':'application/json'});res.end('{"error":"Mutations are disabled in the local simulation"}');return;}
 if(path==='/api/admin')body={userId:'local-simulation-editor'};
 else if(path==='/api/admin/queues/records'){recordReads++;body=recordReads===1?{rows:'malformed'}:envelope([{id:'synthetic-unreadable',brand:'Synthetic record',reference:'QA-UNREADABLE',payload:'{broken',state:'draft',revision:1,updated_at:'2026-10-17T00:00:00Z'}]);}
 else if(path==='/api/admin/queues/audit')body=envelope([{id:'synthetic-audit',actor:'local-simulation-editor',entity_id:'synthetic-unreadable',action:'synthetic recovery test',old_value:null,new_value:'{broken',at:'2026-10-17T00:00:00Z'}]);
 else if(path==='/api/admin/queues/corrections'||path.startsWith('/api/admin/revisions/'))body=envelope([]);
 else if(path.startsWith('/api/')){res.writeHead(403,{'Content-Type':'application/json'});res.end('{"error":"Not available in the local simulation"}');return;}
 if(body){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));return;}
 const content=path==='/qa.css'?['text/css',css]:path==='/qa.js'?['text/javascript',js]:['text/html',html];res.writeHead(200,{'Content-Type':content[0],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(content[1]);
}).listen(8797,'127.0.0.1',()=>console.log('Synthetic editor queue only: http://127.0.0.1:8797'));
