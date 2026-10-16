# Luxury Watch Explorer

An original, independent watch research application for India and the UAE. The working identity is configured through `SITE_NAME`. This project lives separately from the pre-existing Python commerce application; its existing changes were preserved.

## Start locally

Requires Node >=22.13, Git for Sites source publication, and the locked dependencies in package-lock.json.

```powershell
cd 'C:\Users\abdul\OneDrive\文档\assessment\luxury-watch-explorer'
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_micromax.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_editorial_queue_indexes.sql
npm run dev
```

Apply both migrations once, in order, to a fresh local database. For a database already on 0000, apply only 0001; do not replay a migration that has succeeded. Development prints http://127.0.0.1:5173/. If this Windows npm shim fails, run its JavaScript entrypoint directly:

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run install:ci
node scripts/run-framework.mjs build
node scripts/run-framework.mjs dev
```

For the built Worker use `npm start` (prints its local URL). Local persistence is in ignored `.wrangler/state`. Hosted persistence is a separate Sites-provisioned D1 database. No runtime data, API token, local auth cookie or local database is included in the source archive.

Optional ignored `.dev.vars`:

```dotenv
DATA_MODE=demo
SITE_NAME=Luxury Watch Explorer
EDITOR_USER_IDS=local_seedy
```

Local `/signin-with-chatgpt?return_to=/admin` simulates the supplied starter's loopback-only development identity. The hosted Site uses actual Sites sign-in and an explicit allowlist of stable editor IDs. Empty hosted allowlist denies all editors. Never configure the mock ID as a hosted editor.

## Implemented

- Boutique homepage with original forest/ivory/champagne composition and responsive search.
- Brand/model/reference/alias search; exact-reference ranking; brand, size, material, movement, collection and original local retail filters; URL search state and helpful empty results.
- Keyboard and touch configuration suggestions on homepage and catalogue search, with separate dial/bracelet labels, preserved market links and punctuation-free reference matching. Suggestions use the existing filtered catalogue and never imply stock or pricing.
- Stable configuration pages, sourced specifications, plain-language glossary, brand pages, methodology and field/source disclosures.
- Separate India/INR and UAE/AED panels for retail, dealer/private asks, estimates, verified sales and dealer purchase offers. Forty-three original local retail research observations (19 India, 24 UAE) are eligible, with three archived Cartier observations excluded from current pricing; no live feed is claimed. Cached checks disclose unknown price-effective dates and never become historical trends.
- Deterministic comparable asking ranges, freshness, minor-unit money and provenance-preserving FX logic; no active FX feed.
- 2–3 configuration comparison with contained mobile horizontal scrolling; device-local favourites, cross-tab save updates and explicit storage-failure warnings. Market-aware navigation/search and comparison URLs preserve exact selection order, removals and empty selections after reload. Unavailable saved configurations are retained without invented details.
- Source-bound history plot and accessible table when at least two comparable actual observations exist; no invented preview history.
- Shared history API/UI policy with explicit source retention permission and observation review, separate tax/fee/provider/offer bases, duplicate-check collapse and conflicting-timestamp exclusion. Global histories retain their original scope/currency; all current research histories remain unavailable.
- D1 schema/migration, validated idempotent drafts, review/publication/withdrawal, immutable configuration identity, snapshots, audit history and rollback to draft.
- Paginated editorial queues, pending-correction filters and per-record revision history with explicit restore to draft; older entries stay reachable beyond the previous limits.
- Server-side authenticated editor allowlist, same-origin mutation checks, bounded inputs and correction rate limits. Working correction receipt and moderation workflow, with shared field validation, accessible inline errors and retry-safe UUID receipts.
- Server-side public catalogue projection for pages, client props and APIs: explicit nested display fields, published eligible prices, separately labelled archives and approved exact photos. Internal editorial metadata and history-permission details stay behind editor access. Price APIs validate market/type and include source provenance.
- Editor-only system checks for database readiness, public publication gates, withheld prices/photos, stale price checks and correction backlog; repeatable encrypted synthetic D1 recovery rehearsal (hosted backup/alerts remain unconfigured).
- Disabled-by-default server TheWatchAPI evaluation adapter with timeout, quota guard and unresolved candidates; no credentials or claimed live integration.
- Metadata, canonical paths, production catalogue sitemap, preview no-index policy, graceful error and 404 handling, reduced-motion support and basic security response headers.

## Validate

Approved photographs handle delivery failures across the homepage, catalogue, gallery and credits. A missing thumbnail can use the same photograph's full-size derivative; failed gallery images show an unavailable state with retained attribution and a working explicit retry.

```powershell
node node_modules/typescript/bin/tsc --noEmit
node --test tests/*.test.mjs
node scripts/run-framework.mjs build
```

The integration suite runs the actual editorial handler against transactional SQLite with the D1 interface. It uses Node's experimental SQLite support only for tests; the application runtime uses D1. See [verification evidence](docs/VERIFICATION.md).

## Honest launch status

This is a functional private development release, **not ready for public launch**. It has 38 distinct researched references / 39 configurations, ten openly licensed photos covering nine configurations, and 43 eligible original local retail research observations (19 India,24 UAE), plus three separately archived Cartier source records. Other price/photo gaps stay unavailable. Production mode starts empty and cannot serve the preview catalogue. No subscriptions were purchased; no watch images were copied from brand websites. See [photography rights](docs/PHOTOGRAPHY.md) and [catalogue research](docs/CATALOGUE-RESEARCH.md) for evidence and connection requirements.

See [provider feasibility and connection requirements](docs/PROVIDER-FEASIBILITY.md), [editorial record format](docs/IMPORT-FORMAT.md) and [operations/launch runbook](docs/RUNBOOK.md). P1 accounts/enquiries and P2 professional tools are deliberately left for later roadmap stages.
