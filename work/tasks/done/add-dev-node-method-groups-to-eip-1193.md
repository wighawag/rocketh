---
title: 'Ship typed dev-node method groups in eip-1193, and give legacy transaction data a chainId'
slug: add-dev-node-method-groups-to-eip-1193
humanOnly: true # the deliverable is a release of ANOTHER repository (jolly-roger-eth/eip-1193)
blockedBy: []
covers: []
---

## Answers (maintainer, 2026-10-26)

1. **Three composable groups, not one group per client.** `DevNodeMethods` holds what Hardhat and Anvil both serve under the same name: the shared `evm_*` methods and the `hardhat_*` methods Anvil accepts as aliases. `HardhatMethods` holds what only Hardhat serves, and `AnvilMethods` what only Anvil serves (its `anvil_*` names and its extra aliases). Provider types: `EIP1193DevNodeProvider` (core methods plus `DevNodeMethods`, for code that runs on either client), `EIP1193HardhatProvider` and `EIP1193AnvilProvider` (node methods plus `DevNodeMethods` plus the client's group).

## What to build

eip-1193 0.7.0 removed the `request()` catch-all overload, so a typed call to a method that no table lists is a compile error. Development nodes (Hardhat, Anvil) serve methods that no eip-1193 table lists, so every consumer that calls them, rocketh included, casts the provider to `any`, which also switches off the check on the method name and params. This is a gap in the library, to be closed there once rather than worked around in each consumer.

Add the dev-node method group(s) settled by the open question to eip-1193, with a provider type for them.

In the same release, fix a second gap found while moving rocketh to eip-1193 0.7: `EIP1193LegacyTransactionData` has no `chainId`, while the type 1 and type 2 variants do. That is wrong for the input of `eth_sendTransaction` / `eth_signTransaction`: execution-apis types it as `GenericTransaction` (`src/schemas/transaction.yaml`), one flat shape whose optional `chainId` applies to every type, legacy included, and a legacy transaction signed with EIP-155 replay protection is bound to a chain id. `@eip-1193/signer` already reads `chainId` from a legacy request to apply EIP-155, and rocketh casts its legacy transaction data to get `chainId` through (`@rocketh/deploy`, and twice in `@rocketh/read-execute`, each with a comment pointing at this gap). Add an optional `chainId` to `EIP1193LegacyTransactionData`, after checking go-ethereum's handling of a legacy `TransactionArgs` with a chain id.

Release both as a patch, and record the released version on the follow-up task in this repo (`type-the-dev-node-methods`). Each entry's params and result must be checked against the client's own source (Hardhat's and Anvil's RPC handlers), the way the 0.7.0 audit checked every other entry, not written from memory: for example `evm_mine` accepts an optional timestamp on some clients and not others.

## Acceptance criteria

- [ ] eip-1193 exports the group(s) and a provider type, each entry citing the client source it was checked against.
- [ ] Type tests in the same style as the existing groups pin that each method is callable on the new type and is absent from the core, wallet and node sets.
- [ ] `EIP1193LegacyTransactionData` accepts an optional `chainId`, pinned by a type test, with the execution-apis and go-ethereum sources cited.
- [ ] The release is published (eip-1193 releases by pushing a `v<version>` tag; its release workflow publishes over OIDC with provenance) and the version is recorded on `type-the-dev-node-methods`.

## Blocked by

- None. The open question must be answered first.

## Prompt

> This task is humanOnly: it changes and releases a different repository, jolly-roger-eth/eip-1193, not rocketh. Do it only if a human has explicitly delegated it to you.
>
> Goal: add typed method groups for the development-node RPC methods (Hardhat's and Anvil's `evm_*`, `hardhat_*`, `anvil_*`) to eip-1193, so consumers stop casting providers to `any` to call them, and in the same release add the optional `chainId` that `EIP1193LegacyTransactionData` is missing (see What to build). Answer the open question in this file first. In the eip-1193 repo, follow the conventions of the method-set section of `index.d.ts` (one group per capability, composed into provider types through `RequestRPC`) and of `test-d/index.test-d.ts`. Check every params and result shape against the client's source. Release as a patch by bumping `package.json` and pushing the matching `v` tag.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): has eip-1193 gained such groups since? If so, record the version on the follow-up task and stop. If something else this task assumes has changed, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").
>
> RECORD non-obvious in-scope decisions you make while building, in a `## Decisions` block at the end of your FINAL REPORT. That block is the ONE sanctioned channel for build-time rationale, and the runner transcribes it verbatim into the done record in the same commit as the done-move. So do NOT try to write the done record, the commit message, or the PR body yourself, and do NOT open a `work/notes/observations/decisions-<slug>.md` note. If the choice meets the ADR gate (hard to reverse + surprising without context + a real trade-off, see `ADR-FORMAT.md`), ALSO write the durable WHY as an ADR in `docs/adr/` and name it in the block.

## Decisions

- **Released as eip-1193 0.7.3** (tag `v0.7.3`, commit `d3f717e` in jolly-roger-eth/eip-1193, published over OIDC with provenance). 0.7.2 was used first for an unrelated fix (removing the `engines` field that shipped to consumers), so this task's patch is 0.7.3. The version and names are recorded on `type-the-dev-node-methods`.
- **Sources:** every entry was checked against Hardhat's EDR (`NomicFoundation/edr` @ `b9bd49fc`, `crates/edr_provider/src/requests/methods.rs` and `serde.rs`) and Anvil (`foundry-rs/foundry` @ `85d83334`, `crates/anvil/core/src/eth/mod.rs` for names, aliases and params, `crates/anvil/src/eth/api.rs` for results). The pinned commits are cited once in the group header of `index.d.ts`, not on every entry. Anvil 1.7.1 was also queried live; Hardhat was not available locally.
- **`DevNodeMethods` includes the shared `hardhat_*` names**, not only `evm_*`, so `hardhat_impersonateAccount` (which rocketh calls) is typed on `EIP1193DevNodeProvider`. Shared entries take the params BOTH clients accept and return a union of what either answers: Hardhat mostly answers `true` where Anvil answers `null`, so many results are `boolean | null`, and `evm_increaseTime` is `string | number` (Hardhat sends a decimal string, Anvil a JSON number).
- **`evm_setIntervalMining` is in BOTH client groups**, because Hardhat takes milliseconds (or a `[min, max]` range) and Anvil takes seconds. So `HardhatMethods` and `AnvilMethods` must not be intersected; `DevNodeMethods` is disjoint from each. Pinned by type tests.
- **`evm_mine`, `hardhat_mine` and `anvil_mine` require `params`** (`[]` for the defaults). Anvil answers `invalid type: null` to an omitted `params` on `anvil_mine` / `hardhat_mine` (checked live), and Hardhat's handling of an omitted `params` on `evm_mine` could not be verified. rocketh already sends `params: []`.
- **Param types:** timestamps, durations and block counts are `EIP1193QUANTITY | number` (both clients accept either). Other quantities are hex only: Hardhat rejects a JSON number for balances, nonces and storage slots.
- **`hardhat_reset` is typed for Anvil only.** EDR, the engine of Hardhat 3, removed it.
- **`AnvilMethods` is a selection** (37 entries). `anvil_dealERC20`, `anvil_nodeInfo`, `evm_mine_detailed` and others are not typed yet; the untyped escape hatch still reaches them.
- **`AllMethods` does not gain the dev-node groups.** Its doc now says so, because the two clients disagree on some entries.
- **Legacy `chainId`:** optional `chainId` on `EIP1193LegacyTransactionData`, citing execution-apis `GenericTransaction` / `TransactionLegacyUnsigned` and go-ethereum `internal/ethapi/transaction_args.go` (`setDefaults` checks and fills `chainId` for every transaction type).
- **Review:** two subagent review rounds, both approve with notes; all notes fixed before tagging.
