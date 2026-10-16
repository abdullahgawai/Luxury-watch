import type {Watch} from './catalogue';
export function publicWatch(record:any,options?:{production?:boolean,now?:number}):Watch|null;
export function publicCatalogue(records:any[],options?:{production?:boolean,now?:number}):Watch[];
export function publicPrices(w:Watch,params:URLSearchParams):{status:number,body:any};
