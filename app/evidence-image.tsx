'use client';
import {useEffect,useRef,useState} from 'react';
import type {Photo} from '../lib/catalogue';
import {imageSources} from '../lib/image-delivery.mjs';

type Props={photo:Photo;thumbnail?:boolean;priority?:boolean;reference?:string;onUnavailable?:()=>void};
export default function EvidenceImage(props:Props){
 const sources=imageSources(props.photo,props.thumbnail);
 return <ImageAttempt key={JSON.stringify(sources)} {...props} sources={sources}/>;
}
function ImageAttempt({photo,sources,priority=false,reference,onUnavailable}:Props&{sources:string[]}){
 const [attempt,setAttempt]=useState(0),element=useRef<HTMLImageElement>(null),src=sources[attempt];
 function failed(){setAttempt(current=>current===attempt?current+1:current);}
 useEffect(()=>{
  if(!src){onUnavailable?.();return;}
  // A cached/fast failure can finish before hydration attaches onError.
  if(element.current?.complete&&element.current.naturalWidth===0)failed();
 },[src,attempt]);
 if(!src)return <div className="photograph-unavailable" role="status">{reference&&<span className="reference">{reference}</span>}<strong>Photograph temporarily unavailable</strong><span>The recorded image could not be loaded. Source and licence details are retained.</span></div>;
 return <img key={src} ref={element} src={src} alt={photo.alt} width={photo.width} height={photo.height} loading={priority?'eager':'lazy'} decoding="async" fetchPriority={priority?'high':undefined} onError={failed}/>;
}
