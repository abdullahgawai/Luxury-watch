# Source feasibility — 14 October 2026

This is a documentation review, not a successful live API integration.

## TheWatchAPI

Official documentation: https://www.thewatchapi.com/documentation

The documented model search provides brand, model, reference, movement, case material, diameter, description and upstream update time. Reference-specific dial, bracelet and image licensing are not established by this contract. Price endpoints describe indicative USD asking-price averages and histories. They do not establish Indian or UAE retail, local comparable listings, or verified completed sales. Reference history requires the stated eligible plan. Check current plan terms before any paid use.

Implemented server adapter: `lib/provider.ts`. The protected editor evaluation action uses a documented model-search endpoint, an 8-second timeout, no redirect following and no logged token URL. It returns unresolved candidates for review and never publishes. No raw payload is retained. Default is disabled. There are no automatic scheduled API requests.

| Capability | Documentation finding | Live response evidence |
| --- | --- | --- |
| Catalogue search/basic specs | Documented | Untested: no token |
| Exact dial/bracelet configuration | Not established | Untested |
| India official retail | Not established | No feed |
| UAE official retail | Not established | No feed |
| India/UAE asking listings | Not established | No feed |
| USD asking indicator history | Documented, plan-dependent | Untested |
| Verified sale results | Not established | No feed |
| Photograph redistribution rights | Separate permission required | No permission supplied |
| Storage, caching, historic retention | Terms/contract review required | Unapproved |
| Quota cost and latency | Response headers supported by adapter | Unmeasured |

## Exactly what connects real data

1. Configure `THEWATCHAPI_TOKEN` as a Sites **secret**, server-side. Set `THEWATCHAPI_ENABLED=true` only after permitted access and rights are confirmed. Never paste a token into project files or browser JavaScript.
2. Evaluate 5–10 intended references through the editor action, respecting its three evaluations per hour cap. Record missing fields, ambiguity, upstream update times, response latency, quota headers and failure states. Do not automatically map reference-level data to a dial/bracelet variant.
3. Secure written display/storage/cache/refresh/history permissions. Image permission is independent of specification permission. Provider search results remain unpublished candidates until mapped and reviewed.
4. Obtain approved local manufacturer/authorised-retailer evidence for INR/India and AED/UAE. For asking ranges obtain permitted distinct listings with exact configuration, condition, box/papers, seller type, country and checked date. Do not scrape unlicensed retailer/marketplace pages.
5. Enter original observations through the validated editorial import. Publish only after review. Choose `DATA_MODE=production`; this reads only published database records and excludes the demonstration catalogue.

Alternative candidate roles follow the supplied PRD: WatchCharts for licensed estimates, permitted local retailer evidence for retail, approved marketplace/dealer feeds for asking prices, and documented auction results with fee basis for completed sales. None are connected or claimed as tested.

## Catalogue and image registry

The original four researched references in `lib/demo.mjs` are supplemented by `lib/research-catalogue.mjs`: 38 distinct references / 39 configurations in total. Each known field references a manufacturer product page or original explanatory copy. The current tested catalogue contains43 eligible local retail research observations (19India and24UAE), with three archived records excluded from current retail. Remaining exact-configuration gaps are disclosed on the coverage page. Amounts retain original source/check dates, retail basis, cache age, tax qualifications and retailer authorisation evidence. Publication permissions remain pending; snapshots do not qualify for history. See CATALOGUE-RESEARCH.md.

Ten openly licensed documentary photographs cover nine configurations, including two explicitly disclosed Cartier visual mappings. The homepage hero, cards and detail gallery use these assets with author/source/licence credits and licence-check dates, downloadable originals and recorded changes. Remaining entries explicitly state “Image unavailable”. Production imports require a local asset, approved exact variant match, evidence, rights holder, licence/source links, changes and meaningful alt text. Supplying an image URL alone is insufficient. See PHOTOGRAPHY.md.

## Adapter boundary verification — 17 October 2026

Local simulated-response tests now enforce an8-second request deadline, redirect denial, a256KiB response-body limit (advertised length and streamed bytes), JSON media type/valid UTF-8/schema checks and at most25 examined candidates per evaluation. Oversized bodies are cancelled. Candidate rows require a bounded reference; unexpected/object/control-character/overlong fields are withheld, valid candidates keep GLOBAL scope and unresolved mapping, and prices/image remain empty/null. Configured token echoes in retained text are withheld. Quota-limit headers are accepted only as bounded numeric metadata; they do not establish available credits or cost. The report includes examined, rejectedCandidates and truncated counts so a25-row preview is not mistaken for complete coverage.

401/403 return authentication_failed,429 returns rate_limited, other non-success responses return upstream_error. Transport, redirect or timeout errors return provider_unavailable without raw errors or URLs. No automatic retry occurs. Invalid JSON/media/schema returns schema_changed; oversized responses return response_too_large; an empty data array returns no_matches. These are local adapter contracts verified with simulated responses, not evidence that the upstream currently supplies these fields or statuses. Actual credentials, rights, quota/cost and5–10-reference latency/coverage verification remain required. No raw payload is stored, no candidates are imported automatically, and a failed evaluation does not update published records or check dates.
