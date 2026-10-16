function localAsset(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u001f]/.test(value))return false;
 try{return !decodeURIComponent(value).includes('..')&&new URL(value,'https://licensed-image.invalid').origin==='https://licensed-image.invalid';}catch{return false;}
}
export function imageSources(photo,thumbnail=false){
 if(!photo||photo.rights!=='approved'||photo.matchStatus!=='approved')return [];
 // Retry only this exact approved photograph's full-size derivative. Never use another watch.
 return [...new Set((thumbnail?[photo.thumbnail,photo.url]:[photo.url]).filter(localAsset))];
}
