# Operations and public launch gates

## Boundaries

The hosted release is an owner-private development preview. `DATA_MODE=demo` returns researched preview records; `DATA_MODE=production` returns only database records with `state=published` and `demo=false`. Publishing records does not make the Site public. Do not change audience until the launch gates below pass. Robots and metadata block indexing throughout this initial release.

Production authentication is provided by Sites dispatch. `EDITOR_USER_IDS` must be a comma-separated allowlist of stable authenticated user IDs, configured server-side. The default empty allowlist denies everyone. Local sign-in simulates `local_seedy`, only for loopback development. Put `EDITOR_USER_IDS=local_seedy` in an ignored `.dev.vars` to test locally; never grant this mock ID a hosted editor role. Direct exposure of the Worker bypassing the identity-verifying dispatch is unsupported.

## Editorial workflow

`POST /api/admin/imports`: sends `{record}` and an `Idempotency-Key` of 8–100 ASCII letters/digits/hyphens. Validated imports enter drafts. Exact brand/reference/dial/bracelet/material/size duplication is rejected. Inspect every source and claim before review.

`POST /api/admin/records/:id`: sends `{action,revision}`. A draft goes to review, then to published. `revise` accepts `{record}` only on drafts. `withdraw` returns published records to draft. `rollback` accepts `{targetRevision}` and restores a previous snapshot as a new draft, which requires review again. Every action is audited with actor, before/after values and time. Revision mismatch rejects concurrent writes. Public queries return published records only.

Price amounts are integer minor units; FX rates are decimal strings. Unknown specifications are null. Original prices require exact variant ID, type, source evidence, dates, country, ISO currency, condition, box/papers, seller type and tax status. Mark unknown tax basis literally. Retail requires a manufacturer or evidenced authorised source. Verified sales require completed-transaction evidence. Provider estimates require provider and assumptions. Removed listings cannot become verified sales.

Corrections use a bounded, validated, same-origin JSON endpoint and durable hourly rate limits. They enter pending moderation. Acceptance is not an automatic catalogue edit: apply the supported change through draft/review/publish, then mark resolved. Contact information is editor-only. The current interface displays the last 100 records/corrections/audit events and last 300 revisions; pagination/retention is an operational follow-up if these limits are reached.

## Backup and restoration

Run the repeatable isolated rehearsal with Node 22.13+ and the locked dependencies:

```powershell
node scripts/rehearse-recovery.mjs
```

The script creates two disposable local D1 databases with a random test ID and synthetic rows across all 12 application tables. It exports schema and data separately, creates every referenced table before row insertion, and defers foreign-key checks during import. It encrypts the SQL using AES-256-GCM with a fresh ephemeral key, checks wrong-key/tamper rejection, restores the decrypted archive and compares every application row. Read-only SQLite checks validate the restored local database's integrity and foreign keys; D1's SQL authorizer does not expose integrity_check. It also verifies the source was unchanged. Temporary files and the rehearsal key are removed. This is a recovery test, **not a durable backup command or hosted recovery verification**.

The checked-in sanitized result is `docs/recovery-rehearsal.json`. To refresh it, pass `--report` followed by its absolute JSON path. The report contains counts/digests and check outcomes, never SQL, correction contacts or keys. Real backups must remain outside Git, encrypted and access-restricted; `/backups/` is ignored as an additional precaution. Durable encryption-key custody and recovery access still need an operating owner. Do not use the ephemeral rehearsal key for real backups.

For operator-managed D1 exports, use the installed Wrangler's documented `d1 export` flags; export does not accept `--persist-to`. Export schema/data separately and restore into a disposable database before any live recovery. Match the original migration/schema version. Never restore over the only live copy. Wrangler `--local` commands select local state only.
Hosted D1 is provisioned by Sites. Identify the actual hosted database and operator-managed backup facility before launch; local `--local` commands do not back up hosted data. Configure a daily encrypted backup/retention policy through the chosen host facilities, record an operator and rehearse restore. Scheduled hosted backups, monitoring alerts and the hosted restore rehearsal are **not configured** in this preview; no supplied operations account/budget exists.

## Protected system checks

An allowlisted editor can run System checks in `/admin`, backed by read-only `GET /api/admin/health`. Missing/unauthorised identity gets 403, and unavailable database checks get a sanitized 503. It reports record counts, pending correction count/oldest date, published price freshness (30 days retail, 7 days other types) and hourly provider evaluation count. Archived prices are excluded; malformed/future check dates require review. At most 5000 observation rows are scanned, with an explicit partial-result warning above that limit. Only counts/configuration booleans are returned, never provider credentials, contacts or full audit payloads. The request check date does not refresh any catalogue source date.

These manual checks are not scheduled monitoring. Alerts remain unconfigured and hosted recovery remains unverified even when database checks pass. Research mode is explicitly flagged; published database rows are not a validation of data rights. Publishing/reviewing/withdrawing a record now preserves archived_research observation status throughout the workflow.

## Incidents and rollback

Withdraw an inaccurate record immediately through the protected editor control, retaining audit/history. Investigate the original evidence, stage a correction and re-review. A failed provider fetch never updates existing records or checked dates. Keep provider evaluation disabled if rights, quotas or upstream behaviour are uncertain.

For a UI/server regression, redeploy the last successful saved Sites version using its returned opaque version ID. Do not assume database migrations reverse with code rollback: schema changes are append-only, and failed deployments may already have applied migrations. Data rollback uses the record revision workflow; disaster recovery uses a separately verified backup.

## Remaining before public launch

- Approve brand/domain and operating owner/contact/retention policy.
- Secure specification/price/image permissions and provider contracts.
- Supply credentials through secure runtime settings; test actual coverage and quota/latency on 5–10 references.
- Research coverage now meets 30–50 references: 38 distinct references / 39 configurations. Production rights review and editorial publication are still required. There are 43 eligible local retail research observations (19 India, 24 UAE), plus three archived Cartier records excluded from current retail. Obtain corroborated Cartier/local gaps and establish ongoing original-source checks; research checks are not verified live prices.
- Ten openly licensed photos now cover nine configurations, including two Cartier visual mappings with reference/strap limitations displayed. The remaining 30 configurations still need matched licensed photos; see PHOTOGRAPHY.md for attribution, licence and rejection evidence.
- Configure actual hosted editor IDs; verify hosted role and anonymous denial through dispatch.
- Set production mode and confirm fixtures absent; enable production sitemap/indexing only at launch. Canonical origin and brand-specific metadata need final approved identity.
- Configure error/quota monitoring, spend limits, backups and rehearse a hosted restore and deployment rollback.
- Measure real mobile LCP/INP/CLS at the 75th percentile when field traffic exists. WCAG 2.2 AA requires a full accessibility audit beyond the keyboard, semantics, contrast and responsive checks documented here.
- Review Vinext beta compatibility and production support against the eventual host workload. The supplied Sites starter is used and locked; a framework build alone does not establish production readiness.

P1 customer accounts, cloud saves, alerts/enquiries and moderated dealers, and P2 tenant-isolated professional tools remain later roadmap stages. No active customer enquiry, checkout, verification or dealer-cost control is presented in this release.
