# Verification evidence

Verified locally on 14–15 October 2026 (India time). Hosted deployment status is recorded separately by the Sites tools.

## Automated checks

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` — passed.
- Domain/editorial: `node --test tests/domain.test.mjs tests/editorial.test.mjs` — **13 tests passed**.
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

There is no remote photography/font dependency in the preview. The hero is CSS with reserved dimensions; product placeholders reserve height. Production mobile LCP/INP/CLS p75 is **not measured** and cannot be established from a local visual review. Run performance/accessibility tooling against the intended public environment and collect field data after launch.

No credentialed provider coverage/latency/quota test, licensed image test, public local-price acceptance test, actual hosted editor-role test or scheduled hosted backup/restore rehearsal has been completed. These gates need the inputs listed in the feasibility report and runbook.
