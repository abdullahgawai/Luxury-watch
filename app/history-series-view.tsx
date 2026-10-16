'use client';
import type {HistorySeries} from '../lib/history.mjs';
import {historyDate,historyMoney} from '../lib/history.mjs';
import HistoryPlot from './history-plot';
export default function HistorySeriesView({series,typeLabel}:{series:HistorySeries,typeLabel:string}){
 const b=series.basis;
 return <>
  <p>{series.country==='IN'?'India':series.country==='AE'?'UAE':'Global scope'} · {b.currency} · {typeLabel} · {series.source.title}</p>
  <p className="small">{b.condition} · {b.boxPapers} · {b.sellerType} · {b.taxStatus}</p>
  {b.offer&&<p className="small">Offer series: {b.offer}</p>}
  {b.retailBasis&&<p className="small">Retail basis: {b.retailBasis}</p>}{b.feeBasis&&<p className="small">Fee basis: {b.feeBasis}</p>}{b.provider&&<p className="small">Provider: {b.provider} · Assumptions: {b.assumptions}</p>}
  <p className="small">Source checked {historyDate(series.source.checkedAt)}. Observations retain their own original and check dates. No interpolation, forecast or inferred sales.</p>
  {(series.conflicts>0||series.duplicates>0)&&<p className="small history-review-note" role="status">{series.conflicts>0&&`${series.conflicts} conflicting timestamps withheld for editorial review. `}{series.duplicates>0&&`${series.duplicates} repeated checks collapsed to their original observation.`}</p>}
  {series.available?<><p className="small">The chart uses the observed price range, rather than a zero baseline. Scroll within the chart and table on narrow screens.</p><div className="history-scroll" role="region" tabIndex={0} aria-label="Dated price chart and observation table. Scroll horizontally on small screens" onKeyDown={event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();event.currentTarget.scrollBy({left:event.key==='ArrowRight'?240:-240});}}}><HistoryPlot rows={series.rows}/><table className="specs history-table"><caption>Dated observations · {typeLabel} · {b.currency} · IST</caption><thead><tr><th scope="col">Observed</th><th scope="col">Original amount</th><th scope="col">Checked</th><th scope="col">Source & evidence</th></tr></thead><tbody>{series.rows.map(p=><tr key={p.id}><td><time dateTime={p.observedAt}>{historyDate(p.observedAt)}</time></td><td>{historyMoney(p.amountMinor,p.currency)}</td><td><time dateTime={p.checkedAt}>{historyDate(p.checkedAt)}</time></td><td><a href={series.source.url} target="_blank" rel="noreferrer">{series.source.title} ↗</a><details><summary>Observation evidence</summary><p>{p.evidence}</p></details></td></tr>)}</tbody></table></div></>:<p>No reliable series available: fewer than two distinct comparable observations remain.</p>}
 </>;
}
