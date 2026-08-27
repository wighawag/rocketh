---
title: 'A state guard on execute: declare when a call is still needed'
slug: execute-state-guard
humanOnly: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: the tasks in `work/tasks/`. Tasked 2026-08-27: the implementation, testing and paper-validation detail that used to live here now lives in the `execute-guard-*` tasks, and the durable rationale in `docs/adr/0013-the-execute-guard-is-a-declared-read.md`.

## Problem Statement

`execute` has no answer to "is this call still needed?". Every other primitive does: `deploy` compares bytecode, `deployViaProxy` compares the current implementation address. `execute` runs whatever you hand it, every time, and it is the user's job to write `const current = await read(...); if (current !== target) await execute(...)` at every call site.

That gap is felt in three separate places that turn out to be the same gap.

**It is what an existing v2 user asked for, in those words.** Asked what is missing from current deployment tooling, an infrastructure team using hardhat-deploy v2 answered: "State checks beyond the contract deploy itself, i.e. have these functions been called? and explicit artifacts from other state changes." That is two requests. This spec is the first; the second is `state-change-provenance`, split out because it is a persisted output with its own lifecycle rather than an option on a function.

**It is the only thing that closes the unsignable-signer loop.** ADR 0012 establishes that a persisted record can only assert what rocketh OBSERVED, that `throw` observes nothing, and that a record is therefore at most an optimisation in front of a chain-derived check, never a substitute for one. Under `throw` with no guard, the operator executes the transaction on their Safe, re-runs, and rocketh surfaces the identical transaction again because it has no way to know. Following the instructions twice executes the call twice, which for a mint, a transfer, an increment or a nonce-bearing governance action is a real loss. The guard is what makes the re-run converge instead.

**It is what makes deferred transactions computable as a set.** Today the second unsignable transaction in a script is discoverable only by executing past the first, because the deferral is a throw that unwinds. A guard expressed as a chain read can be EVALUATED without executing anything, which is what a collector needs to know which steps are still pending before it proposes a Safe batch.

The workaround today is a hand-written read-then-if at every call site, or a script-level `id` plus `return true`, which is coarse (it skips the whole script) and, on a caught deferral, actively dangerous (ADR 0012's amendment, and `document-migrations-and-run-at-the-end`).

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
8. As a deployer upgrading through a ProxyAdmin, I want the guard to read the EIP-1967 implementation slot, because the proxy exposes no getter for it and this is the most common upgrade topology there is.
9. As a deployer checking a role or an operation state, I want to assert one component of a tuple return, or a negation, without having to state a value I do not care about.
10. As a deployer comparing a checksummed address or a role identifier, I want casing not to matter, and comparing a name or a symbol, I want casing to matter, so the comparison matches what the value MEANS.
11. As a maintainer, I want the guard evaluable WITHOUT executing the call, so a later collector can compute the set of pending actions before proposing a batch.
12. As a maintainer, I want the guard's evaluation (what was read, what it was compared against) exposed rather than reduced to a boolean, so provenance can consume it later without the option being re-cut.
13. As a v1 migrant, I want the guard to be additive, so existing `execute` calls keep working.

## Out of Scope

- **An opaque predicate as the guard itself** (`guard: async () => boolean`), which is the shape everyone reaches for first. It is the hand-written read-then-if relocated inside the call, and it destroys exactly the three properties stories 6, 11 and 12 ask for: there is nothing to report, nothing to evaluate without running the closure, and nothing for provenance to consume. `satisfied` keeps the expressive half while leaving the read declared. Reasoning in ADR 0013; it remains additive if the legibility cost is ever worth paying.
- **An explicit "this effect is not observable on chain" marker.** Asked for during specification so the escape hatch would be visible in the script rather than implied by absence, and dropped at tasking (2026-08-27): with no mandatory mode, such a marker has no mechanical effect at all, so it is a code comment with a type. Absence of a guard IS the escape hatch. It returns only if a project-level `requireGuards` is ever requested, since only then does it say something a comment cannot.
- **Log-based guards.** Some state changes are observable only as events, and neither a call nor a storage read can see them. The obstacle is not the design, it is the RPC: `eth_getLogs` needs a block range, and public nodes cap the range, cap the result count, or prune, so a log guard needs a `fromBlock` and needs to degrade legibly when the provider refuses. The paper validation found no topology that requires it, so it is deliberately not built. If it returns, `Deployment.receipt.blockNumber` gives the natural default `fromBlock` (events cannot predate deployment), and `unsignable-routes` sets the precedent that "`eth_getLogs` is a module concern", a capability a module takes on rather than one core acquires.
- **Recording what changed**, which is `state-change-provenance`. This spec exposes the guard's evaluation for it to consume and writes nothing itself.
- The collector wrapper over `catchUnknownSigner` and any Safe batching or proposal, which stay in `explore-unknown-signer-adapters`.
- Call-through translation for Timelock / AccessManager holders of the upgrade right, which is `unsignable-routes`. The guard answers "has the effect landed"; a route answers "how do I drive this governance contract".
- Any per-`execute` id or other record-based skip, rejected in ADR 0012.
- Storage-layout validation on upgrade, which wants a post-deploy hook and is a separate request from a separate respondent.
- A project-level `requireGuards` flag, considered and dropped as unrequested. It can return if a team asks.

## Further Notes

The three motivations arrived independently and converged on one primitive, which is the strongest signal about it: a v2 user asking for state checks, the unknown-signer work needing a loop-closer under `throw`, and the batching work needing pending actions to be computable without executing them. That third consumer is what determined the guard's shape (a declared read rather than a predicate), and the reasoning is recorded in ADR 0013.
