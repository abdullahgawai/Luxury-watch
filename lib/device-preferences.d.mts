type StorageGetter=()=>Pick<Storage,'getItem'|'setItem'>;
export function selectionIds(value:unknown):string[];
export function comparisonSelection(value:unknown,knownIds:string[]):string[];
export function readDevicePreferences(getStorage:StorageGetter,search:string,knownIds:string[]):{market:string;saved:string[];compare:string[];issues:string[];blocked:string[]};
export function writeDevicePreference(getStorage:StorageGetter,key:string,value:unknown):boolean;
export function marketHref(path:string,market:string):string;
export function comparisonHref(ids:string[],market:string):string;
