import type {Watch} from './catalogue';
export type PublicRoute={path:string,kind:string,brand?:string};
export function publicRoute(slug:unknown):PublicRoute|null;
export function routeWatch(route:PublicRoute,watches:Watch[]):Watch|undefined;
export function routeExists(route:PublicRoute,watches:Watch[]):boolean;
export function catalogueDependent(path:string):boolean;
export function retryPageHref(path:string,query:Record<string,string>,market:string):string;
