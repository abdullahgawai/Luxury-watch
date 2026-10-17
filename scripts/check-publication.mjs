// Read-only, pattern-based publication gate. No env values, credentials or matched text are printed.
import {execFileSync} from 'node:child_process';import {readFile,readdir,lstat} from 'node:fs/promises';import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
import {scanPublicationText,sensitiveFile,privateFrameworkConfig,frameworkSecretExposures} from '../lib/publication-scan.mjs';
const root=process.cwd(),findings=[];let sourceFiles=0,artifactFiles=0,binaryFiles=0;
const configs=new Map(),secrets=new Set();let reviewedFixtureMatches=0,reviewed=[];
function approved(file,kind,match){const hash=createHash('sha256').update(match).digest('hex');const ok=reviewed.some(row=>row.file===file.replaceAll('\\','/')&&row.kind===kind&&row.sha256===hash);if(ok)reviewedFixtureMatches++;return ok;}
function git(args){try{return execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024,stdio:['ignore','pipe','pipe'],timeout:60000});}catch{throw new Error('Git inspection failed or exceeded its bound; publication check is incomplete.');}}
async function scanFile(file,scope){
 const absolute=resolve(root,file);if(!absolute.startsWith(root+'\\')&&!absolute.startsWith(root+'/'))throw new Error('Unexpected scan path; publication check is incomplete.');
 const info=await lstat(absolute);if(!info.isFile()||info.isSymbolicLink())throw new Error('Unexpected file type; publication check is incomplete.');if(info.size>16*1024*1024)throw new Error('File scan size exceeded; publication check is incomplete.');
 if(sensitiveFile(file))findings.push({scope,file,line:1,kind:'sensitive_file'});
 const bytes=await readFile(absolute);if(bytes.includes(0)){binaryFiles++;return;}
 if(scope==='source')sourceFiles++;else artifactFiles++;
 const raw=bytes.toString('utf8'),normalized=file.replaceAll('\\','/'),text=configs.get(normalized)?.sanitized??raw;
 if(!configs.has(normalized))findings.push(...frameworkSecretExposures(raw,secrets).map(f=>({scope,file,...f})));
 findings.push(...scanPublicationText(text,{artifact:scope==='artifact',approved:scope==='source'?(kind,match)=>approved(file,kind,match):undefined}).map(f=>({scope,file,...f})));
}
async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const file=join(directory,entry.name);if(entry.isDirectory())files.push(...await walk(file));else if(entry.isFile())files.push(relative(root,file));else throw new Error('Unexpected artifact entry; publication check is incomplete.');}return files;}
try{
 reviewed=JSON.parse(await readFile(resolve(root,'scripts/publication-reviewed-fixtures.json'),'utf8'));
 if(!Array.isArray(reviewed)||reviewed.length>20||reviewed.some(row=>!/^tests\/[A-Za-z0-9._/-]+$/.test(row.file)||!['hardcoded_credential','embedded_url_credentials'].includes(row.kind)||!/^[a-f0-9]{64}$/.test(row.sha256)||typeof row.reason!=='string'||!row.reason.trim()))throw new Error('Invalid fixture review registry');
 for(const file of ['dist/server/vinext-server.json','dist/server/ssr/vinext-server.json']){const config=privateFrameworkConfig(await readFile(resolve(root,file),'utf8'),file);configs.set(file,config);secrets.add(config.secret);}
 const source=[...new Set(git(['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean))];
 for(const file of source)await scanFile(file,'source');
 for(const file of await walk(resolve(root,'dist')))await scanFile(file,'artifact');
 if(!artifactFiles)throw new Error('Build output is missing; publication check is incomplete.');
 const history=git(['log','--all','--no-renames','--format=commit:%H','--no-ext-diff','--no-textconv','--no-color','-p']),lines=history.split('\n'),contexts=[];let commit='',file='';
 for(const line of lines){if(line.startsWith('commit:'))commit=line.slice(7);if(line.startsWith('diff --git ')){file=line.split(' b/').at(-1);if(sensitiveFile(file))findings.push({scope:'history',file,commit,kind:'sensitive_file'});}contexts.push({commit,file});}
 for(const finding of scanPublicationText(history,{approved:(kind,match,line)=>approved(contexts[line-1]?.file||'',kind,match)})){const context=contexts[finding.line-1]||{};findings.push({scope:'history',...context,patchLine:finding.line,kind:finding.kind});}
 const report={passed:findings.length===0,sourceFiles,artifactFiles,binaryFiles,historyCommits:Number(git(['rev-list','--all','--count']).trim()),reviewedFixtureMatches,privateFrameworkFiles:configs.size,findings,limits:'Pattern-based check only; binary contents, ignored local files, host secrets and remote service logs are not inspected. Two generated server-only framework secrets are expected and checked for exposure elsewhere. Reviewed fixture exceptions match exact file/category/digest and never apply to build output. Research preview data is intentionally retained; local QA fixtures must be absent from build output.'};
 console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
}catch{console.error('Publication check could not complete. No secret values were printed. Check Git access, build output and scan bounds.');process.exitCode=1;}
