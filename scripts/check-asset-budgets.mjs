// Build-size regression check, not a network benchmark or field Web Vitals test.
import {readdir,lstat,readFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {gzipSync} from 'node:zlib';
import {assetKind,assetBudgetReport} from '../lib/asset-budgets.mjs';
const root=resolve('dist/client'),rows=[];let visited=0;
async function walk(directory){
 for(const name of await readdir(directory)){
  if(++visited>10000)throw new Error('Asset scan exceeded its bound');
  const path=join(directory,name),info=await lstat(path);
  if(info.isSymbolicLink())throw new Error('Unexpected symbolic link in public assets');
  if(info.isDirectory()){await walk(path);continue;}
  if(!info.isFile())throw new Error('Unexpected public asset entry');
  const key=relative(root,path).replaceAll('\\','/');if(!assetKind(key))continue;
  if(info.size>16*1024*1024)throw new Error('Asset exceeds measurement bound');
  const bytes=await readFile(path);rows.push({path:key,bytes:bytes.length,gzip:gzipSync(bytes,{level:6}).length});
 }
}
try{
 await walk(root);
 const limits=JSON.parse(await readFile(resolve('scripts/release-budgets.json'),'utf8'));
 const report=assetBudgetReport(rows,limits);
 console.log(JSON.stringify({...report,scope:'All emitted client JavaScript/CSS; individual display photos in watch-photos. Original photo downloads and other assets are excluded. Gzip level 6 estimates are not measured network transfers, initial-route costs, LCP, INP or CLS.'}));
 if(!report.passed)process.exitCode=1;
}catch{console.error('Asset budget check could not complete. Verify the build, budget configuration and bounded public assets.');process.exitCode=1;}
