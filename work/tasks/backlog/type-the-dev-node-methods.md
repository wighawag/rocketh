---
title: 'Type the dev-node methods instead of casting the provider to any'
slug: type-the-dev-node-methods
needsAnswers: true
blockedBy: [add-dev-node-method-groups-to-eip-1193]
covers: []
---

<!-- open-questions -->

## Open questions

1. **Does the dev-node surface reach rocketh's PUBLIC types, or stay internal?** Option A: internal only. Each call site narrows `env.network.provider` to the dev-node table where it calls such a method, and `env.network.provider` stays `EIP1193CoreProvider`. Option B: rocketh exposes a typed dev-node view (for example on the test environment, or as `EIP1193CoreProvider & RequestRPC<DevNodeMethods>` where `autoMine` or `autoImpersonate` already implies a dev node), so users' deploy scripts and tests stop casting too. B is more useful but promises methods a production endpoint does not serve; A is honest but only removes rocketh's own casts.

<!-- /open-questions -->

## What to build

rocketh calls two methods that only a development node serves, `evm_mine` (after each send when `autoMine` is on) and `hardhat_impersonateAccount` (for `autoImpersonate` on a fork), and it does so by casting the provider to `any`. That was harmless while eip-1193 had a catch-all `request()` overload, but eip-1193 0.7.0 removed it, so any typed call to an unlisted method is now a compile error, and `as any` is the only way through. The cast also switches off every other check on the call: a typo in the method name or a wrong params shape compiles silently, which is exactly the class of bug eip-1193 0.7.0 set out to catch. Users' deploy scripts and tests that call the same methods on `env.network.provider` hit the same wall since rocketh moved to eip-1193 0.7.

This is a library gap, so it is fixed upstream first, in `add-dev-node-method-groups-to-eip-1193`, which ships typed dev-node method groups in eip-1193 and records the released version on this task. Then, here: require that eip-1193 version, replace every `(provider as any).request(...)` for a dev-node method with a call typed against the new group, in the shape the open question settles, and add the new eip-1193 version to `minimumReleaseAgeExclude` (by exact version, with the hand check recorded, as for the other entries) if it is still inside the install floor.

## Upstream release (recorded by `add-dev-node-method-groups-to-eip-1193`)

eip-1193 **0.7.3** ships the groups (published 2026-10-26 from tag `v0.7.3`, commit `d3f717e`, with provenance). Names: `DevNodeMethods` (served by both Hardhat and Anvil under the same name, including `evm_mine` and `hardhat_impersonateAccount`), `HardhatMethods`, `AnvilMethods`; provider types `EIP1193DevNodeProvider` (= `EIP1193CoreProvider & RequestRPC<DevNodeMethods>`, for code that runs on either client), `EIP1193HardhatProvider`, `EIP1193AnvilProvider`. `evm_mine` and `hardhat_mine` require `params` (`[]` for the defaults), which matches rocketh's existing `evm_mine` calls. The same release adds the optional `chainId` to `EIP1193LegacyTransactionData`.

## Acceptance criteria

- [ ] rocketh requires the eip-1193 version recorded by `add-dev-node-method-groups-to-eip-1193`.
- [ ] No `as any` remains around a dev-node `request()` call in `packages/*/src`.
- [ ] A typo in a dev-node method name, or a wrong params shape, at one of those call sites is a compile error (demonstrate with a type test using `@ts-expect-error`).
- [ ] `env.network.provider`'s public type is exactly what the open question decided, and a type test pins it.
- [ ] The legacy-arm `chainId` casts in `@rocketh/deploy` and `@rocketh/read-execute` (and their comments) are gone, since the same eip-1193 release gives `EIP1193LegacyTransactionData` a `chainId`.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test` and `pnpm format:check` pass.
- [ ] A changeset describes any change to rocketh's public types.

## Blocked by

- `add-dev-node-method-groups-to-eip-1193`: the typed groups must be released in eip-1193 first. The open question here must also be answered.

## Prompt

> Goal: stop casting the provider to `any` for the development-node methods rocketh calls (`evm_mine` for `autoMine`, `hardhat_impersonateAccount` for `autoImpersonate`), by typing them in eip-1193 and calling them through that type here.
>
> Background: eip-1193 0.7.0 split its method tables by who serves a method (wallet, node, HTTP node) and removed the `request()` catch-all, so an unlisted method no longer compiles. 0.7.1 added `CoreMethods` / `EIP1193CoreProvider`, the set every provider serves, and rocketh types all its provider slots and `env.network.provider` with it. Dev-node methods belong to none of these sets, which is why the call sites cast to `any`. Find them with a search for `as any).request` in `packages/*/src`; at the time of writing they are in the environment module of the `rocketh` package (one impersonation call, three `evm_mine` calls).
>
> The groups come from `add-dev-node-method-groups-to-eip-1193`, which records the eip-1193 version that ships them; read that task's done record for the group and type names. Answer the open question in this file before building; it decides whether the dev-node surface reaches rocketh's public types.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, or an ADR superseded an assumption here, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal"). Building on a stale task produces wrong-but-compiling work.
>
> RECORD non-obvious in-scope decisions you make while building, in a `## Decisions` block at the end of your FINAL REPORT. When the task did not specify some behaviour and you have to CHOOSE, do not leave the choice silent for a reviewer to reverse-engineer. That block is the ONE sanctioned channel for build-time rationale, and the runner transcribes it verbatim into the done record in the same commit as the done-move. So do NOT try to write the done record, the commit message, or the PR body yourself, and do NOT open a `work/notes/observations/decisions-<slug>.md` note. If the choice meets the ADR gate (hard to reverse + surprising without context + a real trade-off, see `ADR-FORMAT.md`), ALSO write the durable WHY as an ADR in `docs/adr/` and name it in the block. An un-recorded in-scope decision is a review FINDING, not a silent default.
