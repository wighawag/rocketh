---
title: review-gate non-blocking nits for 'migrate-proxy-diamond-tests' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: migrate-proxy-diamond-tests
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'migrate-proxy-diamond-tests' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- The Gate-3 requeue asked for the two ADDED assertion blocks to be recorded in the COMMIT BODY; both commits are subject-only with an empty body. The record instead landed as a committed note with a Decisions heading. Substance delivered in a more durable place, but confirm that note (not the commit body) is the accepted home, since the empty commit body was already raised as a nit on batch 1 and is now a repeat pattern.
  (git log -2 shows only the subject line for 617c6f2 and 3faa79d; work/notes/observations/decision-added-assertions-migrate-proxy-diamond-tests-2026-08-10.md carries the full Decisions block; prior instance in work/notes/observations/review-nits-migrate-deploy-and-read-tests-2026-08-10.md)
- Ratify the two added assertion blocks. The proxy block sits inside acceptance criterion 3's fence (implementation and proxy are both non-deterministic, so they genuinely collapsed under the old single-address receipt). The diamond facet block sits OUTSIDE it and the agent says so itself: facets default to deterministic, so those four addresses were already distinct under the old fake. Ratify as a deliberate strengthening or trim it back.
  (packages/rocketh-proxy/test/proxy.integration.test.ts:84-95; packages/rocketh-diamond/test/diamond.integration.test.ts:113-131; verified facet default at packages/rocketh-diamond/src/index.ts:124, expectedAddress at packages/rocketh-deploy/src/index.ts:438, preference at packages/rocketh/src/environment/index.ts:846)
- Bucket polarity: the decision record is filed under work/notes/observations/, whose contract polarity is spotted-and-unverified and append-only, while CONTEXT.md and WORK-CONTRACT pin a decision WE made plus why to docs/adr/. It is also a brand-new note kind (first decision-* file). Either pin decision-* as a sanctioned observations sub-kind for pending ratifications, or move it.
  (work/notes/observations/decision-added-assertions-migrate-proxy-diamond-tests-2026-08-10.md; CONTEXT.md line 23 (notes/observations = spotted, unverified, append-only; ADRs record what WE decided); ls work/notes/observations shows no other decision-* file)
- The NAMED_ACCOUNTS / NODE_ACCOUNTS / createEnv() fixture triple is now duplicated verbatim in a THIRD test file. Correctly deferred here because the task fenced harness changes, but a shared preset in @rocketh/test-utils is the obvious generalisation once the legacy harness is removed.
  (packages/rocketh-deploy/test/deploy.integration.test.ts:25-34, packages/rocketh-proxy/test/proxy.integration.test.ts:34-43, packages/rocketh-diamond/test/diamond.integration.test.ts:34-43)
- The create2 collision observation still has no follow-up task, so the multiple-facets case remains a documentation example whose three differently-named facets all deploy to one address. Nothing false is asserted (the case is toBeDefined-only), so this is a triage item, not a defect in this PR.
  (work/notes/observations/example-artifact-facets-share-one-create2-address-2026-08-10.md; packages/rocketh-diamond/test/diamond.integration.test.ts:289-320 asserts only toBeDefined; packages/rocketh-test-utils/src/index.ts:297)
