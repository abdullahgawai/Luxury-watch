# Hosted code rollback rehearsal

Performed 17 October 2026 on the owner-private Luxury Watch Explorer preview. The audience remained one explicitly allowed owner, no groups and no external visitors. No database writes, schema migrations, runtime settings or source evidence edits were requested by this rehearsal.

## Compatibility and saved artifacts

Project: `appgprj_6acfc225453c819183576b7ab26bd771`.

- Starting/current saved version 38: `appgprj_6acfc225453c819183576b7ab26bd771~appgver_d2b95cab51408191b916655d982454c9`; source `de625bbe833c94bdbd9511de829fc2ae161bd7bc`.
- Rollback saved version 37: `appgprj_6acfc225453c819183576b7ab26bd771~appgver_a175d3806c84819188f83db8c2602ceb`; source `d7395bede2598e4227e18a901bc94c93b8720dba`.
- Both had saved build archives and previously successful deployments using environment revision 2. The Git diff contained documentation, the asset-budget checker/configuration/tests and build-script/package-script changes. There were no application, catalogue, hosting-manifest or migration changes between these commits.

## Executed recovery

| Step | Saved version | Native deployment result | Completion time |
| --- | --- | --- | --- |
| Redeploy previous saved release | 37 | `succeeded` · `appgdep_6ad3487445448191abf497be1d759a3f` | 17 October 2026, 15:35:57 IST |
| Restore starting release | 38 | `succeeded` · `appgdep_6ad348ac61788191a0ec4a71c0aec649` | 17 October 2026, 15:36:52 IST |

Both results confirmed environment revision 2 and the same private preview URL. No version was re-created to perform either redeployment. The source branch stayed at the starting commit throughout the two operations.

Browser smoke check after rollback and again after restoration: Cartier WSTA0041 exact configuration, UAE market. The complete rendered pricing-section text was identical. Official retail remained unavailable; the source-coverage review retained 16 October 2026 IST and its WSTA0109 priced-offer conflict explanation. Asking prices, verified sales and history remained unavailable; the exact-configuration photo remained unavailable. No replacement amount or photograph was supplied. Screenshot after restoration: [restored preview](rollback-restored-preview.png).

## Limits and follow-up

This demonstrates reusing saved compatible code artifacts and restoring the starting code release. It does not demonstrate rollback across a schema change, secret/environment rollback, hosted data restore, backup retention, public-traffic availability, an outage recovery-time guarantee or a full journey regression test. A deployment result confirms the selected saved version; the unchanged UI alone cannot identify a build.

The follow-up documentation commit is published as a new saved release after this rehearsal. Repeat compatibility review and targeted smoke checks for any future rollback; do not blindly reuse these historical version IDs for a different incident. Hosted backup/restore, monitoring, stable editor provisioning and production data permissions remain open launch gates.
