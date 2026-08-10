---
title: 'Decision: two assertion blocks were ADDED (not just ported) in migrate-proxy-diamond-tests'
date: 2026-08-10
status: open
decisionFor: migrate-proxy-diamond-tests
needsAnswers: true
---

## Decisions

### Added two assertion blocks beyond a pure port

**Chosen:** while migrating the proxy and diamond integration suites onto `createTestEnvironment`, two new assertion blocks were added on top of the mechanical harness swap:

- `packages/rocketh-proxy/test/proxy.integration.test.ts` (basic ERC173 case): implementation address != proxy address, `deployment.address === <name>_Proxy.address`, merged ABI is larger than the artifact ABI.
- `packages/rocketh-diamond/test/diamond.integration.test.ts` (basic diamond case): four facets are four distinct create2 addresses matching their saved deployments, and the diamond itself is a separate, receipt-derived proxy address that is not one of the facets.

**Why:** both cases previously asserted only `toBeDefined()` on the deployment and its address, so they were green for any address the harness happened to return and documented nothing about the deployment graph the code builds. The migration is exactly the moment those addresses become real, so pinning the graph is cheap here.

**What it touches:** acceptance criterion 3 of `work/tasks/done/migrate-proxy-diamond-tests.md` fences assertion changes to "those the old fake's shortcuts made necessary". The proxy block sits inside that fence (under the old single-`contractAddress` receipt the implementation and the proxy genuinely collapsed onto one address, so the assertion could not have existed). The diamond facet block sits OUTSIDE it: facets default to `deterministic: true` (`packages/rocketh-diamond/src/index.ts:124`), their address is the computed create2 address (`packages/rocketh-deploy/src/index.ts:438`) and the environment prefers it over the receipt (`packages/rocketh/src/environment/index.ts:846`), so those four addresses were already distinct under the old fake. It is a deliberate strengthening, not a necessity.

**Alternative considered:** port the two cases verbatim and leave them `toBeDefined()`-only, which keeps the diff strictly mechanical and inside the fence, at the cost of leaving two of the weakest cases in the suite unable to detect a collapsed deployment graph. A human may trim the diamond block back to that if the fence is meant strictly.

Related: `work/notes/observations/review-nits-migrate-proxy-diamond-tests-2026-08-10.md` (the review nit that asked for this ratification), and `work/notes/observations/example-artifact-facets-share-one-create2-address-2026-08-10.md`.
