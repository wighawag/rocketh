---
title: 'Ship typed dev-node method groups in eip-1193'
slug: add-dev-node-method-groups-to-eip-1193
humanOnly: true # the deliverable is a release of ANOTHER repository (jolly-roger-eth/eip-1193)
needsAnswers: true
blockedBy: []
covers: []
---

<!-- open-questions -->

## Open questions

1. **Which methods go into the group(s), and under what names?** rocketh itself only calls `evm_mine` and `hardhat_impersonateAccount`, but a group shipped by eip-1193 is used by every consumer, and deploy scripts and tests commonly also reach for `evm_increaseTime`, `evm_setNextBlockTimestamp`, `evm_snapshot` / `evm_revert`, `hardhat_stopImpersonatingAccount`, `hardhat_setBalance`, `hardhat_setCode`, and their `anvil_*` twins. One group per client (`HardhatMethods`, `AnvilMethods`), or one `DevNodeMethods` for the `evm_*` methods the clients share plus per-client groups for the prefixed ones?

<!-- /open-questions -->

## What to build

eip-1193 0.7.0 removed the `request()` catch-all overload, so a typed call to a method that no table lists is a compile error. Development nodes (Hardhat, Anvil) serve methods that no eip-1193 table lists, so every consumer that calls them, rocketh included, casts the provider to `any`, which also switches off the check on the method name and params. This is a gap in the library, to be closed there once rather than worked around in each consumer.

Add the dev-node method group(s) settled by the open question to eip-1193, with a provider type for them, release it as a patch, and record the released version on the follow-up task in this repo (`type-the-dev-node-methods`). Each entry's params and result must be checked against the client's own source (Hardhat's and Anvil's RPC handlers), the way the 0.7.0 audit checked every other entry, not written from memory: for example `evm_mine` accepts an optional timestamp on some clients and not others.

## Acceptance criteria

- [ ] eip-1193 exports the group(s) and a provider type, each entry citing the client source it was checked against.
- [ ] Type tests in the same style as the existing groups pin that each method is callable on the new type and is absent from the core, wallet and node sets.
- [ ] The release is published (eip-1193 releases by pushing a `v<version>` tag; its release workflow publishes over OIDC with provenance) and the version is recorded on `type-the-dev-node-methods`.

## Blocked by

- None. The open question must be answered first.

## Prompt

> This task is humanOnly: it changes and releases a different repository, jolly-roger-eth/eip-1193, not rocketh. Do it only if a human has explicitly delegated it to you.
>
> Goal: add typed method groups for the development-node RPC methods (Hardhat's and Anvil's `evm_*`, `hardhat_*`, `anvil_*`) to eip-1193, so consumers stop casting providers to `any` to call them. Answer the open question in this file first. In the eip-1193 repo, follow the conventions of the method-set section of `index.d.ts` (one group per capability, composed into provider types through `RequestRPC`) and of `test-d/index.test-d.ts`. Check every params and result shape against the client's source. Release as a patch by bumping `package.json` and pushing the matching `v` tag.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): has eip-1193 gained such groups since? If so, record the version on the follow-up task and stop. If something else this task assumes has changed, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").
>
> RECORD non-obvious in-scope decisions you make while building, in a `## Decisions` block at the end of your FINAL REPORT. That block is the ONE sanctioned channel for build-time rationale, and the runner transcribes it verbatim into the done record in the same commit as the done-move. So do NOT try to write the done record, the commit message, or the PR body yourself, and do NOT open a `work/notes/observations/decisions-<slug>.md` note. If the choice meets the ADR gate (hard to reverse + surprising without context + a real trade-off, see `ADR-FORMAT.md`), ALSO write the durable WHY as an ADR in `docs/adr/` and name it in the block.
