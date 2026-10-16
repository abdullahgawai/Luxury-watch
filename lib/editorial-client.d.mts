export function editorialQueueRequest(url:string,options?:{signal?:AbortSignal,timeoutMs?:number,fetcher?:typeof fetch}):Promise<any>;
export function verifiedQueuePage(body:any,kind:string):any;
export function storedJSON(raw:unknown):{ok:boolean,value:any};
