'use client';
import {historyDate,historyMoney} from '../lib/history.mjs';
export default function HistoryPlot({rows}:{rows:any[]}){
 if(rows.length<2)return null;
 const ordered=rows.slice().sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt)),xs=ordered.map(p=>Date.parse(p.observedAt)),ys=ordered.map(p=>p.amountMinor);
 const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const x=(v:number)=>200+(v-xmin)/(xmax-xmin||1)*650,y=(v:number)=>ymax===ymin?145:245-(v-ymin)/(ymax-ymin)*195;
 const amount=(v:number)=>historyMoney(v,rows[0].currency),day=(v:number)=>new Date(v).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'})+' IST';
 return <svg className="history-plot" viewBox="0 0 900 315" role="img" aria-label="Actual dated price observations in IST. Vertical scale shows observed values, not a zero baseline. No connecting line or interpolated points. The following table gives exact values."><line x1="200" y1="260" x2="860" y2="260" stroke="#a0ad98"/><line x1="200" y1="35" x2="200" y2="260" stroke="#a0ad98"/><text x="200" y="22" fontSize="13" fill="#56645c">Original {rows[0].currency} · actual observations</text><text x="12" y={ymax===ymin?149:54} fontSize="13" fill="#56645c">{amount(ymax)}</text>{ymax!==ymin&&<text x="12" y="249" fontSize="13" fill="#56645c">{amount(ymin)}</text>}<text x="200" y="290" fontSize="13" fill="#56645c">{day(xmin)}</text><text x="850" y="290" textAnchor="end" fontSize="13" fill="#56645c">{day(xmax)}</text>{ordered.map(p=><circle key={p.id} cx={x(Date.parse(p.observedAt))} cy={y(p.amountMinor)} r="5" fill="#0b2924"><title>{historyDate(p.observedAt)} · {amount(p.amountMinor)}</title></circle>)}</svg>;
}
