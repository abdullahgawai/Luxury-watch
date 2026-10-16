'use client';
import {useEffect,useId,useRef,useState} from 'react';
import type {Watch} from '../lib/catalogue';
import {searchSuggestions} from '../lib/watch-search.mjs';
import {marketHref} from '../lib/device-preferences.mjs';

export default function WatchSearchInput({id,watches,market,value,onChange,label='Search brand, model, reference or nickname'}:{id:string,watches:Watch[],market:string,value?:string,onChange?:(value:string)=>void,label?:string}){
 const [local,setLocal]=useState(''),[open,setOpen]=useState(false),[active,setActive]=useState<string|null>(null),uid=useId(),input=useRef<HTMLInputElement>(null);
 const query=value??local,suggestions=searchSuggestions(watches,query),expanded=open&&!!query.trim(),index=suggestions.findIndex(w=>w.id===active),listId=uid+'-suggestions';
 const optionId=(i:number)=>uid+'-option-'+i;
 const href=(w:Watch)=>marketHref(`/watches/${w.brand.toLowerCase()}/${w.reference.toLowerCase()}/${w.id}`,market);
 useEffect(()=>{
  // Preserve native text entered after SSR but before React attached its handlers.
  const typed=input.current?.value;
  if(typed!==undefined&&typed!==query){setLocal(typed);onChange?.(typed);setOpen(document.activeElement===input.current);}
 },[]);
 useEffect(()=>{if(expanded&&index>=0)document.getElementById(optionId(index))?.scrollIntoView({block:'nearest'});},[active]);
 function change(next:string){setLocal(next);onChange?.(next);setActive(null);setOpen(true);}
 return <div className="watch-search-control" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget)){setOpen(false);setActive(null);}}}>
  <label className="sr-only" htmlFor={id}>{label}</label>
  <input ref={input} id={id} name="q" value={query} onChange={event=>change(event.target.value)} onFocus={()=>setOpen(true)} role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded?listId:undefined} aria-activedescendant={expanded&&index>=0?optionId(index):undefined} aria-describedby={uid+'-help'} autoComplete="off" maxLength={100} placeholder="Brand, model, reference or nickname" onKeyDown={event=>{
   if(event.nativeEvent.isComposing)return;
   if(event.key==='Escape'){event.preventDefault();setOpen(false);setActive(null);}
   if((event.key==='ArrowDown'||event.key==='ArrowUp')&&suggestions.length){event.preventDefault();const next=!expanded||index<0?(event.key==='ArrowDown'?0:suggestions.length-1):(index+(event.key==='ArrowDown'?1:-1)+suggestions.length)%suggestions.length;setOpen(true);setActive(suggestions[next].id);}
   if(event.key==='Enter'&&expanded&&index>=0){event.preventDefault();window.location.assign(href(suggestions[index]));}
  }}/>
  <span id={uid+'-help'} className="sr-only">Type to search. Use up and down arrows for configuration suggestions, Enter to open one, or Escape to close. Enter without a selection searches the catalogue.</span>
  {expanded&&<div className="search-suggestions"><p className="search-suggestion-heading">Exact configurations</p><ul id={listId} role="listbox" aria-label="Watch configuration suggestions">{suggestions.map((w,i)=><li key={w.id} role="none"><a id={optionId(i)} role="option" aria-selected={index===i} tabIndex={-1} href={href(w)} onPointerDown={event=>event.preventDefault()}><span className="suggestion-model">{w.brand} · {w.model}</span><span className="suggestion-reference">Ref. {w.reference}</span><span className="suggestion-configuration">{w.dial||'Dial unavailable'} · {w.bracelet||'Bracelet unavailable'} · {w.material||'Material unavailable'} · {w.size===null?'Size unavailable':w.size+' mm'}</span></a></li>)}</ul><p className="search-suggestion-note" role="status">{suggestions.length?`${suggestions.length} suggestions. Search to see all matches.`:'No matching configurations. Try a brand, reference or recognised nickname.'}</p></div>}
 </div>;
}
