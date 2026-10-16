'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {Search,SlidersHorizontal,X} from 'lucide-react';
import type {Watch} from '../lib/catalogue';
import {searchWatches} from '../lib/domain.mjs';
import WatchSearchInput from './watch-search-input';
import {catalogueResults,catalogueHref} from '../lib/catalogue-results.mjs';
const filterLabels:Record<string,string>={brand:'Brand',size:'Case size · mm',material:'Case material',movement:'Movement',collection:'Editorial collection',maxPrice:'Official retail maximum'};
const filterKeys=[...Object.keys(filterLabels),'sort'];
export default function Catalogue({watches,market,page,card,initialQuery={}}:{watches:Watch[],market:string,page:string,card:(w:Watch)=>React.ReactNode,initialQuery?:Record<string,string>}){
 const [q,setQ]=useState(initialQuery.q||''),[filters,setFilters]=useState<Record<string,string>>(()=>Object.fromEntries(filterKeys.map(k=>[k,initialQuery[k]||'']))),[show,setShow]=useState(false),[ready,setReady]=useState(false);
 const drawer=useRef<HTMLDialogElement>(null),desktop=useRef<HTMLDivElement>(null),drawerId=useId(),headingId=useId();
 const brand=page.startsWith('/brands/')?watches.find(w=>w.brand.toLowerCase()===page.split('/')[2])?.brand:null;
 const currency=market==='IN'?'INR':'AED';
 const [resultPage,setResultPage]=useState(initialQuery.page||'1');
 const previousMarket=useRef(market);
 useEffect(()=>{if(previousMarket.current!==market){previousMarket.current=market;setResultPage('1');history.replaceState(null,'',catalogueHref(page,{...filters,q,market}));}},[market]);
 useEffect(()=>{setReady(true);const mobile=window.matchMedia('(max-width:640px)');function resized(){if(!mobile.matches&&drawer.current?.open){drawer.current.close();desktop.current?.querySelector('select')?.focus();}}mobile.addEventListener('change',resized);return()=>mobile.removeEventListener('change',resized);},[]);
 useEffect(()=>{if(!show)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[show]);
 function sync(search:string,f:Record<string,string>){setResultPage('1');history.replaceState(null,'',catalogueHref(page,{...f,q:search,market}));}
 function update(k:string,v:string){const next={...filters,[k]:v};setFilters(next);sync(q,next);}
 function clear(){setQ('');setFilters({});sync('',{});}
 const prices=watches.flatMap(w=>w.prices),query={...filters,q,market,brand:brand||filters.brand},results=catalogueResults(watches,query,resultPage);
 const pageLink=(number:number)=>catalogueHref(page,query,number)+'#catalogue-results';
 const active=Object.entries(filters).filter(([k,v])=>v&&k!=='sort'&&(!brand||k!=='brand'));
 function fields(){return <>
  {['brand','size','material','movement'].map(key=><label key={key}>{filterLabels[key]}<select disabled={!ready||!!(brand&&key==='brand')} value={brand&&key==='brand'?brand:filters[key]||''} onChange={e=>update(key,e.target.value)}><option value="">All</option>{[...new Set(watches.map(w=>(w as any)[key]).filter(x=>x!==null&&x!==undefined))].map(v=><option key={String(v)} value={String(v)}>{String(v)}</option>)}</select></label>)}
  {brand&&<p className="small">Browsing {brand}. <a href={'/watches?market='+market}>Explore all brands</a></p>}
  <label>Editorial collection<select disabled={!ready} value={filters.collection||''} onChange={e=>update('collection',e.target.value)}><option value="">All</option><option>Everyday</option><option>Dress</option></select></label>
  <label>Official retail maximum · {currency}<input disabled={!ready} type="number" min="1" step="1" value={filters.maxPrice||''} onChange={e=>update('maxPrice',e.target.value)} placeholder="No limit"/></label>
  <p className="small">Only sourced local retail qualifies. Missing prices are excluded when filtering.</p>
  <button disabled={!ready} className="text-link" onClick={clear}>Clear all <X size={15}/></button>
 </>;}
 return <>
  <form className="catalogue-search" onSubmit={e=>{e.preventDefault();sync(q,filters);}}><Search size={20}/><WatchSearchInput id="catalogue-query" watches={searchWatches(watches,{...filters,market,brand:brand||filters.brand},prices,1000)} market={market} value={q} onChange={value=>{setQ(value);sync(value,filters);}} label="Search watches"/><button>Search</button></form>
  <div className="catalogue-layout">
   <aside className="filter-rail" aria-label="Watch filters">
    <button disabled={!ready} className="filter-toggle" aria-haspopup="dialog" aria-controls={drawerId} aria-expanded={show} onClick={()=>{drawer.current?.showModal();setShow(true);}}><SlidersHorizontal size={18}/>Filter watches{active.length>0?` (${active.length})`:''}</button>
    <div className="filters desktop-filters" ref={desktop}><h2>Refine your selection</h2>{fields()}</div>
   </aside>
   <div id="catalogue-results" tabIndex={-1}><div className="results-head"><p role="status">{results.total} exact configurations{results.total>0&&<span className="small block">Showing {results.from}–{results.to} · Page {results.page} of {results.totalPages}</span>}</p><label>Sort<select disabled={!ready} value={filters.sort||''} onChange={e=>update('sort',e.target.value)}><option value="">Relevance</option><option value="name">Model name</option><option value="price">Local official retail ↑</option></select></label></div>
    {(q||active.length>0)&&<div className="filter-chips" aria-label="Active filters">{q&&<button aria-label={'Remove search: '+q} onClick={()=>{setQ('');sync('',filters);}}>Search: {q}<X size={12}/></button>}{active.map(([key,value])=><button key={key} aria-label={`Remove ${filterLabels[key]}: ${value}${key==='maxPrice'?' '+currency:''}`} onClick={()=>update(key,'')}>{filterLabels[key]}: {value}{key==='maxPrice'?' '+currency:''}<X size={12}/></button>)}</div>}
    <div className="watch-grid catalogue-grid">{results.rows.map(card)}</div>{results.totalPages>1&&<nav className="catalogue-pagination" aria-label="Catalogue result pages">{results.page>1&&<a className="button secondary" href={pageLink(results.page-1)} rel="prev">Previous page</a>}<span>Page {results.page} of {results.totalPages}</span>{results.page<results.totalPages&&<a className="button" href={pageLink(results.page+1)} rel="next">Next page</a>}</nav>}{!results.total&&<div className="empty"><h2>No matching configurations.</h2><p>Try another reference or clear filters. Retail filtering excludes unavailable prices.</p><button onClick={clear}>Clear search & filters</button></div>}
   </div>
  </div>
  <dialog id={drawerId} ref={drawer} className="catalogue-filter-dialog" aria-labelledby={headingId} onClose={()=>setShow(false)} onKeyDown={event=>{
   if(event.key!=='Tab')return;
   const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),input:not([disabled]),a[href]')).filter(control=>control.getClientRects().length>0);
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===event.currentTarget)){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===event.currentTarget)){event.preventDefault();first?.focus();}
  }}>
   <div className="filter-drawer-head"><h2 id={headingId}>Filter watches</h2><button autoFocus aria-label="Close watch filters" onClick={()=>drawer.current?.close()}><X size={20}/></button></div>
   <div className="filters">{fields()}</div>
   <div className="filter-drawer-footer"><p role="status">{results.total} exact configurations</p><button className="button" onClick={()=>drawer.current?.close()}>View results</button></div>
  </dialog>
 </>;
}
