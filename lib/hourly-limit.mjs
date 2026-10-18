const hour=3600000,cleanupBatch=100;
export async function consumeHourlyLimit(database,key,max=5,now=Date.now()){
 if(typeof key!=='string'||!key||key.length>1024||!Number.isSafeInteger(max)||max<1||!Number.isSafeInteger(now)||now<0)throw new Error('Invalid hourly limit input');
 const bucket=Math.floor(now/hour),expiresAt=(bucket+1)*hour;
 if(!Number.isSafeInteger(expiresAt))throw new Error('Invalid hourly limit expiry');
 // Preserve the existing key derivation so deployment cannot reset active quotas.
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key+bucket)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 // Retain recently expired buckets for one hour, protecting in-flight checks
 // across a window boundary. Cleanup is opportunistic, indexed and bounded.
 await database.prepare('DELETE FROM limits WHERE key IN (SELECT key FROM limits WHERE expires_at<=? ORDER BY expires_at,key LIMIT ?)').bind(now-hour,cleanupBatch).run();
 // The increment itself remains one atomic UPSERT; cleanup cannot reset this
 // bucket because its expiry is strictly later than the captured request time.
 const row=await database.prepare('INSERT INTO limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(hash,expiresAt).first();
 return !!row&&Number.isSafeInteger(row.count)&&row.count>0&&row.count<=max;
}
