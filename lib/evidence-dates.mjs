// Accept explicit ISO dates or zoned ISO timestamps. Never repair or rewrite evidence.
export function evidenceTimestamp(value){
 if(typeof value!=='string'||value.length>50)return null;
 const match=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2}))?$/.exec(value);
 if(!match)return null;
 const [,year,month,day,hour,minute,second,,zone]=match,calendar=new Date(0);
 calendar.setUTCFullYear(Number(year),Number(month)-1,Number(day));
 if(calendar.getUTCFullYear()!==Number(year)||calendar.getUTCMonth()!==Number(month)-1||calendar.getUTCDate()!==Number(day)||Number(hour||0)>23||Number(minute||0)>59||Number(second||0)>59)return null;
 if(zone&&zone!=='Z'&&(Number(zone.slice(1,3))>23||Number(zone.slice(4))>59))return null;
 const timestamp=Date.parse(value);return Number.isFinite(timestamp)?timestamp:null;
}
export function validEvidenceDate(value,now=Date.now()){const timestamp=evidenceTimestamp(value);return timestamp!==null&&timestamp<=now;}
export function validObservationDates(observedAt,checkedAt,now=Date.now()){
 const observed=evidenceTimestamp(observedAt),checked=evidenceTimestamp(checkedAt);
 if(observed===null||checked===null||checked>now)return false;
 // Retain ordering within one millisecond when a source records higher precision.
 const remainder=value=>BigInt((/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1]||'').padEnd(9,'0').slice(3));
 return BigInt(observed)*1000000n+remainder(observedAt)<=BigInt(checked)*1000000n+remainder(checkedAt);
}
