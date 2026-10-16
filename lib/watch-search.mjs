const normalized=value=>String(value??'').normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
const referenceKey=value=>normalized(value).replace(/[\s.\-_/]/g,'');

// Only existing catalogue fields participate. Nicknames come from curated aliases.
export function rankedMatches(watches,value=''){
 const q=normalized(value).slice(0,100),tokens=q.split(' ').filter(Boolean),ref=referenceKey(q);
 if(!q)return [...watches];
 return watches.map((watch,index)=>{
  const reference=normalized(watch.reference),key=referenceKey(watch.reference),aliases=(watch.aliases||[]).map(normalized);
  const fields=[watch.brand,watch.model,watch.reference,...(watch.aliases||[])].map(normalized),text=fields.join(' ');
  const matches=tokens.every(token=>text.includes(token)||(referenceKey(token)&&key.includes(referenceKey(token))));
  // A complete reference outranks a nickname or a model containing those digits.
  const exact=reference===q||key===ref;
  if(!exact&&!matches)return null;
  const rank=exact?0:aliases.includes(q)?1:fields.some(field=>field===q)?2:fields.some(field=>field.startsWith(q))?3:4;
  return {watch,index,rank};
 }).filter(Boolean).sort((a,b)=>a.rank-b.rank||a.index-b.index).map(entry=>entry.watch);
}

export function searchSuggestions(watches,value){
 if(!normalized(value))return [];
 const seen=new Set();
 return rankedMatches(watches,value).filter(watch=>{if(seen.has(watch.id))return false;seen.add(watch.id);return true;}).slice(0,6);
}
