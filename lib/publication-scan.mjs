const signatures=[
 ['private_key',/-----BEGIN (?:(?:RSA|EC|OPENSSH|DSA) )?PRIVATE KEY-----/g],
 ['github_token',/\bgh[pousr]_[A-Za-z0-9]{36,255}\b/g],
 ['github_fine_grained_token',/\bgithub_pat_[A-Za-z0-9_]{40,255}\b/g],
 ['openai_key',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,255}\b/g],
 ['aws_access_key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
 ['embedded_url_credentials',/https?:\/\/[^\s/@:]+:[^\s/@]{8,}@/g]
];
const assignment=/\b(?:[A-Z][A-Z0-9_]*(?:TOKEN|PASSWORD|SECRET|API_KEY)|api[_-]?key|api[_-]?token|access[_-]?token|client[_-]?secret|password|secret[_-]?key|token)["']?\s*[:=]\s*(["'])([A-Za-z0-9_./+=:@ -]{16,})\1/gi;
const placeholder=value=>/^[A-Z0-9_]+_SENTINEL$/.test(value)||/^(?:<[^>]+>|\$\{[^}]+\}|process\.env\.[A-Z_]+|replace[_ -].*|your[_ -].*|example[_ -].*)$/i.test(value);
export function sensitiveFile(path){
 const name=path.replaceAll('\\','/').split('/').at(-1);
 return (/^\.env(?:\.|$)/.test(name)&&!/^\.env\.(?:example|template|sample)$/.test(name))||(/^\.dev\.vars(?:\.|$)/.test(name)&&!/^\.dev\.vars\.(?:example|template|sample)$/.test(name))||/^(?:id_rsa|id_ed25519|id_ecdsa)$/.test(name);
}
// Findings contain locations and categories only. Never retain matched values.
export function scanPublicationText(text,{artifact=false,approved=()=>false}={}){
 const findings=[];
 function find(kind,regex,accept=()=>true){regex.lastIndex=0;for(const match of text.matchAll(regex)){if(findings.length>=1000)return;if(accept(match)){const line=text.slice(0,match.index).split('\n').length;if(!approved(kind,match[0],line))findings.push({kind,line});}}}
 for(const [kind,regex] of signatures)find(kind,regex);
 find('hardcoded_credential',assignment,match=>!placeholder(match[2]));
 if(artifact)find('local_qa_fixture',/\b(?:PRIVATE_[A-Z_]+_SENTINEL|synthetic-history-qa|history-fixture\.invalid|local-synthetic-editor|local-simulation-editor|SYNTHETIC (?:SESSION|RECEIPTS|QA REPORT|WRITE RECEIPTS))\b/g);
 return findings;
}
export function privateFrameworkConfig(text,file){
 if(!['dist/server/vinext-server.json','dist/server/ssr/vinext-server.json'].includes(file.replaceAll('\\','/')))return null;
 const parsed=JSON.parse(text);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||typeof parsed.prerenderSecret!=='string'||!/^[a-f0-9]{64}$/.test(parsed.prerenderSecret))throw new Error('Unrecognized private framework configuration');
 const {prerenderSecret,...rest}=parsed;return {secret:prerenderSecret,sanitized:JSON.stringify(rest)};
}
export function frameworkSecretExposures(text,secrets){
 return [...new Set(secrets)].filter(secret=>typeof secret==='string'&&secret.length>=32&&text.includes(secret)).map(secret=>({kind:'framework_secret_exposure',line:text.slice(0,text.indexOf(secret)).split('\n').length}));
}
