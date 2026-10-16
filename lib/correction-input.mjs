export function validateCorrection(input){
 const data=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const text=key=>typeof data[key]==='string'?data[key].trim():'';
 const values={page:text('page'),field:text('field'),claim:text('claim'),contact:text('contact')},errors={};
 if(!values.page.startsWith('/')||values.page.startsWith('//')||/[\\\u0000-\u001f]/.test(values.page)||values.page.length>300)errors.page='Use a local page path beginning with one /, up to 300 characters.';
 if(values.field.length<2||values.field.length>100)errors.field='Describe the field or issue in 2–100 characters.';
 if(values.claim.length<10||values.claim.length>3000)errors.claim='Describe the correction in 10–3000 characters, including a source when available.';
 if((data.contact!==undefined&&data.contact!==null&&typeof data.contact!=='string')||(values.contact&&(values.contact.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact))))errors.contact='Enter a valid email address, or leave it blank.';
 if(data.website)errors.form='Submission rejected.';
 return {values,errors,valid:Object.keys(errors).length===0};
}
