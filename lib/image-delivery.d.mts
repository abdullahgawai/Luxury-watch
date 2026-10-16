import type {Photo} from './catalogue';
export function imageSources(photo:Pick<Photo,'url'|'thumbnail'|'rights'|'matchStatus'>|null|undefined,thumbnail?:boolean):string[];
