import {editorialQueueRequest} from './editorial-client.mjs';
import {operationalWarnings} from './operational-warnings.mjs';
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const count=value=>Number.isSafeInteger(value)&&value>=0;
const date=value=>typeof value==='string'&&value.length<=60&&Number.isFinite(Date.parse(value));
export function verifiedOperationalReport(body){
 const invalid=()=>{throw new Error('System check response could not be verified. Run the check again.');};
 if(!object(body)||!['ok','needs_attention'].includes(body.status)||!date(body.checkedAt)||body.database!=='ok'||!['research','production'].includes(body.dataMode))return invalid();
 const groups={records:['draft','review','published'],publication:['checked','visible','withheld','invalidPayloads','withheldPrices','withheldPhotos'],corrections:['pending'],prices:['checked','stale','invalid'],provider:['evaluationsLastHour']};
 for(const [group,keys] of Object.entries(groups))if(!object(body[group])||!keys.every(key=>count(body[group][key])))return invalid();
 if(!['publication','prices'].every(key=>typeof body[key].truncated==='boolean')||!['enabled','tokenConfigured'].every(key=>typeof body.provider[key]==='boolean')||!(body.corrections.oldestPendingAt===null||date(body.corrections.oldestPendingAt)))return invalid();
 const p=body.publication;
 if(p.checked>1000||p.visible+p.withheld!==p.checked||p.invalidPayloads>p.withheld||p.checked>body.records.published||p.withheldPhotos>p.visible||body.prices.checked>5000||body.prices.stale+body.prices.invalid>body.prices.checked)return invalid();
 if(!Array.isArray(body.warnings)||body.warnings.length>30||!body.warnings.every(w=>typeof w==='string'&&w.length>0&&w.length<=2000)||new Set(body.warnings).size!==body.warnings.length||(body.status==='ok')!==(body.warnings.length===0))return invalid();
 if(!object(body.automation)||body.automation.alerts!=='not_configured'||body.automation.hostedRestore!=='not_verified')return invalid();
 // Status/warning agreement alone cannot turn known failures into a passed check.
 if(operationalWarnings(body).some(warning=>!body.warnings.includes(warning)))return invalid();
 return body;
}
export async function operationalCheckRequest(options={}){
 let body;
 try{body=await editorialQueueRequest('/api/admin/health',options);}catch{
  throw new Error('System checks unavailable or timed out. Run the check again when the connection returns.');
 }
 return verifiedOperationalReport(body);
}
