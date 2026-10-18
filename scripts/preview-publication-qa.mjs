// Loopback-only UI QA. No editor identity, production database or real watch data.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {operationalWarnings} from '../lib/operational-warnings.mjs';
const directory=resolve('.sites-runtime/publication-qa');await mkdir(directory,{recursive:true});
const entry=resolve(directory,'entry.jsx');
await writeFile(entry,`import React from 'react';import{createRoot}from'react-dom/client';import OperationalChecks from '../../app/operational-checks';createRoot(document.getElementById('qa')).render(<main className="section prose"><p className="demo-banner">SYNTHETIC QA REPORT — LOCAL COMPONENT TEST ONLY</p><h1>Editorial publication checks</h1><OperationalChecks/></main>);`);
await build({entryPoints:[entry],outfile:resolve(directory,'qa.js'),bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const cssDirectory=resolve('dist/client/_next/static/css');
const css=(await Promise.all((await readdir(cssDirectory)).filter(n=>n.endsWith('.css')).map(n=>readFile(resolve(cssDirectory,n),'utf8')))).join('\n');
const js=await readFile(resolve(directory,'qa.js'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic publication checks QA</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa"></div><script type="module" src="/qa.js"></script></body></html>';
const report={status:'needs_attention',checkedAt:new Date().toISOString(),database:'ok',dataMode:'research',records:{published:4,review:2,draft:1},publication:{checked:4,visible:1,withheld:3,invalidPayloads:1,withheldPrices:1,withheldPhotos:1,truncated:false},corrections:{pending:2},prices:{checked:3,stale:1,invalid:1,truncated:false},provider:{evaluationsLastHour:0},warnings:['Research mode is active; production data publication is not verified.','Published records are withheld by production source, identity or rights checks; review them in the editorial queue.','Published price entries are withheld by public evidence checks; review exact configurations, sources and dates.','Primary photos are withheld by publication checks; review licensing and exact configuration evidence.']};
Object.assign(report.corrections,{oldestPendingAt:null});Object.assign(report.provider,{enabled:false,tokenConfigured:false});report.automation={alerts:'not_configured',hostedRestore:'not_verified'};report.warnings=operationalWarnings(report);
let checks=0;
createServer((req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;
 if(path==='/api/admin/health'){checks++;const failure=checks===3;res.writeHead(failure?503:200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(failure?{error:'PRIVATE_QA_ERROR'}:checks===2?{...report,status:'ok',warnings:[]}:report));return;}
 const response=path==='/'?['text/html',html]:path==='/qa.css'?['text/css',css]:path==='/qa.js'?['text/javascript',js]:null;
 if(!response){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':response[0],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(response[1]);
}).listen(8797,'127.0.0.1',()=>console.log('Synthetic publication component QA only: http://127.0.0.1:8797'));
