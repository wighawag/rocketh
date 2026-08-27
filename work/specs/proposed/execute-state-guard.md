---
title: 'A state guard on execute: declare when a call is still needed'
slug: execute-state-guard
humanOnly: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

`execute` has no answer to "is this call still needed?". Every other primitive does: `deploy` compares bytecode, `deployViaProxy` compares the current implementation address. `execute` runs whatever you hand it, every time, and it is the user's job to write `const current = await read(...); if (current !== target) await execute(...)` at every call site.

That gap is felt in three separate places that turn out to be the same gap.

**It is what an existing v2 user asked for, in those words.** Asked what is missing from current deployment tooling, an infrastructure team using hardhat-deploy v2 answered: "State checks beyond the contract deploy itself, i.e. have these functions been called? and explicit artifacts from other state changes." That is two requests. This spec is the first; the second is `state-change-provenance`, split out because it is a persisted output with its own lifecycle rather than an option on a function.

**It is the only thing that closes the unsignable-signer loop.** ADR 0012 establishes that a persisted record can only assert what rocketh OBSERVED, that `throw` observes nothing, and that a record is therefore at most an optimisation in front of a chain-derived check, never a substitute for one. Under `throw` with no guard, the operator executes the transaction on their Safe, re-runs, and rocketh surfaces the identical transaction again because it has no way to know. Following the instructions twice executes the call twice, which for a mint, a transfer, an increment or a nonce-bearing governance action is a real loss. The guard is what makes the re-run converge instead.

**It is what makes deferred transactions computable as a set.** Today the second unsignable transaction in a script is discoverable only by executing past the first, because the deferral is a throw that unwinds. A guard expressed as a chain read can be EVALUATED without executing anything, which is what a collector needs to know which steps are still pending before it proposes a Safe batch.

The workaround today is a hand-written read-then-if at every call site, or a script-level `id` plus `return true`, which is coarse (it skips the whole script) and, on a caught deferral, actively dangerous (see the sibling task `refuse-migration-record-when-a-script-deferred`).

## Solution

One option on `execute`: declare the on-chain condition under which the call is still needed. rocketh evaluates it before broadcasting, skips the call when it is already satisfied, and reports what it read.

```typescript
await execute(env)(proxyAdmin, {
	account: 'governance',
	functionName: 'upgradeAndCall',
	args: [proxy.address, next.address, '0x'],
	guard: {
		// reads a DIFFERENT contract than the one being executed, and reads a SLOT,
		// because an OZ transparent proxy exposes no implementation getter
		kind: 'storage',
		on: proxy,
		slot: EIP1967_IMPLEMENTATION_SLOT,
		equals: next.address,
	},
});
```

The guard must be able to read a contract OTHER than the one being executed, and that is the common case rather than the exception. The topologies read from real protocols (`work/notes/findings/governance-upgrade-topologies-in-the-wild.md`) are all of this shape: you call `upgrade` on a ProxyAdmin and check the implementation on the PROXY; you call `setPoolImpl` on Aave's `PoolAddressesProvider` and the thing that changed is the proxy behind it; you call `register` on a registry and check `owner()` on the registered contract. A guard that could only read its own target would miss every one of them. It should therefore accept the same target shape `read` already accepts (a deployment, or an address plus ABI), defaulting to the contract being executed.

The guard's EVALUATION is exposed, not just its verdict: what was read, and what it was compared against. That is needed here anyway, so a skipped step is legible rather than mysterious, and it is what `state-change-provenance` consumes later. Getting that seam right now is what keeps provenance an additive feature rather than a re-cut.

## User Stories

1. As a deployer, I want to declare the chain condition under which an `execute` is needed, so that a re-run skips it instead of sending it again.
2. As a deployer whose privileged call is deferred to a Safe, I want the re-run after the Safe executed to see the change on chain and skip the step, so the loop converges without me editing anything.
3. As that same deployer, I want the run NOT to hand me the identical transaction a second time, so I cannot execute a non-idempotent governance action twice by following the instructions.
4. As a deployer calling a ProxyAdmin, a registry or a governance contract, I want the guard to read a DIFFERENT contract from the one I am calling, because that is where the effect is observable.
5. As a deployer, I want the guard to be typed against the ABI of the contract it reads, the same way `execute`'s own `functionName` and `args` are, so a renamed getter is a compile error.
6. As a deployer, I want to see what the guard read and why it decided to skip or proceed, so a skipped step is legible rather than mysterious.
7. As a deployer, I want a guard that throws (a reverting getter, a contract not yet deployed) to fail the run loudly rather than be treated as "not satisfied", so a broken guard cannot silently cause a re-execution.
8. As a deployer with a call whose effect is genuinely not observable on chain, I want an explicit way to say so, so the escape hatch is visible in the script rather than implied by absence.
9. As a deployer upgrading through a ProxyAdmin, I want the guard to read the EIP-1967 implementation slot, because the proxy exposes no getter for it and this is the most common upgrade topology there is.
10. As a deployer checking a role or an operation state, I want to assert one component of a tuple return, or a negation, without having to state a value I do not care about.
11. As a deployer comparing a checksummed address or a role identifier, I want casing not to matter, and comparing a name or a symbol, I want casing to matter, so the comparison matches what the value MEANS.
12. As a maintainer, I want the guard evaluable WITHOUT executing the call, so a later collector can compute the set of pending actions before proposing a batch.
13. As a maintainer, I want the guard's evaluation (what was read, what it was compared against) exposed rather than reduced to a boolean, so provenance can consume it later without the option being re-cut.
14. As a v1 migrant, I want the guard to be additive, so existing `execute` calls keep working.

