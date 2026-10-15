// Research coverage reviews are never prices, specifications or stock observations.
export function validateCoverageReview(review,watch,now=Date.now()){
 if(!review||review.variantId!==watch.id||review.reference!==watch.reference||!['IN','AE'].includes(review.country))throw new Error('Coverage review configuration mismatch');
 if(!['different_reference','no_qualified_source','rate_limited'].includes(review.outcome)||typeof review.reason!=='string'||!review.reason.trim()||review.reason.length>600)throw new Error('Invalid coverage review outcome');
 if(!Number.isFinite(Date.parse(review.reviewedAt))||Date.parse(review.reviewedAt)>now)throw new Error('Invalid coverage review date');
 let source;try{source=new URL(review.sourceUrl);}catch{throw new Error('Invalid coverage review source');}if(source.protocol!=='https:')throw new Error('Coverage review source requires HTTPS');
 if(['amountMinor','currency','observedAt','checkedAt','price','prices'].some(k=>k in review))throw new Error('Coverage reviews cannot contain price observations');
 if(review.outcome==='different_reference'&&(!review.offeredReference||review.offeredReference===watch.reference))throw new Error('Different offered reference required');
 return review;
}
export function attachCoverageReviews(watches,reviews){
 const output=watches.map(w=>({...w}));
 // Worker startup has no request clock. Validate structure here; request snapshots
 // exclude future reviews, and protected imports validate against their request clock.
 for(const review of reviews){const w=output.find(w=>w.id===review.variantId);if(!w?.demo)throw new Error('Coverage reviews require isolated research records');validateCoverageReview(review,w,Number.POSITIVE_INFINITY);w.retailCoverageReviews=[...(w.retailCoverageReviews||[]),{...review}];}
 return output;
}
export function coverageSnapshot(watches,now=Date.now()){
 return watches.map(w=>w.retailCoverageReviews?{...w,retailCoverageReviews:w.retailCoverageReviews.filter(r=>Number.isFinite(Date.parse(r.reviewedAt))&&Date.parse(r.reviewedAt)<=now)}:w);
}
