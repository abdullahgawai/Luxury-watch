'use client';
import {useEffect,useRef,useState} from 'react';
import {validateCorrection} from '../lib/correction-input.mjs';
import type {CorrectionValues} from '../lib/correction-input.mjs';

type Errors=Partial<Record<keyof CorrectionValues|'form',string>>;
const labels={page:'Page path',field:'Field or issue',claim:'Correction & supporting source',contact:'Email',form:'Submission'};
export default function CorrectionForm(){
 const [target,setTarget]=useState('/'),[errors,setErrors]=useState<Errors>({}),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);
 const attempt=useRef<{key:string;signature:string}|null>(null),controller=useRef<AbortController|null>(null),submitting=useRef(false);
 useEffect(()=>{setTarget(new URLSearchParams(location.search).get('page')||'/');setReady(true);return ()=>controller.current?.abort();},[]);
 function showErrors(next:Errors,form:HTMLFormElement){setErrors(next);const first=Object.keys(next)[0];const field=form.elements.namedItem(first);if(field instanceof HTMLElement)field.focus();else form.focus();}
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(submitting.current)return;const form=event.currentTarget,checked=validateCorrection(Object.fromEntries(new FormData(form)));setMessage('');
  if(!checked.valid){showErrors(checked.errors,form);return;}submitting.current=true;setErrors({});setBusy(true);
  const signature=JSON.stringify(checked.values);if(!attempt.current||attempt.current.signature!==signature)attempt.current={key:crypto.randomUUID(),signature};
  const key=attempt.current.key;controller.current=new AbortController();const timeout=setTimeout(()=>controller.current?.abort(),15000);
  try{const response=await fetch('/api/corrections',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:signature,signal:controller.current.signal}),body:any=await response.json();
   if(!response.ok){if(body.fields)showErrors(body.fields,form);setMessage(body.error||'The submission was not accepted. Your text is still here.');}
   else if(response.status===201&&body.id===key){setMessage(`Received for editorial review. No public record has been changed. Receipt: ${body.id}`);attempt.current=null;form.reset();}
   else throw new Error('Unconfirmed receipt');
  }catch{setMessage('Receipt could not be confirmed. Your text is preserved. Retry when the connection returns; retrying the same text uses the same submission key.');}
  finally{clearTimeout(timeout);submitting.current=false;setBusy(false);}
 }
 const described=(field:keyof CorrectionValues,hint?:string)=>[hint,errors[field]?'correction-'+field+'-error':null].filter(Boolean).join(' ')||undefined;
 return <form id="correction-form" className="correction-form" noValidate tabIndex={-1} aria-busy={busy} onSubmit={submit}>
  {Object.keys(errors).length>0&&<div className="correction-errors" role="alert"><h2>Check your correction</h2><ul>{Object.entries(errors).map(([field,error])=><li key={field}><a href={'#correction-'+field}>{labels[field as keyof typeof labels]}: {error}</a></li>)}</ul></div>}
  <fieldset className="correction-fields" disabled={busy}><legend className="sr-only">Correction details</legend>
  <label htmlFor="correction-page">Page path</label><input id="correction-page" name="page" value={target} onChange={event=>setTarget(event.target.value)} required maxLength={300} aria-invalid={!!errors.page} aria-describedby={described('page','correction-page-help')}/><p id="correction-page-help" className="small">Use the page path. Keep its market parameter when reporting an India or UAE price.</p>{errors.page&&<p id="correction-page-error" className="field-error">{errors.page}</p>}
  <label htmlFor="correction-field">Field or issue</label><input id="correction-field" name="field" placeholder="For example, bracelet or retail price" required minLength={2} maxLength={100} aria-invalid={!!errors.field} aria-describedby={described('field')}/>{errors.field&&<p id="correction-field-error" className="field-error">{errors.field}</p>}
  <label htmlFor="correction-claim">Correction & supporting source</label><textarea id="correction-claim" name="claim" required minLength={10} maxLength={3000} rows={5} placeholder="Describe what should change and include any supporting source URL." aria-invalid={!!errors.claim} aria-describedby={described('claim','correction-claim-help')}/><p id="correction-claim-help" className="small">10–3000 characters. Avoid serial numbers, private documents and payment information.</p>{errors.claim&&<p id="correction-claim-error" className="field-error">{errors.claim}</p>}
  <label htmlFor="correction-contact">Email (optional)</label><input id="correction-contact" name="contact" type="email" autoComplete="email" maxLength={200} aria-invalid={!!errors.contact} aria-describedby={described('contact')}/>{errors.contact&&<p id="correction-contact-error" className="field-error">{errors.contact}</p>}
  <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><p className="small">Submitting stores this correction for moderation. Email is optional and remains editor-only. See <a href="/privacy">privacy information</a>.</p>
  <button className="button" disabled={busy||!ready}>{busy?'Submitting…':'Submit for review'}</button></fieldset><p className="correction-receipt" role="status">{message}</p>
 </form>;
}