## Autonomy notes

`humanOnly: true`: this adds a public option to `execute`, which is a surface we then keep. A human drives the tasking.

No `needsAnswers`: the open questions were resolved before this spec was promoted. The guard is optional rather than mandatory, `satisfied` is the primary form with `equals` as sugar, log-based guards are out of scope, and provenance was split into its own spec. The reasoning for each is in Implementation Decisions and in the paper validation below.

## Implementation Decisions

- **The guard is OPTIONAL, and there is no mandatory mode.** Decided, against an earlier leaning. The argument that settled it: a user who does not want a guard can reach the chain by other means anyway (`env.broadcastExecution`, a raw provider call, viem directly), so enforcement at this one option stops nobody determined and taxes everybody compliant. It would also have hit rocketh's own internal `execute` calls in `@rocketh/proxy` and `@rocketh/diamond`, which are already guarded by their own comparisons and would each have had to write `guard: 'none'` to say something untrue. The double-execution hazard is therefore addressed where it belongs, in the surfaced message and the documentation (`deferral-message-warns-about-repeat-execution`), not by making a general primitive ceremonial. A project-level `requireGuards` flag was considered and dropped for now as unrequested; it can return if a team asks.
- The guard lives on `execute` in `@rocketh/read-execute`, next to `read`, whose target-resolution and ABI typing it reuses rather than reinvents.
- **Two guard kinds, discriminated: `call` and `storage`.** `storage` is not an optimisation, it is REQUIRED by the most common topology of all, and its absence was the main finding of the paper validation below. The union is discriminated from the first commit so a third kind (a log-based one, currently out of scope) is additive rather than a re-cut.
- **`satisfied: (value) => boolean` is the primary form, not an escape hatch.** Also a paper-validation result: two of the four real topologies cannot be expressed as an equality at all. `equals` remains as sugar for the common scalar case, and carries the comparison rule below.
- **Comparison is case-INSENSITIVE for `address` and `bytes32`, and case-SENSITIVE for `string`.** Decided. Addresses differ only by checksum casing and must match across it (`packages/rocketh-proxy/src/index.ts:478` already lowercases both sides for this reason); a `bytes32` is a hex value whose casing carries no meaning, which covers role identifiers, salts and operation ids, the values a governance guard reads most. A `string` is user data where casing IS meaningful, so folding it would make two different names compare equal. The rule is therefore keyed off the ABI TYPE, not off the JavaScript type, which is possible precisely because the read is declared against a typed ABI. Bigints never coerce against numbers, and struct/array returns compare deeply with the same per-type rule applied elementwise.
- **The guard reports its EVALUATION, not just its verdict**: the value read, the target it was read from, and what it was compared against. Needed for legibility here, and the input `state-change-provenance` consumes later.
- The guard is evaluated BEFORE the transaction is built, so a satisfied guard costs one `eth_call` and reaches neither the broadcast choke point nor the unknown-signer seam.
- A guard that reverts or otherwise throws is FATAL, never "not satisfied". A broken guard that fell through to executing would reintroduce exactly the double-execution hazard the guard exists to remove.
- The guard never suppresses the unknown-signer seam: an unsatisfied guard on an unsignable `from` defers exactly as today. The guard answers "is this needed", not "can we sign it", and those stay orthogonal for the same reason `autoImpersonate` and `onUnknownSigner` are (ADR 0006).
- **This spec persists nothing.** No file, no new `Deployment` field, no state a second run could read. Idempotency stays on-chain-state-driven, which is what keeps the v1 no-side-effects parity guarantee (`unknown-signer-v1-migration`) true without an asterisk.
- No change to `.migrations.json` or to the script-level `id` mechanism, which stays what it is: a coarse skip layered on top of chain-guarded steps.

## Testing Decisions

