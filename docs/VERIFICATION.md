# Verification evidence

Verified locally on 14–15 October 2026 (India time). Hosted deployment status is recorded separately by the Sites tools.

## Automated checks

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` — passed.
- Domain/editorial/catalogue/retail: `node --test tests/*.test.mjs` — **32 tests passed**, including asset checksum/licence/configuration validation, primary/gallery metadata consistency, original local amounts, regional source matching, cached-history exclusion, public observation filtering and production research isolation.
- Deployable Vinext/Sites Worker: `node scripts/run-framework.mjs build` — passed. The Sites starter's build integration is retained. A middleware convention deprecation was noted; it does not fail this locked build.
- Local D1 migration — all 14 schema statements applied successfully.
- Local homepage — HTTP 200.

Tests verify five-listing threshold; deduplication; distinct configurations, countries, currencies, conditions, box/papers, seller types and price types; stale/future dates; removed/excluded listings; integer-minor-unit FX with preserved global scope and stale-rate flags; valid premium denominators; missing price filters; aliases/references; publication provenance and rights gate; anonymous/non-editor denial; cross-origin denial; idempotency; draft/review/publication; revision conflicts; source retention; rollback; correction validation/moderation/rate limits; disabled provider state; immutable variant identity.

## Browser checks

Performed in the Codex in-app browser against the actual local application:

- Homepage search for “Starbucks” produced the exact 126610LV configuration. Search URL was retained. A hydration flash was found and fixed by passing server query state.
- Detail displayed its black dial/Oyster bracelet/green bezel specification evidence.
- Saved a watch, navigated away and confirmed it remained in saved watches.
- Added two configurations, opened comparison and checked the specification table.
- Switched to UAE; headings, selected market, currency and unavailable-local-data labels changed together. Market persisted across page navigation.
- 360px comparison document width remained 345px; the 670px table overflow stayed inside its comparison region.
- Homepage widths: 360→345, 390→375, 768→753, 1024→1009, 1440→1425 document pixels (the difference is the scrollbar). No whole-page horizontal overflow.
- Visually reviewed mobile at 360/390, tablet at 768 and desktop at 1440. Tablet art overlap was corrected; mobile search was moved into the hero. Long Omega model/reference rendered in the catalogue.
- Public test correction returned a receipt. Direct local D1 query confirmed its moderation state as pending. This labelled QA submission is local only and is not included in deployment data.
- Anonymous editor page displayed access denial; no queue/correction contact data was exposed.
- Browser console review during the main journey showed no application errors.

## Accessibility and performance boundaries

Semantic landmarks/headings/tables, visible focus CSS, labelled inputs, native select controls, keyboard-operable disclosures and comparison region, skip link, status announcements, and prefers-reduced-motion rules are implemented. Core text uses forest/ivory or muted/light pairings; champagne is decorative. Native price-source dialogs provide Escape dismissal. A full assistive-technology/WCAG audit and 200% zoom review are still required; do not claim certified WCAG compliance.

There is no remote photography/font dependency in the preview. Ten licensed photographs are served locally as optimised WebP files; cards lazy-load smaller derivatives, the hero has fetch priority and reserved dimensions, and originals are offered separately. Placeholders reserve height where no matched photo exists. Production mobile LCP/INP/CLS p75 is **not measured** and cannot be established from a local visual review. Run performance/accessibility tooling against the intended public environment and collect field data after launch.

No credentialed provider coverage/latency/quota test, public local-price acceptance test, actual hosted editor-role test or scheduled hosted backup/restore rehearsal has been completed. These gates need the inputs listed in the feasibility report and runbook. Licensed-image checks now verify recorded attribution/licences, exact variant binding and original file checksums.

## Catalogue and photography update

- Manufacturer-sourced research preview validates 36 distinct references / 37 configurations; every record is excluded from production imports.
- Search 126000 returns med-blue and silver configurations separately. Saving and comparing them persists across navigation. India retail appears only on med-blue; UAE switch shows AED 26,950 only there. Silver remains unavailable in both markets.
- Photo enlargement opens a native modal; Escape dismisses it and restores focus. The two-photo Moonwatch gallery changes the image and corresponding attribution together.
- UAE evidence dialog links the regional manufacturer source and discloses cached retrieval, condition basis, checked date and unconfirmed taxes.
- Desktop 1440px homepage has loaded local photography and no document overflow. Mobile 390px detail document is 375px including scrollbar allowance; the long Moonwatch title wraps within the layout.

- Further expansion: Air-King, blue Planet Ocean and Reduced photos were visually checked; the Explorer replacement-strap photo was excluded. Coverage page shows 34 references, 35 configurations, seven photo-backed configurations and eleven retail snapshots per country.
- New Air-King detail switches between INR793,500 and AED32,650 with the correct regional source, source-check date, condition basis, cache-age disclosure and unverified-live-price note. Source dialog opens and Escape restores the page.
- Reduced search accepts abbreviated3510.50 and resolves full3510.50.00; its image modal supports Escape while local retail and unreviewed bezel details remain unavailable.
- Mobile comparison at390px keeps a670px table inside a334px scroll region; document width375px. Source/condition/currency/check dates remain attached to Air-King retail while Reduced remains unavailable.
- Cached snapshots are excluded from historical series. Draft/removed/excluded/converted/future/mismatched-price records do not populate public cards, filters, price panels or market rows.

## Non-Rolex expansion — 15 October 2026

- 28 automated tests pass: two Tudor India MRPs and three Omega UAE amounts, exact configuration/product-URL and country bindings, manufacturer-domain retailer authorisation, original currency and unchanged check dates, production isolation and history exclusion. Existing persistence, editor permissions and correction-handler tests also pass.
- Cartier WSTA0040 and WSTA0056 are separate from the existing quartz silver model. Two real CC BY-SA photographs were visually reviewed, with original checksums verified. Their commercial-reference mappings are explicitly disclosed as visual inferences; strap originality/internal components remain unverified. XL reserve and unreviewed bezel fields remain unavailable.
- Browser checked the Cartier photo modal/Escape, saving across navigation and a three-watch Cartier/Omega/Tudor comparison. At390px the document width is375px; the670px comparison table stays inside its334px scroll region.
- Omega blue Planet Ocean UAE shows AED32700, retailer list-price basis, promotion exclusion, tax basis, checked date/cache age and the linked Omega manufacturer retailer locator in the source dialog. Switching to India shows unavailable. Tudor Black Bay54 India shows INR437200 and the separate Tudor manufacturer locator; UAE stays unavailable.
- Coverage page reports36 references/37 configurations, nine configurations with ten licensed photos,13 India and14 UAE retail observations; per-brand unavailable states agree with underlying records.
- Addressed observed initial-load interaction failures by disabling photo/source/market controls until hydration; save/compare controls wait for device preferences. Comparison initial render reads URL identifiers rather than briefly claiming the selection is empty. The saved Cartier entry persisted across navigation.
- Desktop screenshot: `docs/screenshots/cartier-licensed-photo.png`. Full-page screenshot API failed on this host; native viewport capture succeeded. Desktop visual review and mobile DOM measurements are recorded; no field performance or full WCAG compliance is claimed.

## Remaining-market pass — 15 October 2026

- 32 tests pass, including six new Tudor UAE exact-SKU amounts, one Omega India original-INR list price, separate older Cartier evidence, URL-to-variant source bindings and the existing editorial persistence/access controls. Original source dates remain unchanged after failed requests.
- Coverage:38 references/39 configurations;34 eligible local retail research observations (14 India,20 UAE) across20 configurations; two archived Cartier amounts excluded from those counts. Ten licensed photos remain across nine configurations; no new asset was approved under an uncertain commercial-reference mapping.
- Browser verified Tudor Black Bay54 AED16920 with its own black steel product URL and Tudor retailer-group locator. India switch preserves INR437200 and the separate Exclusive Lines source. Omega Diver300M India shows INR690300 as regular/list retail, with its manufacturer's older/conflicting authority-cache limitation visible in the evidence dialog.
- Cartier WSTA0108 current retail is unavailable. Its expandable older evidence shows AED14600, five-month source-cache age, reviewed date, unknown publisher-effective date and manufacturer source link. It does not become a current-price filter result. WSSA0086 likewise retains AED17500/nine-month evidence separately; neither inherits another Cartier's photograph.
- A three-watch mobile comparison immediately renders URL-selected Tudor/Omega/Cartier configurations. UAE prices are16920/27450/unavailable; the archived Cartier amount is absent. At390px document width375px and670px table stays within334px scroll region. Omega detail also has no document overflow at390px.
- Source dialogs are keyboard-dismissable with Escape and now show the formatted amount and exact watch reference before the source narrative. Older source records remain excluded from freshness, premiums and history as well as headline retail and comparisons.

## Current Cartier pass — 15 October 2026

- 35 automated tests pass, including four exact Cartier amounts, current manufacturer retailer-locator evidence, fingerprint validation, failed-retry date preservation, archive separation, source/country/configuration binding and production isolation. Existing editorial access and correction-handler tests pass.
- TypeScript and production build pass. Browser verified Santos UAE AED30900, its price evidence dialog and Cartier retailer locator, India switch INR870000, and the black Tank UAE AED15000 with a separate older-evidence disclosure.
- At390px, the Cartier page document width and scroll width both measure375px. No document overflow. Source modal closes with Escape. Screenshot: `screenshots/cartier-current-source.png`.
- No new photo was approved without adequate exact-configuration evidence. Photos, cache limitations and unavailable data retain their existing disclosures. This is a private research preview; no full WCAG audit, field performance validation or public-launch readiness is claimed.

## Cartier India gaps — 15 October 2026

-38 tests pass, including originalINR/tax/MRP basis, exact reference and configuration checks, successful response fingerprints/dates, rejection of incomplete direct-source evidence, Art Of Time manufacturer authority, unsupported Tank India gaps and unchanged UAE counts. Existing persistence, correction and editor-access tests pass. TypeScript and production build pass.
- Browser QA used the built Worker locally: Tank XL shows INR590000 with Exclusive Lines MRP/tax/source and Cartier locator; switching to UAE shows unavailable. WSTA0041 shows INR404000 and its own Art Of Time source/Cartier Mumbai locator. Escape closes source dialogs.
- A390px three-watch comparison displays404000/590000/493000 INR with independent sources. The670px table remains in its334px scroll container; document width and scroll width are both375px. Screenshot `screenshots/cartier-india-current.png` shows the new Tank XL pricing/date/tax basis.
- No new photo qualified. Matching limitations, missing India prices and production data/permission gates remain explicit. No field performance measurement or full accessibility certification is claimed.

## Remaining Cartier gaps — 15 October 2026

-41 automated tests pass. Added checks cover WSTA0108 INR423000, exact source/date/hash/tax basis, unchanged UAE15000 and separate archived14600 evidence, and Tank XL cachedAED20800 exclusion from current-price filters/comparison/history/premiums. Existing access, persistence and corrections tests pass. TypeScript passes.
- No new exact licensed photo qualified. Missing-photo states and existing visual-match disclosures are preserved. New cached evidence cannot imply a live source check or stock verification.
- Production build passes. Browser verified WSTA0108 India INR423000 source dialog, Cartier locator, check date and inclusive-tax basis. Tank XL UAE remains current-retail unavailable while the separate archive shows AED20800, two-day cache label and direct-request429 limitation. UAE comparison shows unavailable/15000 rather than20800/15000. At390px both document widths measure375px. Screenshot: `screenshots/cartier-black-tank-india.png`.

## Configuration coverage acceptance — 16 October 2026

-41 automated tests and TypeScript pass. Existing tests cover price eligibility, excluded archives/FX, image licence metadata, persistent editorial records, access controls and correction moderation.
- Desktop at1440px: document width1425px; coverage table and container both1222px after the width correction, with all four columns visible. Cartier filters return3 UAE gaps,1 India gap and4 missing-photo configurations. Dates, source links, tax/condition/currency and the existing photographic-match caveats remain visible.
- Mobile at390px: document width375px;880px table is contained in a334px horizontal region. The UAE evidence link opens exact WSTA0041 in marketAE and retains its unavailable price/photo states. No fresh price/source-check dates or photo approvals were created by these UI checks.
- Final production build passes. The explicit keyboard handler moves the focused mobile table240px right and back to0 with Left. No document overflow. The final desktop screenshot `screenshots/cartier-uae-coverage.png` shows all four columns, the three unavailable Cartier UAE configurations, dated India sources, separate archive count and photo limitations.

## Current Cartier Tank XL UAE and shareable coverage — 16 October 2026

-43 tests pass, including exact originalAED20800, successful HTTP status/response fingerprint, retained manufacturer-authorisation date, unchanged archive, production isolation, current-price filter eligibility and exclusion from historical series. TypeScript and production build pass.
- Browser verified price/source modal with16OctoberIST current date, tax inclusion and original15October authority date. UAE comparison shows20800/15000 for TankXL/blackTank; no archived point appears. Current-retail gaps now show2 Cartier configurations.
- Coverage URL filters load from the initial request and update the URL on change, preserving the anchor. Cartier missing-photo filter survives reload and returns4; invalid brand/gap values fall back to39 configurations. At390px, document width375px and880px table remains inside334px region. Temporary viewport reset after QA.
- Screenshot `screenshots/cartier-tank-xl-uae-current.png`. No new photo licence qualified; exact asset/licence requirements are in CARTIER-ASSET-REQUIREMENTS.md. No public-launch or live-feed claim.

## Two remaining Cartier UAE source checks — 16 October 2026

-46 automated tests pass. New checks prevent coverage-review timestamps or mismatched offered references from becoming prices, historical points, source rechecks or production records. Price fields/currency/future dates/wrong variants are rejected in gap reviews. Explicit sourceProductReference mismatches fail both research assembly and protected imports. TypeScript and production build pass.
- Browser verified WSTA0041 UAE unavailable with16October coverage-review date and offeredWSTA0109 explanation; India switch shows the originalINR404000 and15October price check with no UAE gap note. WSTA0056 UAE likewise remains unavailable and identifies the pricedWSTA0115 conflict. Its existing photographic matching caveat is unchanged.
- Mobile coverage shows both dated notes and source links in the correct UAE column. At390px document width375px;880px table remains in334px container. No document overflow. Temporary viewport reset. Screenshot: `screenshots/cartier-wsta0041-gap-evidence.png`.
- No current price, licence check date or photo approval was inferred from successful HTTP responses. Public launch still requires rights-approved production data and operational acceptance.

### Hosted startup repair

The first deployment of the gap notes failed at module initialisation because production Workers can report Date.now()=0 before request I/O, unlike the local preview. Static research attachment now validates structure without relying on a wall clock. Each catalogue request filters future-dated reviews using its request clock; protected import validation still rejects future dates and production review promotion. A regression test loads the full catalogue with Date.now mocked to0, then verifies before/after request snapshots.47 tests pass. No source dates, prices or licence decisions were changed by this repair.

Runtime reference: https://developers.cloudflare.com/workers/runtime-apis/performance/ and https://github.com/cloudflare/workerd/issues/6839 .

## Protected operational checks and recovery rehearsal — 16 October 2026

- 50 automated tests pass. Actual editorial-handler/transactional SQLite tests cover anonymous and outsider health denial, freshness counts, archive exclusion, sanitized database failures and secret/contact non-disclosure. Review/publication preserves archived_research status; archived observations never become current retail.
- TypeScript and production build pass. Browser tested the real local D1 health endpoint through the existing loopback-only sign-in: research warning, database status, correction count, explicit unconfigured alerts and unverified hosted restore. The temporary local editor allowlist was removed after testing; no hosted mock editor was configured.
- Desktop 1440px/document 1425px and mobile 390px/document 375px: no document overflow. Button busy state and keyboard Enter activation work; result has an IST check date and announced status. Screenshots: screenshots/editor-system-checks-desktop.png and screenshots/editor-system-checks-mobile.png. Anonymous API denial also observed in local server output; production-role provisioning remains a launch gate.
- Executed scripts/rehearse-recovery.mjs against two disposable local D1 databases with synthetic data only. All 12 application tables restored identically; source unchanged. AES-256-GCM round trip, wrong-key rejection, tamper rejection, SQLite integrity and foreign-key checks pass. Sanitized report: recovery-rehearsal.json. Export schema precedes data to avoid missing referenced tables; foreign-key checks are deferred during import. Read-only SQLite inspects the restored local file because D1 authorizes neither integrity_check nor a general filesystem inspection API.
- No hosted recovery, durable encrypted backup, alert scheduling or provider integration is claimed. No new watch price, source check date or photography licence was created. Unsupported Cartier prices/photos remain unavailable with existing evidence and dates.
