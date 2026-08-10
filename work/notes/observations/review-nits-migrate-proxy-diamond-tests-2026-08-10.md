---
title: review-gate non-blocking nits for 'migrate-proxy-diamond-tests' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: migrate-proxy-diamond-tests
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'migrate-proxy-diamond-tests' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- The diamond test's inline rationale for the new facet-address assertions is wrong and contradicts the same file's header. Facets default to deterministic:true, so their address comes from the computed create2 address, not the receipt: rocketh-deploy passes expectedAddress and the environment prefers it over receipt.contractAddress. Under the OLD single-address receipt these assertions would still have been green, so this block is not the guard the comment says it is (the proxy test's equivalent comment IS accurate, because implementation and proxy there are non-deterministic). Reword the comment to say what it actually pins: four facets are four distinct create2 contracts and the diamond itself is a separate receipt-derived proxy.
  (packages/rocketh-diamond/test/diamond.integration.test.ts:114-127 vs its own header lines about create2; packages/rocketh-deploy/src/index.ts:438 and 483; packages/rocketh/src/environment/index.ts:846 (expectedAddress || receipt.contractAddress); packages/rocketh-diamond/src/index.ts:124 (facet deterministic defaults true))
- Ratify: the agent ADDED new assertions rather than only porting existing ones (diamond facet-distinctness block, proxy implementation-vs-proxy block). Acceptance criterion 3 fenced assertion changes to those the old fake's shortcuts made necessary. They strengthen genuinely weak toBeDefined-only cases and are commented, so this reads as good judgement, but it is an unrecorded in-scope choice (no Decisions block in the commit) that a human should ratify or trim.
  (packages/rocketh-proxy/test/proxy.integration.test.ts:84-95; packages/rocketh-diamond/test/diamond.integration.test.ts:114-127; task acceptance criterion in work/tasks/done/migrate-proxy-diamond-tests.md)
- Ratify: the create2 collision between the three createExampleArtifact facets was recorded as an observation and left in place instead of fixed. Verified accurate (createExampleArtifact varies only the ABI, bytecode is identical), and it is pre-existing rather than migration-induced, so leaving it preserves intent as the task demanded. But it means the multiple-facets case still asserts a three-cut snapshot pointing at one contract, and no follow-up task exists to give createExampleArtifact per-template bytecode.
  (work/notes/observations/example-artifact-facets-share-one-create2-address-2026-08-10.md; packages/rocketh-test-utils/src/index.ts:297)