- The convergence property end to end, as an integration test that doubles as documentation: a guarded call from an unsignable `from` defers on run 1, the transaction is "executed out of band" against the mock provider, and run 2 skips the step and completes. This is the story the whole feature exists for and it should be readable as such.
- The cross-contract read specifically, since a same-contract-only implementation would pass a naive test suite and fail every real topology.
- A reverting guard fails the run, and does NOT execute the call.
- The comparison rule, per ABI type: a checksummed expected address against a lowercase read (and the reverse) matches; an upper-case `bytes32` role identifier against a lower-case read matches; two `string`s differing only in case do NOT match. The third assertion is the one that would be lost by a naive "lowercase everything" implementation, so it is the one that must exist.
- Each of the four paper-validation topologies as a test, since they are the cases the design was cut against: a storage-slot read on a proxy, a storage-slot read on a contract reached from a registry, a tuple return with only one component asserted, and an enum compared by negation. The first is the one a call-only implementation would fail.
- The guard is evaluable in isolation, and its evaluation is observable, so neither the collector nor provenance is blocked later.
- A run using guards writes no new file and leaves the deployment records byte-identical, mirroring the no-side-effects test `unknown-signer-v1-migration` specifies.
- Prior art: `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` for style, `createTestEnvironment` / `createMockArtifact` from `@rocketh/test-utils` for setup.

## Out of Scope

- **Log-based guards.** Some state changes are observable only as events, and neither a call nor a storage read can see them. The obstacle is not the design, it is the RPC: `eth_getLogs` needs a block range, and public nodes cap the range, cap the result count, or prune, so a log guard needs a `fromBlock` and needs to degrade legibly when the provider refuses. The paper validation below found no topology that requires it, so it is deliberately not built. If it returns, `Deployment.receipt.blockNumber` gives the natural default `fromBlock` (events cannot predate deployment), and `unsignable-routes` sets the precedent that "`eth_getLogs` is a module concern", a capability a module takes on rather than one core acquires.
- **Recording what changed**, which is `state-change-provenance`. This spec exposes the guard's evaluation for it to consume and writes nothing itself.
- The collector wrapper over `catchUnknownSigner` and any Safe batching or proposal, which stay in `explore-unknown-signer-adapters`.
- Call-through translation for Timelock / AccessManager holders of the upgrade right, which is `unsignable-routes`.
- Any per-`execute` id or other record-based skip, rejected in ADR 0012.
- Storage-layout validation on upgrade, which wants a post-deploy hook and is a separate request from a separate respondent.

## Paper validation (done before tasking, as `unsignable-routes` established)

Four real topologies from `work/notes/findings/governance-upgrade-topologies-in-the-wild.md`, each written as the guard it would need. Two of the four broke the original design, which is what this exercise is for.

**1. ProxyAdmin over an OZ transparent proxy.** Call `upgradeAndCall` on the ProxyAdmin, from its owner. The effect is observable only in the proxy's EIP-1967 implementation slot, and OZ's transparent proxy exposes no public getter for it. This is not an inference: `@rocketh/proxy` already reads it with `eth_getStorageAt` on `0x360894a1…` and says why in a comment, "without the proxy having to expose a getter, which is what we do here" (`packages/rocketh-proxy/src/index.ts`, the EIP-1967 slot constants and the read around the implementation comparison). **A call-only guard cannot express the single most common upgrade topology.** Hence the `storage` kind.

**2. Aave's `PoolAddressesProvider`.** Call `setPoolImpl` on the registry, from governance. `getPool()` returns the PROXY address and does not change; what changes is the implementation behind it. So the guard reads a different contract from the one called (the proxy, not the registry) AND reads a storage slot rather than a getter. Same shape as case 1, reached from a completely different contract design, which is the useful part: the storage kind is not an OpenZeppelin quirk.

**3. OZ `AccessManager` role grant.** Call `grantRole(roleId, account, delay)` on the manager. The observable is `hasRole(uint64,address)`, which returns a TUPLE (membership plus an execution delay). "Is this account a member" is a question about one component, and an `equals` against the whole return would force the author to also assert a delay they may not care about. **`equals` cannot express it.** Verify the exact return shape against OZ's source at build time rather than trusting this paragraph.

**4. OZ `TimelockController`.** The observable is `getOperationState(id)`, returning `{Unset, Waiting, Ready, Done}`, verified in the findings note from the contract itself. The condition for `schedule` is "state is Unset" and for `execute` is "state is Ready", and the general skip condition is "not Done", which is a negation. **`equals` cannot express it either.** Separately, computing `id` needs the salt, which the findings note establishes is recoverable only from `CallScheduled` / `CallSalt` logs. That is a strong boundary signal: **the timelock case is not the guard's job at all**, it belongs to `unsignable-routes`, whose route knows how to drive the contract. The guard answers "has the effect landed", a route answers "how do I drive this governance contract". Case 4 is therefore evidence that the seam is in the right place, not a requirement on this spec.

**What the validation changed:** it added a required third guard kind (`storage`), promoted `satisfied` from escape hatch to primary form, and confirmed the cross-contract requirement twice over. **What it confirmed:** the comparison rule holds, applied to the SELECTED value rather than the whole return; no topology needed a log-based guard; and no topology needed a fourth kind.

## Further Notes

The three motivations arrived independently and converged on one primitive, which is the strongest signal about it: a v2 user asking for state checks, the unknown-signer work needing a loop-closer under `throw`, and the batching work needing pending actions to be computable without executing them. Design for the third even if only the first two are built, because it is what determines whether the guard is a predicate or a declared read.
