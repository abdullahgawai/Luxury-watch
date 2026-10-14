# Catalogue research snapshot — 15 October 2026 IST

The isolated research preview now contains **32 distinct references / 33 configurations**, across Rolex, Tudor, Omega and Cartier. A manufacturer URL, check time, field-to-source evidence and original short explanation accompany every record. The source code in `lib/research-catalogue.mjs` is the structured reference list; the original four researched records remain in `lib/demo.mjs`. These are not production database seed data. Production publication rejects `demo:true` and pending source rights.

Sources were read through the web research tool. Some retrieved pages were cached by the search provider. Dates describe when that content was checked, not a successful live manufacturer API fetch. Do not automate date refreshes without fetching evidence again. No model-family default fills an unknown field: the FXD's unreviewed technical fields, Sea-Dweller and GMT reserve fields, and several bezel/calibre/reserve fields remain unavailable.

## Original local retail observations

Only the Rolex Oyster Perpetual 36 **m126000-0015 / med blue / Oyster** has checked original local retail observations:

- India: INR 654,100, [official regional page](https://www.rolex.com/en-in/watches/oyster-perpetual/m126000-0015).
- UAE: AED 26,950, [official regional page](https://www.rolex.com/ar-ae/watches/oyster-perpetual/m126000-0015).

Checked 2026-10-14 19:00 UTC (15 October IST), through regional-page text retrieval. Condition basis: new manufacturer retail; box/papers not stated; tax inclusion unconfirmed. A stale India search snippet showing INR 622,800 was excluded in favour of the reopened product page. The current research snapshot must not be described as a live local feed. Manufacturer redistribution/publication review remains pending. The silver dial shares reference 126000 but receives neither these observations nor the med-blue photograph. No stock or seller verification follows from a retail page.

No dealer asks, buy offers, estimates or verified sales were added. No historical series is fabricated from a single observation. USD conversion is never presented as Indian/UAE market evidence.

## Connecting production

For TheWatchAPI: obtain a server API key, authenticated endpoint/schema, commercial storage/display terms and written coverage of photos, technical fields and price-history geography. Test with the existing protected provider evaluator before writing an adapter mapping. Keep `THEWATCHAPI_ENABLED=false` until that test succeeds. Separately obtain original India/UAE retail observations, dealer-listing consent and documented sale evidence. Rights-approved records must be imported as drafts through the editor, reviewed, then published; switching DATA_MODE alone never promotes this research catalogue.
