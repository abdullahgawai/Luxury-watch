# Reviewed record contract

Use the authenticated editorial import form or `POST /api/admin/imports`.

Top-level fields:

| Field | Meaning |
| --- | --- |
| id | Stable lowercase letters/digits/hyphens, 3–101 characters |
| brand, model, reference | Sourced product identity strings |
| dial, bracelet, material | Exact configuration strings, not model-family guesses |
| size | Width/diameter in millimetres, or null |
| movement, calibre, bezel | Sourced string, or null |
| powerReserve, waterResistance | Hours/metres respectively, or null |
| description | Original factual editorial explanation |
| aliases, collections | Arrays of curated strings; nicknames are search aids |
| demo | false for any production import |
| evidence | Map from every known specification/identity/description field to a source ID |
| sources | Source records described below |
| prices | Original observations, or an empty array |
| image | Approved primary asset metadata, or null; must belong to images when gallery exists |
| images | Optional gallery, maximum 12; each image requires local url, alt, holder, permission, rights=approved, variantId matching record id, reference, matchStatus=approved, matchEvidence, license, HTTPS licenseUrl/sourceUrl and changes. Include width/height, optional thumbnail and originalUrl for the public gallery |

Source fields: `id`, `title`, HTTPS `url`, `category` (manufacturer, authorised_retailer, dealer, private_seller, provider, auction, editorial), `rights=approved`, `permission` describing the permission/contract, `checkedAt` in ISO UTC, and `method`. Attach authorisation evidence to a source declared as an authorised retailer; classification is an editor’s evidenced responsibility, not an automatic verification badge.

An `authorised_retailer` source requires `authorisation: {url, title, evidence, checkedAt}`. The URL must use the corresponding supported manufacturer's domain (Rolex, Omega, Cartier or Tudor), with a valid non-future date and explicit retailer relationship. Source authority is scoped to the brand: a Tudor listing does not establish Cartier authority. Adding another brand requires reviewing the manufacturer-domain allowlist. Retail prices from these sources require `sellerType=authorised_retailer` and `retailBasis`, preserving MRP versus displayed list price, promotion exclusions and whether manufacturer RRP is known. The UI exposes this evidence without issuing a seller-verification badge.

Every price requires `id`, matching `variantId`, `type`, positive integer `amountMinor`, ISO `currency`, `country` (`IN`, `AE`, `GLOBAL`), `condition`, `boxPapers`, `sellerType`, `taxStatus`, `observedAt`, `checkedAt`, `sourceId`, and `evidence`. Optional listings use a globally stable `listingKey`; removed/excluded records remain literal. Verified sales require `saleEvidence`, including fee/tax basis. Provider estimates require `provider` and `assumptions`.

Never enter conversions into original observation records. India uses INR and UAE uses AED. USD global values stay global. Supply historical observations only where the licence permits retention; the UI groups type, country, currency, condition, box/papers, seller type and source before plotting.

When supplied, `configurationId` must match the record; `configurationMatch` must contain matching reference, dial, bracelet, material and size. Use `retrievalMethod=cached_web_research`, `publisherEffectiveAt=null` and an optional `retrievalCacheAgeLabel` for reviewed cached content. Checked dates describe your evidence review, not a live fetch or inferred manufacturer effective date. Cached research checks are explicitly disclosed and excluded from historical series. Public price surfaces exclude draft, removed, excluded, converted, future-dated, mismatched-variant and wrong-local-currency observations.

Older manufacturer retail text can be retained as `status=archived_research` with `retrievalMethod=cached_web_research` and a nonempty `archivalReason`. It requires the same exact identity, local currency, source rights and dates as other observations. It is shown only in the detail's separate older-evidence disclosure, never in headline retail, price filters, comparison, coverage retail counts, premiums or history. A recent review of an old cache is not a new price check. Do not fabricate an approximate publisher-effective date from a search engine's cache-age label.

Image metadata follows the complete gallery contract above and requires positive integer width/height; thumbnail/original links, when supplied, must also be local paths. Primary metadata is validated even when a gallery is present. Add the actual asset under `public/` and rebuild/deploy before publishing its record. The editor workflow is not an image-upload service. A photo must match the variant; a different dial or bracelet cannot be recoloured or relabelled to fit.

Imports are bounded to 150KB, 30 sources, 100 observations and 30 aliases per record. Large historical backfills require a separate ingestion path and review rather than bypassing these controls. Variant identity is immutable; create a new record and withdraw the wrong configuration if identity mapping changes. All publication changes preserve revision snapshots.
