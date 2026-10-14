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

Local D1: export using Wrangler `d1 export DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --output backups/<dated-file>.sql`. Keep backups outside the source repository and access-restricted because they contain optional correction contact details. Verify restoration in a fresh disposable database using `d1 execute ... --file <backup>`. Never restore over the only live copy.

Hosted D1 is provisioned by Sites. Identify the actual hosted database and operator-managed backup facility before launch; local `--local` commands do not back up hosted data. Configure a daily encrypted backup/retention policy through the chosen host facilities, record an operator and rehearse restore. Scheduled hosted backups, monitoring alerts and the hosted restore rehearsal are **not configured** in this preview; no supplied operations account/budget exists.

## Incidents and rollback

Withdraw an inaccurate record immediately through the protected editor control, retaining audit/history. Investigate the original evidence, stage a correction and re-review. A failed provider fetch never updates existing records or checked dates. Keep provider evaluation disabled if rights, quotas or upstream behaviour are uncertain.

For a UI/server regression, redeploy the last successful saved Sites version using its returned opaque version ID. Do not assume database migrations reverse with code rollback: schema changes are append-only, and failed deployments may already have applied migrations. Data rollback uses the record revision workflow; disaster recovery uses a separately verified backup.

## Remaining before public launch

- Approve brand/domain and operating owner/contact/retention policy.
- Secure specification/price/image permissions and provider contracts.
- Supply credentials through secure runtime settings; test actual coverage and quota/latency on 5–10 references.
- Curate 30–50 reviewed references, or explicitly accept revised scope; populate useful original local price examples in **both** markets. Current preview contains four references and zero prices.
- Add accurate licensed photographs with an asset-rights registry.
- Configure actual hosted editor IDs; verify hosted role and anonymous denial through dispatch.
- Set production mode and confirm fixtures absent; enable production sitemap/indexing only at launch. Canonical origin and brand-specific metadata need final approved identity.
- Configure error/quota monitoring, spend limits, backups and rehearse a hosted restore and deployment rollback.
- Measure real mobile LCP/INP/CLS at the 75th percentile when field traffic exists. WCAG 2.2 AA requires a full accessibility audit beyond the keyboard, semantics, contrast and responsive checks documented here.
- Review Vinext beta compatibility and production support against the eventual host workload. The supplied Sites starter is used and locked; a framework build alone does not establish production readiness.

P1 customer accounts, cloud saves, alerts/enquiries and moderated dealers, and P2 tenant-isolated professional tools remain later roadmap stages. No active customer enquiry, checkout, verification or dealer-cost control is presented in this release.
