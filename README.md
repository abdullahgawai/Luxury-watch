# Luxury Watch Explorer

An original, independent watch research application for India and the UAE. The working identity is configured through `SITE_NAME`. This project lives separately from the pre-existing Python commerce application; its existing changes were preserved.

## Start locally

Requires Node >=22.13, Git for Sites source publication, and the locked dependencies in package-lock.json.

```powershell
cd 'C:\Users\abdul\OneDrive\文档\assessment\luxury-watch-explorer'
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_organic_micromax.sql
npm run dev
```

Apply the migration once to a fresh local database; do not replay it on an already migrated database. Development prints http://127.0.0.1:5173/. If this Windows npm shim fails, run its JavaScript entrypoint directly:

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
- Stable configuration pages, sourced specifications, plain-language glossary, brand pages, methodology and field/source disclosures.
- Separate India/INR and UAE/AED panels for retail, dealer/private asks, estimates, verified sales and dealer purchase offers. Twenty-two official regional retail research snapshots cover eleven exact configurations in both markets; no live feed is claimed. Cached checks disclose unknown price-effective dates and never become historical trends.
- Deterministic comparable asking ranges, freshness, minor-unit money and provenance-preserving FX logic; no active FX feed.
- 2–3 configuration comparison with contained mobile horizontal scrolling; device-local favourites and market persistence.
- Source-bound history plot and accessible table when at least two comparable actual observations exist; no invented preview history.
- D1 schema/migration, validated idempotent drafts, review/publication/withdrawal, immutable configuration identity, snapshots, audit history and rollback to draft.
- Server-side authenticated editor allowlist, same-origin mutation checks, bounded inputs and correction rate limits. Working correction receipt and moderation workflow.
- Disabled-by-default server TheWatchAPI evaluation adapter with timeout, quota guard and unresolved candidates; no credentials or claimed live integration.
- Metadata, canonical paths, production catalogue sitemap, preview no-index policy, graceful error and 404 handling, reduced-motion support and basic security response headers.

## Validate

```powershell
node node_modules/typescript/bin/tsc --noEmit
node --test tests/domain.test.mjs tests/editorial.test.mjs
node scripts/run-framework.mjs build
```

The integration suite runs the actual editorial handler against transactional SQLite with the D1 interface. It uses Node's experimental SQLite support only for tests; the application runtime uses D1. See [verification evidence](docs/VERIFICATION.md).

## Honest launch status

This is a functional private development release, **not ready for public launch**. It has 34 distinct researched references / 35 configurations, eight openly licensed photos covering seven configurations, and 22 original local retail research snapshots for eleven exact configurations. Other price/photo gaps stay unavailable. Production mode starts empty and cannot serve the preview catalogue. No subscriptions were purchased; no watch images were copied from brand websites. See [photography rights](docs/PHOTOGRAPHY.md) and [catalogue research](docs/CATALOGUE-RESEARCH.md) for evidence and connection requirements.

See [provider feasibility and connection requirements](docs/PROVIDER-FEASIBILITY.md), [editorial record format](docs/IMPORT-FORMAT.md) and [operations/launch runbook](docs/RUNBOOK.md). P1 accounts/enquiries and P2 professional tools are deliberately left for later roadmap stages.
