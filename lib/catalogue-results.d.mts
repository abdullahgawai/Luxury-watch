import type {Watch} from './catalogue';
export const CATALOGUE_PAGE_SIZE:number;
export function catalogueResults(watches:Watch[],query:Record<string,string>,requestedPage?:string|number):{rows:Watch[],total:number,totalPages:number,page:number,from:number,to:number};
export function catalogueHref(path:string,query:Record<string,string>,page?:number):string;
