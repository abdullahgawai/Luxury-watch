import type {Watch} from './catalogue';
export type HistorySeries={id:string,country:string,type:string,basis:{currency:string,condition:string,boxPapers:string,sellerType:string,taxStatus:string,sourceId:string,retailBasis:string,feeBasis:string,provider:string,assumptions:string,offer:string},source:{id:string,title:string,url:string,checkedAt:string},rows:any[],duplicates:number,conflicts:number,available:boolean};
export function historySeries(w:Watch,country:string,type:string,now?:number):HistorySeries[];
export function historyResponse(w:Watch,params:URLSearchParams,now?:number):{status:number,body:any};
export function historyDate(value:string|number):string;
export function historyMoney(minor:number,currency:string):string;
