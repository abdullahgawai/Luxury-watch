// Labelled loopback-only long-text fixture. No provider, identity or database access.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
const directory=resolve('.sites-runtime/reflow-qa');await mkdir(directory,{recursive:true});
await writeFile(resolve(directory,'entry.jsx'),`import React from 'react';import{createRoot}from'react-dom/client';import Site from '../../app/site';
const source={id:'qa-source',title:'SyntheticSourceReference'.repeat(4),url:'https://example.invalid/qa',category:'editorial',rights:'pending',permission:'Synthetic QA text; no publication permission implied.',checkedAt:'2026-10-16T12:00:00Z',method:'Synthetic supporting URL: https://example.invalid/evidence/'+ 'ReferenceEvidence'.repeat(12)};
const w={id:'qa-reflow-watch',brand:'Synthetic',model:'SyntheticLongReference'.repeat(4),reference:'QA-REFLOW-ONLY',dial:'Synthetic dial',bracelet:'Synthetic bracelet',material:'Synthetic material',size:null,movement:null,calibre:null,powerReserve:null,waterResistance:null,bezel:null,description:'LOCAL QA ONLY. Synthetic configuration to check long unbroken names and source text. No real watch specifications, prices or photo claims.',aliases:[],collections:[],sources:[source],prices:[],image:null,images:[],evidence:{},demo:true,status:'published'};
createRoot(document.getElementById('qa')).render(<><p className="demo-banner">SYNTHETIC REFLOW TEST — LOCAL ONLY — NO REAL WATCH DATA</p><Site page={location.pathname} watches={[w,{...w,id:'qa-reflow-second',reference:'QA-REFLOW-SECOND'}]} config={{name:'Synthetic Reflow QA',demo:true}} initialQuery={Object.fromEntries(new URLSearchParams(location.search))}/></>);`);
await build({entryPoints:[resolve(directory,'entry.jsx')],outfile:resolve(directory,'qa.js'),bundle:true,platform:'browser',format:'esm',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
const cssDirectory=resolve('dist/client/_next/static/css');
const css=(await Promise.all((await readdir(cssDirectory)).filter(n=>n.endsWith('.css')).map(n=>readFile(resolve(cssDirectory,n),'utf8')))).join('\n'),js=await readFile(resolve(directory,'qa.js'));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic long-text reflow QA</title><link rel="stylesheet" href="/qa.css"></head><body><div id="qa"></div><script type="module" src="/qa.js"></script></body></html>';
createServer((req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;
 if(path.startsWith('/api/')){res.writeHead(403);res.end();return;}
 const [type,body]=path==='/qa.js'?['text/javascript',js]:path==='/qa.css'?['text/css',css]:['text/html',html];
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.end(body);
}).listen(8797,'127.0.0.1',()=>console.log('Synthetic long-text QA: http://127.0.0.1:8797/watches/synthetic/qa-reflow-only/qa-reflow-watch?market=AE#sources'));
