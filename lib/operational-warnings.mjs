// Derive fixed operator guidance from report state, never from private payload text.
export function operationalWarnings(report){
 const warnings=[],p=report.publication;
 if(report.dataMode!=='production')warnings.push('Research mode is active; production data publication is not verified.');
 if(report.dataMode==='production'&&!report.records.published)warnings.push('The production catalogue has no published records.');
 if(report.prices.stale)warnings.push('Published price observations need source rechecks.');
 if(report.prices.invalid)warnings.push('Published price check dates or payloads need editorial review.');
 if(report.prices.truncated)warnings.push('Observation scan limit reached; counts describe a partial scan.');
 if(p.withheld)warnings.push('Published records are withheld by production source, identity or rights checks; review them in the editorial queue.');
 if(p.withheldPrices)warnings.push('Published price entries are withheld by public evidence checks; review exact configurations, sources and dates.');
 if(p.withheldPhotos)warnings.push('Primary photos are withheld by publication checks; review licensing and exact configuration evidence.');
 if(p.truncated)warnings.push('Production catalogue limit reached; only the first 1000 published records are checked and served.');
 if(report.provider.enabled&&!report.provider.tokenConfigured)warnings.push('Provider evaluation is enabled without a configured token.');
 if(report.automation.alerts!=='configured')warnings.push('Automated operational alerts are not configured. Manual checks do not provide monitoring.');
 if(report.automation.hostedRestore!=='verified')warnings.push('Hosted database restore has not been verified. Saved-code rollback does not restore database contents.');
 return warnings;
}
