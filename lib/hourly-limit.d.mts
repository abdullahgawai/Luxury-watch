export function consumeHourlyLimit(database:{prepare(sql:string):any},key:string,max?:number,now?:number):Promise<boolean>;
