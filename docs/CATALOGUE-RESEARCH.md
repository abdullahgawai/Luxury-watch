# Catalogue research snapshot — 15 October 2026 IST

The isolated research preview now contains **38 distinct references / 39 configurations**, across Rolex, Tudor, Omega and Cartier. A manufacturer URL, check time, field-to-source evidence and original short explanation accompany every record. The source code in `lib/research-catalogue.mjs` is the structured reference list; the original four researched records remain in `lib/demo.mjs`. These are not production database seed data. Production publication rejects `demo:true` and pending source rights.

Sources were read through the web research tool. Some retrieved pages were cached by the search provider. Dates describe when that content was checked, not a successful live manufacturer API fetch. Do not automate date refreshes without fetching evidence again. No model-family default fills an unknown field: the FXD's unreviewed technical fields, Sea-Dweller and GMT reserve fields, and several bezel/calibre/reserve fields remain unavailable.

Public check dates explicitly include IST (UTC+05:30); original UTC timestamps are retained in the evidence records. Selecting UAE changes price geography/currency, not the documented display timezone.

## Original local retail observations

The catalogue now has **34 local retail research snapshots: fourteen India/INR and twenty UAE/AED**, across twenty exact configurations. Twenty-two are Rolex manufacturer observations, two Tudor India MRPs, six Tudor UAE displays, three Omega UAE displays and one Omega India list-price observation. Two older Cartier manufacturer amounts are separately archived, excluded from these counts and from current retail/filter/comparison/history. The initial Rolex Oyster Perpetual 36 **m126000-0015 / med blue / Oyster** observations remain unchanged:

