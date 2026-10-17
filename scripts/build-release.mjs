import {spawnSync} from 'node:child_process';
for(const args of [['scripts/run-framework.mjs','build'],['scripts/check-publication.mjs'],['scripts/check-asset-budgets.mjs']]){
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.error){console.error('Release build step could not start.');process.exit(1);}
 if(result.status!==0)process.exit(result.status??1);
}
