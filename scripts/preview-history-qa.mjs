// Loopback-only component QA. Synthetic prices never enter catalogue or deployment assets.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
const directory=resolve('.sites-runtime/history-qa');await mkdir(directory,{recursive:true});
const entry=resolve(directory,'entry.jsx');
await writeFile(entry,`import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{History}from'../../app/watch-components';import{historyFixture}from'../../tests/fixtures/history.mjs';
const record=historyFixture();record.prices.push(...record.prices.map(p=>({...p,id:p.id+'-tax',taxStatus:'Tax excluded',amountMinor:p.amountMinor+50000})),...record.prices.map(p=>({...p,id:p.id+'-global',type:'provider_estimate',country:'GLOBAL',currency:'USD',provider:'Synthetic test provider',assumptions:'Synthetic test series, no market quote'})));record.prices.push({...record.prices[0],id:'repeat-check'}, {...record.prices[1],id:'conflicting-check',amountMinor:1});
function Qa(){const[market,setMarket]=useState('IN');return <main className="section prose"><p className="demo-banner">SYNTHETIC QA DATA — NOT WATCH PRICES — LOCAL COMPONENT TEST ONLY</p><h1>Historical evidence test</h1><label>QA local market<select value={market}onChange={e=>setMarket(e.target.value)}><option value="IN">India</option><option value="AE">UAE</option></select></label><History w={record}market={market}/></main>}createRoot(document.getElementById('qa')).render(<Qa/>);`);
await build({entryPoints:[entry],outfile:resolve(directory,'qa.js'),bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const cssDirectory=resolve('dist/client/_next/static/css'),cssFiles=(await readdir(cssDirectory)).filter(name=>name.endsWith('.css'));
const css=(await Promise.all(cssFiles.map(name=>readFile(resolve(cssDirectory,name),'utf8')))).join('\n');
const js=await readFile(resolve(directory,'qa.js'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic history component QA</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa"></div><script type="module" src="/qa.js"></script></body></html>';
createServer((req,res)=>{const path=new URL(req.url,'http://127.0.0.1').pathname;const response=path==='/'?['text/html',html]:path==='/qa.css'?['text/css',css]:path==='/qa.js'?['text/javascript',js]:null;if(!response){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':response[0],'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(response[1]);}).listen(8793,'127.0.0.1',()=>console.log('Synthetic component QA only: http://127.0.0.1:8793'));
