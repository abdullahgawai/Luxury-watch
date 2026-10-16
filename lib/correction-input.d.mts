export type CorrectionValues={page:string;field:string;claim:string;contact:string};
export function validateCorrection(input:unknown):{values:CorrectionValues;errors:Partial<Record<keyof CorrectionValues|'form',string>>;valid:boolean};
