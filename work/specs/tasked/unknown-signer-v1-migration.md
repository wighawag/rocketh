---
title: 'Unknown Signer: the hardhat-deploy v1 migration guarantee'
slug: unknown-signer-v1-migration
taskedAfter: [unknown-signer-core]
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

A team with hardhat-deploy v1 deploy scripts built on `deployments.catchUnknownSigner` needs to move to rocketh. Their scripts encode a working governance procedure that a human follows on a real multisig, so the cost of a silent behaviour change is not a failing test, it is an operator executing the wrong transaction. Today the compatibility story exists only as prose in a README and as an implicit consequence of the implementation. Nothing PINS it, so a future change (a new field, a persisted file, a different print) could break a migrated script without any test going red.

Separately, a migrating team has to translate more than one function call: v1's named "owner" accounts and its proxy `{owner, methodName/execute}` options have rocketh equivalents that are close but not identical, and nothing documents the mapping.

## Solution

Name what `catchUnknownSigner` now IS, pin the parity that follows from that, and write the migration guide.

The framing came out of the `unsignable-routes` design and it settles most of this spec: **`catchUnknownSigner` is a v1 compatibility shim, and its sole remaining purpose is letting a run continue past a step that did not happen.** Surfacing the transaction is the seam's job, not the wrapper's. The core model is report-and-throw with strict ordering, which is what a run without the wrapper does.

That converts most of this spec from work into a constraint: **parity is what happens when the shim is not touched.** The `unsignable-routes` design is explicitly forbidden from reshaping it, and the one new concept there (`pending`) is producible only by a declared route, so a migrated v1 script, which declares none, can never reach it. There is nothing to build to make the return shape match. There is only something to PIN, so a later change cannot quietly break it.

The guarantee has three parts:

- **Return-shape parity.** `catchUnknownSigner` returns `null` on success, otherwise an object with exactly the keys `from`, `to`, `value`, `data`, every key present even when its value is `undefined`, and `value` as a string. Any future field is strictly additive. A migrated script that reads, compares, serialises or forwards the result needs no change.
- **No side effects.** Nothing is persisted: no unsigned-transactions file, no deployment-record mutation, no state that a second run could read. Idempotency comes from on-chain state alone, exactly as in v1. This is the DEFAULT today; the spec's job is to make it a thing a test would catch, so that a later batching or Safe-proposal feature stays opt-in rather than quietly changing what a v1 script does.
- **One documented divergence.** The action is a thunk (`() => execute(...)`), never a promise. This is deliberate and is the only change a migrating script needs, so it must be stated once, prominently, with the failure mode a JavaScript caller sees.

Plus a migration guide covering the account and proxy-option mapping, so the translation is mechanical rather than archaeological.

And one thing the guide must say bluntly, because everybody currently learns it the expensive way: **wrapping a call means accepting that the step did not happen and choosing to continue anyway.** Anything later in the same script that depends on it must be gated on chain state, or must not be there. rocketh unwinds the wrapped ACTION, so `deployViaProxy`'s own post-upgrade `execute` / `onUpgrade` step is safe automatically, but it cannot protect the author's next statement. This is true of v1 too; it has simply never been written down.

## User Stories

1. As a team on v1, I want `await catchUnknownSigner(() => deploy(...))` to behave identically on rocketh (throw path forced, transaction printed, same shape returned, no waiting), changing only the import and adding the arrow function, so migration is low-risk.
2. As a team on v1, I want the returned object to have the same keys in the same meaning, so my code that stashes it in a spreadsheet or a JSON file keeps working untouched.
3. As a team on v1, I want a run that defers to produce no new files anywhere, so my repo diff after a deploy is the same as it was under v1 and my CI's "working tree is clean" check does not start failing.
4. As a migrating team, I want a document mapping my v1 named owner accounts to rocketh's named accounts, so I know which of my config entries move and which change shape.
5. As a migrating team, I want a document mapping v1's proxy `{owner, methodName/execute}` options to `@rocketh/proxy`'s options, so I can translate an upgrade script without reading either package's source.
6. As a migrating team, I want the thunk divergence to fail LOUDLY rather than silently, so that if I forget the arrow function I get an error naming the fix instead of a wrapper that quietly does not defer.
7. As a maintainer, I want the parity guarantee expressed as tests rather than as prose, so a later feature that would break it cannot merge quietly.
8. As a maintainer, I want a ported v1 script in the test suite, so "identical behaviour" is demonstrated on a whole script rather than asserted per-field.

## Implementation Decisions

- Parity is a **hard compatibility promise** on the four fields and the `null`-on-success behaviour. Additional fields may only ever be additive.
- The **v1-exact opt-out is not built here**, and deliberately so. It would only be meaningful once some downstream feature introduces a side effect. Since core persists nothing, v1-exact IS the default; what this spec adds is the test that keeps it so, which in turn is what lets the adapters spec make persistence opt-in without arguing about defaults again.
- The migration guide lives with the package (its README) and in the site docs, not in a `work/` note, because it is user-facing.
- **The shim is FROZEN, and that freeze is the mechanism of the guarantee.** No new return variant, no new option, no new behaviour. If a future feature appears to need one, that is evidence the feature belongs at the seam instead. A `pending` result reaching a wrapped call (only possible once routes are declared) is RETHROWN rather than represented, because v1 has no shape for it and inventing one would be the tail wagging the dog.
- **The loop case stays expressible, and it is what the shim is for.** Strict ordering means the core model surfaces one item per run, so twelve independent upgrades take twelve runs. A team that deliberately wrapped in a loop under v1 keeps that behaviour by keeping the wrapper. Batching those twelve into one multisig transaction is the real fix, and lives in the adapters exploration.

## Testing Decisions

- A **ported v1 script** test: take a realistic hardhat-deploy v1 deploy script using `catchUnknownSigner` around a proxy upgrade, port it mechanically (import + thunk), and assert the observable behaviour matches what v1 produced: same return shape, deferral rather than waiting, rest of the script still runs.
- A **no-side-effects** test: run a deferring script and assert the filesystem and the deployment records are byte-identical before and after, so any future persisted file has to be added deliberately.
- **Shape tests** asserting key PRESENCE (not just value) for `to`, `value`, `data` when they are `undefined`, since v1 returned a destructure and a consumer may do `'to' in result`.
- A **thunk-misuse** test for both the promise case and the non-function case, asserting the error names the correction.

Prior art: `packages/rocketh-unknown-signer/test/catchUnknownSigner.integration.test.ts` and `scenarios.integration.test.ts`, which already cover the mechanism; this spec adds the parity and migration layer on top.

## Out of Scope

- Validating the seam against real governance topologies, which is `governance-topology-validation`.
- Anything to do with a Timelock, an AccessManager or another call-through holder of the upgrade right, which is `unsignable-routes`.
- The interactive resolver (`unknown-signer-interactive`) and the convenience adapters (`explore-unknown-signer-adapters`).

## Further Notes

The five open questions that previously blocked this work were researched rather than asked; see `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`. None of them turned out to bear on the migration guarantee, which is why this half of the original spec is now unblocked and taskable on its own.

This spec got SMALLER as a result of the `unsignable-routes` design rather than larger, which is the useful signal about it: parity stopped being a thing to engineer and became a thing to leave alone, once the wrapper stopped being the mechanism.