- India: INR 654,100, [official regional page](https://www.rolex.com/en-in/watches/oyster-perpetual/m126000-0015).
- UAE: AED 26,950, [official regional page](https://www.rolex.com/ar-ae/watches/oyster-perpetual/m126000-0015).

Checked 2026-10-14 19:00 UTC (15 October IST), through regional-page text retrieval. Condition basis: new manufacturer retail; box/papers not stated; tax inclusion unconfirmed. A stale India search snippet showing INR 622,800 was excluded in favour of the reopened product page. The current research snapshot must not be described as a live local feed. Manufacturer redistribution/publication review remains pending. The silver dial shares reference 126000 but receives neither these observations nor the med-blue photograph. No stock or seller verification follows from a retail page.

No dealer asks, buy offers, estimates or verified sales were added. No historical series is fabricated from a single observation. USD conversion is never presented as Indian/UAE market evidence.

Twenty additional snapshots were checked at 2026-10-14 19:22:20 UTC (15 October IST), for Explorer36/40, ExplorerII white, Air-King, OysterPerpetual34 silver, Yacht-Master40 slate, Datejust36 silver/Jubilee, Submariner124060 and SubmarinerDate126610LN/LV. Exact amounts, URLs, configuration tuples, retrieval-cache age at the time of review and match notes are retained in `docs/source-evidence/retail-expansion.json`. Source region headers, original currency and configuration identifiers were checked together; incidental geolocation footer text may disagree with the selected region and is disclosed. No publisher price-effective date, live stock or tax inclusion is inferred.

`lib/retail-research.mjs` requires exact reference/dial/bracelet/material/size/configuration ID, matching official regional URL or explicitly reviewed retailer product URL and original local currency. It rejects duplicates, conversions, wrong-region sources and production records. These safeguards also have automated tests. Public cards, detail panels, comparison and market rows retain source names/links, currency, condition and check dates, plus a visible “Research snapshot · live price not verified” disclosure. Cached checks are excluded from price history, even if multiple research checks exist, because price-effective dates are unknown.

New photo-backed manufacturer entries: blue Planet Ocean215.30.44.21.03.001 and SpeedmasterReduced3510.50.00. Primary Omega pages were checked on 15 October IST. Blue Planet Ocean now has a UAE retail observation; its India price, Reduced prices and unreviewed Reduced bezel remain unavailable. Manufacturer page purchase status never becomes a dealer stock claim. Current Cartier retail remains unavailable; Omega Diver300M India and six exact Tudor UAE configurations now have separate source observations. Other gaps remain unavailable.

## Non-Rolex source review — 15 October 2026

The exact Tudor Black Bay54 and Pelagos INR MRPs come from Exclusive Lines. Tudor's own retailer locator corroborates the chain's Kolkata Quest Mall location. Omega Moonwatch3861, black Diver300M and blue Planet Ocean AED amounts come from Rivoli's UAE production product pages; original JSON-LD additionally confirms currency and amounts. Omega's own locator confirms Rivoli Dubai, and Rivoli Group links the online shop. Source and check dates, original configuration tuples and evidence are in `source-evidence/non-rolex-retail.json` and its candidate reports.

Rivoli amounts are the authorised retailer's displayed list prices before checkout promotions. Manufacturer RRP is not established; no promotional discount, eligibility, stock or completed transaction is inferred. Applicable-tax wording comes from retailer terms, with no tax breakdown. Tudor taxes are unconfirmed. These are manually reviewed research observations, not a tested live integration. Source publication rights remain pending.

Cartier local-price candidates are held because a retailer self-claim has not been corroborated for Cartier. Tudor authority must never transfer to Cartier or Omega. Older/uncertain cached Tudor MRP candidates are held. No amount from these held candidates enters public prices, filtering, comparison or history. Missing markets remain unavailable.

Two separate Cartier Tank configurations add green quartz WSTA0056 and silvered automatic WSTA0040; unknown bezel, green calibre/reserve and XL reserve stay unavailable. Manufacturer specifications were reviewed in cached primary results; direct access failed. This limitation is in their source disclosures. Photo commercial-reference mappings are explicitly visual inferences, not photographer-confirmed identifiers.

Retail research now requires an explicit brand/country/product-URL source review for non-Rolex observations. Authorised-retailer records require manufacturer-domain authorisation evidence and a stated retail basis. Explicit source URL-to-variant/reference/configuration bindings prevent a reviewed collection or product page being reassigned to a different watch. Editorial validation rejects missing, future-dated or off-domain authority evidence. Public evidence dialogs link the manufacturer locator; that relationship is not a seller-verification badge.

## Remaining-market pass — 15 October 2026, 05:03–05:08 UTC

Six exact Tudor UAE product pages at manufacturer-corroborated Mohammed Rasool Khoory & Sons were retrieved successfully through ordinary public HTTP200 requests. Visible amounts and selected Product JSON-LD currency/price/SKU agree: Black Bay Pro M79470-0001, GMT M79830RB-0001, Pelagos M25600TN-0001, Ranger M79950-0001, Black Bay burgundy M7941A1A0RU-0001 and Black Bay54 M79000N-0001. Tax inclusion is unconfirmed; vendor stock flags and automatic future price-validity fields are not used. Black/blue and steel/rubber products were checked separately; no shared-family amount was inherited. Selected evidence fields and request times are in `source-evidence/tudor-uae-direct-pass2.json`.

Omega Diver300M210.30.42.20.01.001 has original INR690300 regular/list retail in the successfully retrieved Kamal collection's exact reference/SKU data. It is not labelled manufacturer MRP/MSRP. Omega's manufacturer locator corroborates the company, but full authority caches are old/conflicting; the source dialog explicitly preserves this limitation. A later rate-limited product request did not refresh the successful collection observation or its authority. Mismatched ArtOfTime black/blue descriptions were excluded despite usable INR amounts.

New Cartier WSTA0108 and WSSA0086 configurations have primary manufacturer descriptions and older UAE price evidence (five/nine-month caches). **Current Cartier retail stays unavailable.** The two amounts have `status=archived_research`, a required reason and separate expandable older-evidence panels. They never enter headline retail, price-filter matching, comparison, coverage retail counts, premiums or historical series. Their review dates describe reading cached text; manufacturer price-effective dates remain unknown. These are not dated historical prices suitable for a chart.

No additional licensed photo was approved this pass. Real Cartier case4240/3800 photos lack a supported exact commercial-reference/strap crosswalk; an Omega3518.50 photo lacks reviewed manufacturer configuration evidence. They remain held. Images from MRK, Cartier or Kamal were not copied under assumed permission. The two new Cartier entries display image-unavailable states.

The reviewed assembly is `source-evidence/retail-gap-expansion.json`. All records remain isolated research data pending rights, authority/freshness revalidation where noted and editorial publication; no data feed or stock verification is connected.

## Connecting production

For TheWatchAPI: obtain a server API key, authenticated endpoint/schema, commercial storage/display terms and written coverage of photos, technical fields and price-history geography. Test with the existing protected provider evaluator before writing an adapter mapping. Keep `THEWATCHAPI_ENABLED=false` until that test succeeds. Separately obtain original India/UAE retail observations, dealer-listing consent and documented sale evidence. Rights-approved records must be imported as drafts through the editor, reviewed, then published; switching DATA_MODE alone never promotes this research catalogue.
