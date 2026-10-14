import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const assets=[
 {id:'omega-moonwatch-31130423001005',title:'File:Moonwatch (24023224706).jpg',reference:'311.30.42.30.01.005'},
 {id:'tudor-black-bay-54',title:'File:Tudor Black Bay 54 ref. m79000n-0001.jpg',reference:'M79000N-0001'},
 {id:'omega-moonwatch-classic',title:'File:Classic Speedy (24067321725).jpg',reference:'311.30.42.30.01.005'},
 {id:'rolex-oyster-perpetual-med-blue',title:'File:Quadrante Med Blue del Rolex Oyster Perpetual ref. 126000.jpg',reference:'126000'},
 {id:'omega-planet-ocean-black',title:'File:Omega Seamaster Planet Ocean (Referenz 215.30.44.21.01.001).jpg',reference:'215.30.44.21.01.001'},
];
const strip=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim();
const registry=[];
await mkdir('public/watch-photos/originals',{recursive:true});await mkdir('docs/source-evidence',{recursive:true});
for(const a of assets){
 const evidencePath=`docs/source-evidence/${a.id}.json`,originalPath=`public/watch-photos/originals/${a.id}.jpg`;
 let info,checkedAt;
 if(existsSync(evidencePath)){const cached=JSON.parse(await readFile(evidencePath,'utf8'));info=cached.metadata;checkedAt=cached.checkedAt;}
 else{
 const u=new URL('https://commons.wikimedia.org/w/api.php');u.search=new URLSearchParams({action:'query',format:'json',titles:a.title,prop:'imageinfo',iiprop:'url|extmetadata|sha1|size'});
 const res=await fetch(u,{headers:{'User-Agent':'LuxuryWatchExplorer/0.2 (licensed catalogue asset research)'},signal:AbortSignal.timeout(30000)});if(!res.ok)throw new Error('Commons metadata request failed '+res.status);
 const payload=await res.json();info=Object.values(payload.query.pages)[0].imageinfo?.[0];if(!info)throw new Error('Image metadata missing');checkedAt=new Date().toISOString();
 await writeFile(evidencePath,JSON.stringify({file:a.title,metadata:info,checkedAt},null,2));}
 const m=info.extmetadata,license=strip(m.LicenseShortName?.value),licenseUrl=strip(m.LicenseUrl?.value);
 if(!['CC BY 2.0','CC BY 3.0','CC BY-SA 4.0','Public domain'].includes(license))throw new Error('Licence requires separate review: '+license);
 const original=new URL(info.url);if(original.hostname!=='upload.wikimedia.org')throw new Error('Unexpected asset host');
 let bytes;
 if(existsSync(originalPath))bytes=await readFile(originalPath);
 else{const download=await fetch(original,{headers:{'User-Agent':'LuxuryWatchExplorer/0.2'},signal:AbortSignal.timeout(30000)});if(!download.ok||!download.headers.get('content-type')?.startsWith('image/')){console.warn(a.id+' skipped: download status '+download.status);continue;}bytes=Buffer.from(await download.arrayBuffer());if(bytes.length>12_000_000)throw new Error('Image exceeds size limit');await writeFile(originalPath,bytes);}
 const full=await sharp(bytes).rotate().resize({width:1200,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
 const thumb=await sharp(bytes).rotate().resize({width:500,height:600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();
 await writeFile(`public/watch-photos/${a.id}.webp`,full);await writeFile(`public/watch-photos/${a.id}-small.webp`,thumb);
 const dimensions=await sharp(full).metadata();
 registry.push({...a,url:`/watch-photos/${a.id}.webp`,thumbnail:`/watch-photos/${a.id}-small.webp`,originalUrl:`/watch-photos/originals/${a.id}.jpg`,sourceUrl:info.descriptionurl,downloadUrl:info.url,holder:strip(m.Artist?.value),license,licenseUrl:licenseUrl||'https://commons.wikimedia.org/wiki/Commons:Public_domain',description:strip(m.ImageDescription?.value),changes:'Resized and converted to WebP; no recolouring, retouching or configuration changes.',width:dimensions.width,height:dimensions.height,checkedAt,sha256:createHash('sha256').update(bytes).digest('hex'),rights:'approved',matchStatus:'pending_visual_review'});
 console.log(a.id+' · '+license+' · '+strip(m.Artist?.value));
}
await writeFile('lib/image-registry.json',JSON.stringify(registry,null,2)+'\n');
