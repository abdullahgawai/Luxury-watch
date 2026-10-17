import type {CorrectionValues} from './correction-input.mjs';
export type CorrectionResult={receipt:string;fields?:never;message?:never}|{receipt?:never;fields?:Partial<Record<keyof CorrectionValues|'form',string>>;message:string};
export function correctionResponse(status:number,body:unknown,key:string):CorrectionResult;
export function submitCorrection(signature:string,key:string,options?:{signal?:AbortSignal,timeoutMs?:number,fetcher?:typeof fetch}):Promise<CorrectionResult>;
