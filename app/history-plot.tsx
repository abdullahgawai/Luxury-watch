'use client';
export default function HistoryPlot({rows}:{rows:any[]}){
 const ordered=rows.slice().sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
 const xs=ordered.map(p=>Date.parse(p.observedAt)),ys=ordered.map(p=>p.amountMinor),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
 const x=(v:number)=>65+((v-xmin)/(xmax-xmin||1))*630,y=(v:number)=>220-((v-ymin)/(ymax-ymin||1))*165;
 const amount=(v:number)=>new Intl.NumberFormat(rows[0].currency==='INR'?'en-IN':'en-AE',{style:'currency',currency:rows[0].currency,maximumFractionDigits:0}).format(v/100);
 const day=(v:number)=>new Date(v).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
 return <svg className="history-plot" viewBox="0 0 760 285" role="img" aria-label="Actual dated price observations. No connecting line or interpolated points. The following table gives exact values."><line x1="65" y1="235" x2="705" y2="235" stroke="#a0ad98"/><line x1="65" y1="40" x2="65" y2="235" stroke="#a0ad98"/><text x="65" y="25" fontSize="13" fill="#56645c">{amount(ymax)}</text><text x="65" y="265" fontSize="13" fill="#56645c">{day(xmin)}</text><text x="705" y="265" textAnchor="end" fontSize="13" fill="#56645c">{day(xmax)}</text>{ordered.map(p=><circle key={p.id} cx={x(Date.parse(p.observedAt))} cy={y(p.amountMinor)} r="5" fill="#0b2924"><title>{day(Date.parse(p.observedAt))} · {amount(p.amountMinor)}</title></circle>)}</svg>;
}
