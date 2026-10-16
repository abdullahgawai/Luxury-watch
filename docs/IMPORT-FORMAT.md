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

Treat display fields as public text: source `permission` is a public permission summary; source/observation evidence, method, attribution and configuration notes must be reviewed for publication. Do not put credentials, private contracts or customer contacts in these fields or their URLs. Public projection is an explicit field boundary, not an automatic personal-data redactor for text intentionally submitted as public content.

Public reads no longer return the stored payload wholesale. Unknown fields, internal notes/costs/contacts, extra nested metadata and source `historyPermission` details are omitted from browser props and public APIs; the original protected payload and audit history remain intact. Approved history permission becomes only `historyAllowed=true` plus the server-derived `historyPermissionRecorded=true`. Supplying that derived flag on import cannot replace the required source permission text or review.

Draft/review, removed, excluded, converted, future-dated, malformed, duplicate-ID, mismatched and unsupported price rows are withheld on public reads. Archived evidence remains a separate explicitly labelled record. Unapproved or mismatched primary photos remain unavailable; a different primary is not silently selected. Optional unsupported specifications become null, while records lacking essential sourced configuration identity are withheld. Production also requires approved source rights and excludes demonstration records. Correct underlying evidence through the protected workflow; the public reader never rewrites it or refreshes dates.

An `authorised_retailer` source requires `authorisation: {url, title, evidence, checkedAt}`. The URL must use the corresponding supported manufacturer's domain (Rolex, Omega, Cartier or Tudor), with a valid non-future date and explicit retailer relationship. Source authority is scoped to the brand: a Tudor listing does not establish Cartier authority. Adding another brand requires reviewing the manufacturer-domain allowlist. Retail prices from these sources require `sellerType=authorised_retailer` and `retailBasis`, preserving MRP versus displayed list price, promotion exclusions and whether manufacturer RRP is known. The UI exposes this evidence without issuing a seller-verification badge.

Every price requires `id`, matching `variantId`, `type`, positive integer `amountMinor`, ISO `currency`, `country` (`IN`, `AE`, `GLOBAL`), `condition`, `boxPapers`, `sellerType`, `taxStatus`, `observedAt`, `checkedAt`, `sourceId`, and `evidence`. Optional listings use a globally stable `listingKey`; removed/excluded records remain literal. Verified sales require `saleEvidence`, including fee/tax basis. Provider estimates require `provider` and `assumptions`.

Never enter conversions into original observation records. India uses INR and UAE uses AED. USD global values stay global. Supply historical observations only where the licence permits retention; the UI groups type, country, currency, condition, box/papers, seller type and source before plotting.

History is opt-in. Source `historyAllowed=true` requires approved rights and nonempty `historyPermission` (maximum 2000 characters) describing permission to retain and display historical data. Do not include confidential contract text or credentials. Each historical observation also needs `historyEligible=true` after evidence review. Omitting either approval keeps that record out of history without preventing an otherwise valid ordinary price from being published. Older records are not automatically promoted.

History requires known condition, box/papers, seller type and tax basis, bounded comparison text (500 characters per field), a full original timestamp with UTC/offset and a subsequent check. Retail history requires `retailBasis`; verified-sale history requires `feeBasis` as well as completed-sale evidence. Estimates require provider and assumptions. Asking and dealer purchase histories require a stable original `listingKey` identifying the individual offer; never put customer details in that key. Research snapshots and demo records cannot be approved for history. These declarations record editorial review, not automatic licence verification.

Series separate all comparison fields, including tax/fee basis, provider assumptions and individual offer identity. Equal instants with the same amount collapse to one point, retaining the latest successful check; different amounts at one instant are withheld for review. Neither operation changes stored records or dates. At least two distinct eligible instants must remain before a chart or historical API observation list is available. The view contains actual points only, exact minor-unit amounts, explicit IST dates, source checks and a table; no connecting line, inferred transactions, FX or forecast is created.

When supplied, `configurationId` must match the record; `configurationMatch` must contain matching reference, dial, bracelet, material and size. Use `retrievalMethod=cached_web_research`, `publisherEffectiveAt=null` and an optional `retrievalCacheAgeLabel` for reviewed cached content. Checked dates describe your evidence review, not a live fetch or inferred manufacturer effective date. Cached research checks are explicitly disclosed and excluded from historical series. Public price surfaces exclude draft, removed, excluded, converted, future-dated, mismatched-variant and wrong-local-currency observations.

Older manufacturer retail text can be retained as `status=archived_research` with `retrievalMethod=cached_web_research` and a nonempty `archivalReason`. It requires the same exact identity, local currency, source rights and dates as other observations. It is shown only in the detail's separate older-evidence disclosure, never in headline retail, price filters, comparison, coverage retail counts, premiums or history. A recent review of an old cache is not a new price check. Do not fabricate an approximate publisher-effective date from a search engine's cache-age label.

Image metadata follows the complete gallery contract above and requires positive integer width/height; thumbnail/original links, when supplied, must also be local paths. Primary metadata is validated even when a gallery is present. Add the actual asset under `public/` and rebuild/deploy before publishing its record. The editor workflow is not an image-upload service. A photo must match the variant; a different dial or bracelet cannot be recoloured or relabelled to fit.

Imports are bounded to 150KB, 30 sources, 100 observations and 30 aliases per record. Large historical backfills require a separate ingestion path and review rather than bypassing these controls. Variant identity is immutable; create a new record and withdraw the wrong configuration if identity mapping changes. All publication changes preserve revision snapshots.

Direct point-in-time source observations use `retrievalMethod=direct_source_snapshot`, `httpStatus=200`, a 64-character hexadecimal `responseSha256` of the decoded response, matching `configurationId` and the complete `configurationMatch`. These fields survive research assembly and protected import validation. A checksum records the retrieved response; it does not establish accuracy, publication rights, stock or a live integration. The effective date stays unavailable and these snapshots never generate history.

Research-only `retailCoverageReviews` may record an unsuccessful exact-reference retail search separately from all price observations. Each requires matching variant/reference, IN/AE country, HTTPS source URL, non-future `reviewedAt`, outcome and reason; `different_reference` also identifies a different offered reference. Price/currency/observed/check fields are prohibited. These reviews are rejected by production imports and never update prices, specs, licence checks or history. Public notes are hidden when a qualifying retail observation exists for that market.

When a source exposes the priced product's reference, retain it as `sourceProductReference` on the observation. Research assembly and protected record validation reject it if it differs from the catalogue reference, even when the requested URL or other metadata contains the old reference. A successful HTTP response is insufficient evidence of an exact product match.
