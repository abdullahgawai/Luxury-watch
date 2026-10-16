'use client';
import {useEffect,useRef,useState} from 'react';
import {operationalCheckRequest} from '../lib/operational-client.mjs';
export default function OperationalChecks(){
 const [report,setReport]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const active=useRef<AbortController|null>(null);
 useEffect(()=>()=>{active.current?.abort();},[]);
 async function check(){
  if(active.current)return;
  const controller=new AbortController();active.current=controller;
  setBusy(true);setError('');setReport(null);
  try{const result=await operationalCheckRequest({signal:controller.signal});if(!controller.signal.aborted)setReport(result);}
  catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'System checks unavailable. Run the check again.');}
  finally{if(active.current===controller)active.current=null;if(!controller.signal.aborted)setBusy(false);}
 }
 const rows=report?[
  ['Database',report.database],['Data mode',report.dataMode],
  ['Published / review / draft',`${report.records.published} / ${report.records.review} / ${report.records.draft}`],
  ['Production records checked',report.publication.checked+(report.publication.truncated?' (partial scan)':'')],
  ['Records passing production checks',report.publication.visible],
  ['Records withheld from production',report.publication.withheld],
  ['Unreadable published payloads',report.publication.invalidPayloads],
  ['Withheld prices in visible records',report.publication.withheldPrices],
  ['Withheld primary photos in visible records',report.publication.withheldPhotos],
  ['Pending corrections',report.corrections.pending],
  ['Price observations checked',report.prices.checked+(report.prices.truncated?' (partial scan)':'')],
  ['Stale price checks',report.prices.stale],['Invalid price checks',report.prices.invalid],
  ['Provider evaluations in the last hour',report.provider.evaluationsLastHour],
  ['Automated alerts','Not configured'],['Hosted restore rehearsal','Not verified']
 ]:[];
 return <section className="operational-checks" aria-busy={busy}>
  <h2>System checks</h2>
  <p>Run a read-only database, publication and source-freshness check. These checks do not configure automated alerts or hosted backups.</p>
  <button disabled={busy} onClick={check}>{busy?'Checking…':'Run system checks'}</button>
  <p role="status">{busy?'Checking database and publication evidence…':error|| (report?`${report.status==='ok'?'Checks passed':'Review required'} · ${new Date(report.checkedAt).toLocaleString('en-GB',{timeZone:'Asia/Kolkata'})} IST`:'')}</p>
  {report&&<>
   <p>Production checks use approved sources and exact configuration evidence, even in research mode. Withheld price and photo counts cover visible records only. Missing data remains unavailable. The check time does not refresh source dates.</p>
   <dl className="methodology">{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   {report.warnings.length>0&&<ul aria-label="Items needing editorial review">{report.warnings.map((warning:string)=><li key={warning}>{warning}</li>)}</ul>}
  </>}
 </section>;
}
