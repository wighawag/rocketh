---
title: Populate contract {name?, method, args} on UnknownSignerError from the execute path
slug: unknown-signer-contract-enrichment
spec: unknown-signer-core
blockedBy: [unknown-signer-broadcast-seam, test-env-harness]
covers: []
---

## Files this task owns

This is split out of the seam task precisely because it spans packages the seam task must not touch:

- `packages/rocketh-read-execute/src/index.ts` — the `execute` (and `tx`) call sites that know the method and args.
- `packages/rocketh-core/src/types.ts` — the `broadcastExecution` options type on the `Environment` interface. Additive and PRE-AUTHORISED by this task: do not stall on `AGENTS.md`'s ask-first rule for core types, and do not work around it with a cast.
- `packages/rocketh/src/environment/` — carrying the metadata from `broadcastExecution` to the throw site and resolving the name.
- `packages/rocketh-test-utils/` — ONLY if the legacy `createMockEnvironment` still exists when you start, since it carries its own copy of the `broadcastExecution` signature. Check rather than assuming. `remove-legacy-mock-environment` is `blockedBy` THIS task, specifically so the two cannot edit and delete the same code concurrently, so in practice the legacy copy will still be there.

## What to build

When an unknown-signer throw originates from a contract call, the error should say WHICH function the user has to execute on their Safe, not merely which address. That is what `contract: {name?, method, args}` on `UnknownSignerError` is for. The seam task deliberately leaves it unpopulated; this task fills it.

Two problems to solve, and the second is the one an earlier draft got wrong:

1. **Getting `{method, args}` from the call site to the error.** `execute` knows the function name and args. It reaches the environment through `broadcastExecution(transaction, options)`, whose options type currently is `{message?: string}` and lives on the `Environment` interface in `@rocketh/core`. Extending it is therefore a small additive CORE type change, not a private detail — treat it as such, and update the test-utils implementation of the same signature in the same task.

2. **Getting the metadata to the actual throw site.** `broadcastExecution` currently calls `broadcastTransaction(transaction)` with NO options at all, and the throw happens inside `broadcastTransaction`. So passing the metadata into `broadcastExecution` is NOT sufficient. Choose deliberately between threading it into the internal `broadcastTransaction` call, and letting `broadcastExecution` catch the `UnknownSignerError` and rethrow it enriched. Record which you chose and why in the done record. Do not change `broadcastTransaction`'s exported surface — it has none, and it should stay that way.

**Resolving `name`: reuse what exists.** The environment already exposes `fromAddressToNamedABIOrNull(address)`, which returns the deployment names registered at an address and is implemented in both the real environment and the harness. Use it rather than hand-rolling a second reverse lookup over `env.deployments`. If it returns several names, take the first and note the ambiguity in a comment. When it returns null, leave `name` absent and let the printed message fall back to the `to` address.

Non-contract paths (a plain `tx()`, a deploy, a value transfer) leave `contract` unset.

## Acceptance criteria

- [ ] An unknown-signer throw originating from `execute` / `executeByName` carries `contract: {name?, method, args}`.
- [ ] `name` is resolved via the existing `fromAddressToNamedABIOrNull`, not a new reverse lookup, and is absent when the address matches no deployment.
- [ ] A throw originating from `deploy`, a plain `tx()` or a value transfer leaves `contract` unset.
- [ ] The `broadcastExecution` options type change is applied consistently to the `Environment` interface in `@rocketh/core` AND the `@rocketh/test-utils` implementation, with `pnpm typecheck` green across the workspace.
- [ ] `broadcastTransaction` remains unexported.
- [ ] The chosen mechanism for reaching the throw site (threading vs catch-and-rethrow) is recorded in the done record with its rationale.
- [ ] Tests assert the enriched payload from an `execute`, and its absence from a deploy and a plain transaction.
- [ ] A changeset accompanies the change (this task modifies published packages and the verify gate runs `changeset status`).
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Blocked by

- `unknown-signer-broadcast-seam` — the throw site this enriches.
- `test-env-harness` — its tests drive `execute` from `@rocketh/read-execute`, so they live outside `rocketh` and use the shared harness.

## Prompt

> Make an `UnknownSignerError` that originated from a contract call carry `contract: {name?, method, args}`, so the printed message names the function the user must execute on their Safe rather than just an address.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm the seam task landed and throws `UnknownSignerError` from the environment's broadcast choke point, confirm `broadcastExecution` still reaches that choke point without forwarding its options, and check whether the legacy `createMockEnvironment` still exists (if it does, it carries its own copy of the signature you are changing). If the seam landed differently, route to needs-attention.
>
> The trap this task exists to avoid: it LOOKS like a one-line change (add a field to an options bag) and it is not. `broadcastExecution` calls the internal `broadcastTransaction` with no options, and the throw happens inside the latter, so there is a real gap to bridge. Additionally the options type is declared on the public `Environment` interface in `@rocketh/core`, so widening it is a core type change that also desynchronises the `@rocketh/test-utils` implementation of the same signature. Three packages move together; that is why this is its own task with an explicit owned-files list.
>
> Reuse, do not fork: the environment already has `fromAddressToNamedABIOrNull(address)` returning deployment names for an address, implemented in both the real environment and the harness. Use it for `name`. ADR 0006 describes this enrichment; if it still says to hand-roll a reverse lookup over `env.deployments`, prefer the existing helper and note the correction.
>
> Where to look: `packages/rocketh-read-execute/src/index.ts` for `execute` / `executeByName` / `tx`; `packages/rocketh-core/src/types.ts` for the `Environment` interface's `broadcastExecution` signature; `packages/rocketh/src/environment/` for the broadcast functions and the name lookup; `packages/rocketh-test-utils/` for the harness copy of the signature.
>
> Seams to test at: drive an `execute` from an unsignable account through `createTestEnvironment` and assert the caught error's `contract` payload; then assert a deploy and a plain `tx()` from the same account leave `contract` unset. Put these tests in a package that may depend on `@rocketh/test-utils` (for example `rocketh-read-execute`, which already does), NOT in `packages/rocketh/test/` — `rocketh` must not depend on test-utils, or the project graph closes a cycle.
>
> Done means: a user who cannot sign sees which contract and which function they need to run, and the type change is consistent across core, the environment and the test harness.
