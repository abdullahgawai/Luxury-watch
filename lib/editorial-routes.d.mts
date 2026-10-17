export type EditorialEndpoint={method:'GET'|'POST';queue:string|null};
export function editorialEndpoint(path:unknown):EditorialEndpoint|null;
export function editorialQueryError(params:URLSearchParams,endpoint:EditorialEndpoint|null):string|null;
