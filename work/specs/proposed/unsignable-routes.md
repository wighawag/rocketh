---
title: 'Unsignable routes: lift a deferred transaction to one the operator can actually send'
slug: unsignable-routes
humanOnly: true
taskedAfter: [governance-topology-validation]
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks. (The technical-detail sections below are trimmed by `to-task` once the work is tasked — they move into tasks/ADRs and this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

When rocketh meets a `from` it cannot sign for, it reports `{from, to, value, data}`, whose meaning is "get `from` to send this". That is right when `from` is a multisig: the operator opens their Safe and sends it.

It is wrong, in a way that looks right, when `from` is a CONTRACT that cannot originate a transaction. Reading real protocol source (`work/notes/findings/governance-upgrade-topologies-in-the-wild.md`) shows this is the common case rather than an edge:

- a ProxyAdmin owned by an OpenZeppelin `TimelockController`, where rocketh reads the on-chain owner (`packages/rocketh-proxy/src/index.ts:345`) and so reports `from = <the timelock>`;
- an OpenZeppelin `AccessManager` with a non-zero role delay, which is how newer protocols gate configuration;
- any governance executor or registry that is itself owned by one of the above.

The user is handed something that reads like an instruction, is accurate about intent, and cannot be executed by anybody. The failure is silent in the worst way: it looks like it worked. The real transactions are different ones, addressed TO that contract, and there may be two of them separated by a delay.

The workaround today is to write the lifting by hand in the deploy script. It is about thirty lines and it works (`demoes/hardhat-deploy/governance/deploy/004_timelock_owned_admin.ts` does exactly this), but it means abandoning the declarative upgrade path that is the reason to use `@rocketh/proxy` at all.

## Solution

One hook in rocketh, and protocol knowledge in separate optional modules.

A **route** answers one question about an unsignable transaction: _what should the user do right now?_ It either produces a transaction they can actually send, or reports that something is already in flight and there is nothing to do yet.

```typescript
// rocketh/config.ts
import {timelockRoute} from '@rocketh/timelock';

export const config = {
	accounts: {
		deployer: {default: 0},
		governance: {default: '0xSafe…'},
	},
	unsignableRoutes: {timelock: timelockRoute()},
} as const satisfies UserConfig;
```

The deploy script does not change at all from the multisig case. Governance topology is declared once, where it belongs, and scripts stay topology-agnostic.

**Routes take no configuration**, which is the part that makes this cheap. Everything about the topology is discoverable on chain: who owns the admin (already read), whether that owner is a timelock (probe), its delay, whether an operation for this payload exists, and its state. The single fact that is NOT discoverable is _which account the user holds that can drive it_, because roles cannot be enumerated. That is not a fact about the chain, it is a fact about the user, they already declare it as a named account, and any candidate can be verified with `hasRole`.

**Routing lives at the seam**, where the error is constructed, before the policy branches. So the plain throw path, the interactive `ask` path and a wrapped call all report the transaction the operator can really send.

**The run always reports and then throws.** Strict ordering is preserved: one surfaced item per run, the operator acts, the script is re-run, it converges. Nothing accumulates and nothing continues past a step that did not happen.

## User Stories

1. As a team whose ProxyAdmin is owned by a Timelock, I want the surfaced transaction to be one I can actually send, so that reading the output and doing what it says is correct rather than misleading.
2. As that team, I want to keep using `deployViaProxy`'s declarative upgrade path, so this does not cost me the reason I use `@rocketh/proxy`.
3. As that team, I want to declare my governance once in config and leave every deploy script identical to the multisig case.
4. As that team, I want to be told when an operation is scheduled but its delay has not elapsed, rather than being handed the `schedule` call a second time and sending a duplicate that reverts.
5. As that team, I want a re-run to find the operation I already scheduled, so I never orphan one and never wait out a delay twice.
6. As a team using an `AccessManager` with a delay, I want the same treatment without rocketh shipping protocol-specific code in core.
7. As a user with an in-house governance contract, I want to write my own route in a few lines, so an unusual executor is my code rather than a feature request.
8. As a user with no such contract in the path, I want nothing whatsoever to change.
9. As a user who declared two routes that both claim the same address, I want to be told, not to have one silently win.
10. As a user whose declared account does not hold the role the route needs, I want the run to stop with a message naming the account, the role and the contract.
11. As a maintainer, I want protocol encodings out of core and behind optional packages, so `@rocketh/unknown-signer` does not accumulate governance frameworks.
12. As a maintainer, I want a route that returns something outside its own type contract to fail loudly, because routes are user-supplied.

## Autonomy notes

`humanOnly: true`: this adds a public config key and a public route contract that we then keep, so a human drives the tasking. Ordered `taskedAfter: [governance-topology-validation]`, which pins the current broken behaviour as tests first, so this spec flips known-failing assertions rather than designing against a remembered description.

No `needsAnswers`: the design questions were settled in full before this spec was written. The decisions and their reasons are below.

## Implementation Decisions

- **`unsignableRoutes` is a `Record`, not an array.** Order must not be expressible, because the moment it is, someone relies on shadowing and it becomes API forever. The key is a label used in diagnostics. There is precedent in `UserConfig`: `signerProtocols?: Record<string, SignerProtocolFunction>`.
- **Resolution is by count, not by precedence.** Every route probes; then: **0 claim** means today's behaviour, byte for byte; **1 claims** wins; **2+ claim** is an ERROR naming both keys and the address. Two routes claiming one address is a misconfiguration, and the only useful response is to say so. This also keeps the repo's discipline of one precedence rule rather than two. Overriding a standard route is done by not installing it; a catch-all route is unnecessary, because "nobody claimed it" already means "report as-is".
- **Two result variants, and the set is closed** because the variants answer exactly one question, _what should the user do right now?_, and that question has two answers:

  ```typescript
  type RouteResult =
  	| {kind: 'send'; transaction: {from; to?; value?; data?}}
  	| {kind: 'pending'; reason: string; until?: number; detail?: unknown};
  ```

  `undefined` means "not mine" and is absence, not a member.

- **`pending` is "in flight elsewhere", not "delayed".** Delay is one reason; the same variant covers an `AccessManager` role delay, a Safe transaction sitting at 2 of 3 signatures, and a cross-chain governance message in transit (Aave's a.DI ships governance across 20+ networks, so this is real). `until` is therefore OPTIONAL: signature collection has no timestamp. Naming it after delay would bake the timelock's accident into core.
- **`blocked` is a THROW, not a variant.** The invariant: every non-throwing outcome must have a path to completion. `send` completes when the operator sends it; `pending` completes on its own; "you hold no account with this role" completes only if a human edits config. It is also global by nature (one timelock, one missing role, every proxy blocked together), so continuing would surface a partial action set with no path to completion, which is worse than stopping.
- **`satisfied` is refused as unreachable.** The seam only fires because rocketh already read the chain and found the change necessary; if governance completed the action, the state changed and the seam does not fire. An unreachable variant is worse than a missing one, because every `switch` carries it forever.
- **One transaction per invocation; sequencing comes from re-runs.** A Compound-style expired operation needing `cancel` before `schedule` does not need a list: run 1 surfaces `cancel`, run 2 surfaces `schedule`, run 3 surfaces `execute`. The chain advances and the route recomputes, which is the same property that makes everything else idempotent. Only a genuinely atomic batch needs a list, and that is out of scope.
- **A `send` whose `from` is itself unsignable re-enters routing**, with a depth cap and a clear error at the cap, so Safe above Timelock above ProxyAdmin works without depth-1 assumptions.
- **The unforeseen goes in the payload, never in new variants.** Adding a governance protocol must never require a core change; if it ever does, the seam was cut in the wrong place.
- **Exhaustiveness follows the house idiom** (`work/tasks/done/broadcast-signer-switch-exhaustiveness-default.md`, precedent at `packages/rocketh/src/environment/unknownSignerPolicy.ts:81`): a `default:` doing BOTH a compile-time `const exhaustive: never = result;` and a runtime throw naming the unexpected `kind`. The runtime half is required for the same reason it was there: routes are user-supplied and TypeScript cannot police a value that violates its own type contract.
- **Misconfiguration throws a shared error class** so route authors do not each invent one. It lives on a SUBPATH, never a package root, for the reason `UnknownSignerError` lives on `@rocketh/unknown-signer/errors`: extension roots may hold only curried `(env) => …` functions, so a class on a root is refused by name at deploy-script run time.
- **Nothing is recorded and nothing is persisted.** No new `Deployment` field, no stored route, no drift detection, no salt derivation rule. The mechanism has no memory, which keeps "the chain is the state" true without an asterisk. Authority in particular must never be read from a cache: the case where the cache is wrong is the case where someone took over your governance.
- **`eth_getLogs` is a module concern.** A timelock route can recover its own pending operation and its salt from `CallScheduled` / `CallSalt` logs. That is how it avoids persistence. Core never knows.
- **`catchUnknownSigner` is UNTOUCHED**, keeps its exact v1 signature and return type, and is documented as a v1 compatibility shim whose sole remaining purpose is letting a run continue past a step that did not happen. It is not the mechanism, and the mechanism is not shaped to suit it. A `pending` result is producible only by a route, so a v1 script (which declares none) can never reach it; if someone declares routes AND wraps, the shim rethrows, because v1 has no representation for it and inventing one would be the tail wagging the dog.

## Testing Decisions

- **Paper validation FIRST, before any build task.** Put `@rocketh/timelock`, `@rocketh/access-manager` and a hypothetical `@rocketh/safe-service` against the two variants and check that none needs a third, and that none needs configuration beyond named accounts. This is the only real validation available without building it, it costs an afternoon, and it is the cheapest possible moment to discover the seam is cut wrong.
- **Zero routes is byte-identical to today.** The strongest single test in the suite: with no `unsignableRoutes` declared, every existing unknown-signer test passes unchanged.
- **Ambiguity**: two routes claiming one address errors, and the message names both keys.
- **Recursion**: Safe above Timelock lifts twice; exceeding the depth cap errors clearly.
- **Exhaustiveness**: mirroring the acceptance of the broadcast-signer task, temporarily deleting a `case` must make `pnpm typecheck` fail at the `never` assignment (verified manually, not committed).
- **The timelock module's state machine**, over the four `getOperationState` values, including the re-run that finds its own scheduled operation from logs.

Prior art: `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` for the integration-tests-as-documentation style, and the matrix from `governance-topology-validation`, whose pinned "current behaviour" assertions this spec flips.

## Out of Scope

- **Batching** several deferred transactions into one multisig transaction. That is the real fix for twelve independent upgrades needing twelve round trips, and it stays in `explore-unknown-signer-adapters`.
- Safe Transaction Service proposals and a persisted batch file, same place.
- The deployer-to-governance handoff error (`To change owner/admin, you need to call transferOwnership`), which shares a neighbourhood but is a different fix with no routing in it.
- The interactive resolver.
- Any change to the `Deployment` type or the deployment records.

## Further Notes

The design was settled by working the Timelock case end to end against OpenZeppelin's actual source, and several early positions did not survive it. Recorded here so they are not re-proposed:

- A config-declared topology (`timelockRoute({timelock: 'Timelock', controller: 'Safe'})`) was replaced by a zero-configuration route, once it became clear that everything except "which account do I hold" is discoverable on chain.
- A route recorded on the deployment, with drift detection when it disagreed with the chain, was dropped: it is authority read from a cache.
- A deterministic salt-derivation rule, and the persistence it might have needed, were dropped once `CallScheduled` / `CallSalt` turned out to make the operation and its salt recoverable from logs.
- A second, richer wrapper alongside `catchUnknownSigner` was dropped once the model became report-and-throw, since there is then no return value to design.
