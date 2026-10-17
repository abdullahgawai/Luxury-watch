export function assetKind(path){
 if(typeof path!=='string'||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error('Invalid public asset path');
 if(/\.(?:js|mjs|cjs)$/i.test(path))return 'javascript';
 if(/\.css$/i.test(path))return 'css';
 if(path.startsWith('watch-photos/')&&!path.startsWith('watch-photos/originals/')&&/\.(webp|avif|png|jpe?g|gif|svg)$/i.test(path))return 'photo';
 return null;
}
export function assetBudgetReport(rows,limits){
 const keys=['javascriptTotalGzip','javascriptFileGzip','cssTotalGzip','displayPhotoBytes'];
 if(!limits||keys.some(k=>!Number.isSafeInteger(limits[k])||limits[k]<=0)||Object.keys(limits).some(k=>!keys.includes(k)))throw new Error('Invalid asset budget configuration');
 const seen=new Set(),groups={javascript:[],css:[],photo:[]};
 for(const row of rows){
  const kind=assetKind(row.path);if(!kind)continue;
  if(seen.has(row.path)||!Number.isSafeInteger(row.bytes)||row.bytes<0||!Number.isSafeInteger(row.gzip)||row.gzip<0)throw new Error('Invalid public asset measurements');
  seen.add(row.path);groups[kind].push(row);
 }
 if(!groups.javascript.length||!groups.css.length)throw new Error('Missing built JavaScript or CSS; asset check is incomplete');
 const total=kind=>groups[kind].reduce((sum,row)=>sum+row.gzip,0),violations=[];
 if(total('javascript')>limits.javascriptTotalGzip)violations.push({kind:'javascript_total_gzip',actual:total('javascript'),limit:limits.javascriptTotalGzip});
 if(total('css')>limits.cssTotalGzip)violations.push({kind:'css_total_gzip',actual:total('css'),limit:limits.cssTotalGzip});
 for(const row of groups.javascript)if(row.gzip>limits.javascriptFileGzip)violations.push({kind:'javascript_file_gzip',path:row.path,actual:row.gzip,limit:limits.javascriptFileGzip});
 for(const row of groups.photo)if(row.bytes>limits.displayPhotoBytes)violations.push({kind:'display_photo_bytes',path:row.path,actual:row.bytes,limit:limits.displayPhotoBytes});
 return {passed:!violations.length,measurements:{javascriptFiles:groups.javascript.length,javascriptTotalGzip:total('javascript'),largestJavascriptGzip:Math.max(...groups.javascript.map(r=>r.gzip)),cssFiles:groups.css.length,cssTotalGzip:total('css'),displayPhotos:groups.photo.length,largestDisplayPhotoBytes:Math.max(0,...groups.photo.map(r=>r.bytes))},limits,violations};
}
