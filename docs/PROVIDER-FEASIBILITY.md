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

Four researched references are isolated in `lib/demo.mjs`: Rolex 124060 and 126610LV, Cartier WSSA0029 and Omega 310.30.42.50.01.001. Each field references the official product page or original explanatory copy. Research was checked on 14 October 2026. Publication permissions remain pending. No local prices or invented historical observations are included.

The hero is original CSS material artwork, not a watch/reference photograph. Cards and detail pages explicitly state “Image unavailable”; no documentary watch images are shipped. Production image imports require a local asset URL, rights holder, permission, approved rights and meaningful alt text. Supplying an image URL alone is insufficient. The actual licensed assets must be included in the deployment source.
