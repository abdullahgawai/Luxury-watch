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

Every price requires `id`, matching `variantId`, `type`, positive integer `amountMinor`, ISO `currency`, `country` (`IN`, `AE`, `GLOBAL`), `condition`, `boxPapers`, `sellerType`, `taxStatus`, `observedAt`, `checkedAt`, `sourceId`, and `evidence`. Optional listings use a globally stable `listingKey`; removed/excluded records remain literal. Verified sales require `saleEvidence`, including fee/tax basis. Provider estimates require `provider` and `assumptions`.

Never enter conversions into original observation records. India uses INR and UAE uses AED. USD global values stay global. Supply historical observations only where the licence permits retention; the UI groups type, country, currency, condition, box/papers, seller type and source before plotting.

Image metadata follows the complete gallery contract above and requires positive integer width/height; thumbnail/original links, when supplied, must also be local paths. Primary metadata is validated even when a gallery is present. Add the actual asset under `public/` and rebuild/deploy before publishing its record. The editor workflow is not an image-upload service. A photo must match the variant; a different dial or bracelet cannot be recoloured or relabelled to fit.

Imports are bounded to 150KB, 30 sources, 100 observations and 30 aliases per record. Large historical backfills require a separate ingestion path and review rather than bypassing these controls. Variant identity is immutable; create a new record and withdraw the wrong configuration if identity mapping changes. All publication changes preserve revision snapshots.
