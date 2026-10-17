type Options={signal?:AbortSignal,timeoutMs?:number,fetcher?:typeof fetch};
export function editorAccess(options?:Options):Promise<string>;
export function providerEvaluation(reference:string,options?:Options):Promise<any>;
export function verifiedProviderEvaluation(body:unknown):any;
