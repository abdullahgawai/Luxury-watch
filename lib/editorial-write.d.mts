export function importAttempt(previous:{signature:string,key:string}|null,signature:string,newKey?:()=>string):{signature:string,key:string};
export function confirmedEditorialWrite(url:string,body:any,status:number,result:any):boolean;
export function editorialWrite(url:string,body:unknown,options?:{key?:string,signal?:AbortSignal,timeoutMs?:number,fetcher?:typeof fetch}):Promise<any>;
