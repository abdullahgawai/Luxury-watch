import type {Watch} from './catalogue';
export type CatalogueQuery=Record<string,any> & {market:string,page?:number,pageSize?:number};
export function catalogueQuery(params:URLSearchParams,options?:{detail?:boolean}):{status:number,error?:string,query?:CatalogueQuery};
export function cataloguePage(watches:Watch[],query:CatalogueQuery):{data:Watch[],pagination:Record<string,any>};
