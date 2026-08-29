---
title: 'Captured transactions: keep the list of what a run sent, so a fork run can produce a batch and a deployment can be replayed'
slug: captured-transactions
humanOnly: true
taskedAfter: [execute-state-guard]
---

> Launch snapshot, recording intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: the tasks in `work/tasks/`. (The technical-detail sections below are trimmed by `to-task` once the work is tasked, after which this spec settles to its durable framing: Problem / Solution / User Stories / Out of Scope.)

## Problem Statement

A rocketh run knows exactly which transactions it sent, in what order, from which account, and then throws all of it away. The deployment records keep the contracts; nothing keeps the calls.

That gap is what stands between the fork work that just shipped and the feature it was built for. `work/notes/ideas/fork-based-discovery-of-pending-privileged-work.md` lays out the whole route: run the deploy scripts against a fork of the target network with the Safe-owned account impersonated, and every privileged step executes for real against real state, in real order, with reads after executes returning true values and deploys landing at real addresses. There is no counterfactual anywhere, which is the thing `catchUnknownSigner` cannot offer. At the end of that run rocketh has, in memory, precisely the list of transactions the operator's multisig needs to execute. It then discards it, so the operator has nothing to take to their Safe.

Everything else that idea asked for is now in place: the guard, the fork descriptor that names the simulated network, fork-aware impersonation, the configuration split, "a fork does not save", and `--is-fork`. This is the remaining piece, and the idea calls it "the actual deliverable, and the only genuinely new thing".

The same list answers a second, unrelated-looking question. A team that deploys with rocketh's TypeScript scripts and tests in Solidity has no way to build a test fixture from their real deployment sequence: the deploy scripts run in JavaScript and Solidity tests cannot call them (`work/notes/ideas/foundry-support-via-forge-deploy.md`, and the field study's finding that Foundry interop has to work Solidity-side). A recorded, ordered, replayable list of transactions is a fixture.

**The two consumers want different halves of the same mechanism, and neither wants a counterfactual.** That is why this is one feature rather than two.

## Solution

Accumulate every transaction the run broadcasts, and make the list available. Nothing more.

Capture happens at the broadcast choke point, which is the single place every transaction already passes through (`packages/rocketh/src/environment/index.ts`), so there is no new seam and no path that can bypass it.

**What a captured entry holds.** The INTENT, plus who sent it:

```typescript
{
	from: `0x${string}`,
	to?: `0x${string}`,        // absent for a contract creation
	value?: bigint,
	data: `0x${string}`,
	signability: Signability,  // 'local' | 'node' | 'impersonated' | 'unsignable'
	account?: string,          // the named account, where the run resolved one
}
```

**Intent rather than the signed transaction, and this is a decision rather than a shortcut.** A raw signed transaction commits to its nonce as part of the signature, so it can only ever be replayed by that sender at exactly that nonce. An intent can be replayed at any nonce, by any prank, in any order. For every consumer named here, intent is therefore MORE replayable than raw, not a lossy substitute for it. It is also the only option that works at all for the batch: an impersonated sender never produces a signature, because the node fabricates the sender (`eth_sendTransaction`) and no signed payload exists anywhere to capture.

Gas and fee fields are captured by nobody and emitted by nobody, for the same reason: recording them invites a consumer to replay them, and none of the consumers here wants the fee market of the moment the fork ran.

**`signability` is the existing classification, not a new one.** `Signability` is already a public type and `env.addressSignability` already computes it per address after impersonation resolves. `impersonated` means precisely "this account could not have signed for itself, the node faked it", which on a fork is exactly the set that needs to go to the Safe. Reusing it means the batch consumer needs no new concept, and a segment boundary is simply a change in this field between consecutive entries.

**Capture is NOT a fork feature.** The two consumers are two RUN MODES, and gating on `fork` would break the second one:

| consumer         | run mode                                            | wants                                |
| ---------------- | --------------------------------------------------- | ------------------------------------ |
| Safe batching    | a **fork** of the target network, Safe impersonated | the `impersonated` entries, in order |
| Solidity fixture | a **memory** node, fresh from genesis               | every entry, in order                |

On a memory run there is no real network for anything to be unsignable on, so the fork-shaped framing ("capture what is unsignable on the real network") does not survive contact with the second consumer. Capture everything; annotate; let the consumer filter.

**The in-memory list is the primitive; the file is one sink.** The run has to accumulate the entries in memory regardless, so exposing them costs nothing and serves every in-process consumer directly, a hardhat plugin above all. Serialising to a file is for consumers on the other side of a process or language boundary.

Deliberately NOT built: a callback hook, and a streaming/pipe mode. A hook would be more machinery than exposing the data, and nothing needs to observe entries mid-run (see the lifecycle below); writing to stdout would interleave with the run's own logging, which is a trap rather than a feature. A consumer that truly wants a stream can point the file at one.

**Lifecycle: written once, atomically, at the end of a successful run.** This is the whole lifecycle, and its simplicity is a consequence of the fork model rather than an accident.

The predecessor spec (`deferred-transaction-collector`, now dropped) needed truncate-at-start, append-as-you-go and a `complete` flag, because on a REAL network a run that halts halfway has already SENT real transactions: those happened, and discarding them would be choosing a loss over a duplicate. None of that applies here. On a fork or a memory node nothing real happened, so a halted run has not produced a smaller truth, it has produced a misleading one, and a partial batch is actively dangerous: an operator who executes it sends a subset of the work believing it is the whole. So a run that throws writes nothing and leaves any previous file untouched. A throw is a real error, and the fix is to fix it, not to publish half a plan.

**Ordering is the load-bearing promise, and it is the only one.** The list must be the true execution order of the run. rocketh does not group, does not batch, and does not decide what belongs in a proposal: the user segments the list themselves, which is exactly what `signability` is there for. This keeps rocketh from ever having to be CORRECT about segmentation, only honest about ordering, which is a far smaller promise to keep and the reason the standalone dry run ships before any batch-`ask`.

## User Stories

1. As an operator rehearsing an upgrade on a fork of mainnet, I want the transactions my Safe must send, in order, so that one fork run replaces twelve round trips through a multisig.
2. As that operator, I want each entry to say which account sent it, so I can tell which Safe a transaction belongs to when more than one is involved.
3. As that operator, I want to see where my batch has to be split, so I learn that from the output rather than from a proposal that reverts.
4. As that operator, I want a run that failed to produce NO output, so I can never mistake a partial list for the plan.
5. As a team testing in Solidity, I want the transactions my deploy scripts sent against a fresh node, so I can rebuild the same deployment inside a Solidity test.
6. As that team, I want the replay to produce the same contract addresses as the real deployment, which it does when the run starts from a fresh node, because the nonces then match exactly.
7. As a plugin author wiring `hardhat test solidity` to run deploy scripts first, I want the list in process from the run I just performed, without a temporary file and a path to agree on.
8. As a user who wants none of this, I want a run that behaves exactly as it does today and writes no new files unless I ask.
9. As a maintainer, I want capture to sit at the existing broadcast choke point, so no future send path can silently escape it.
10. As a maintainer, I want the emitted shape to carry nothing a consumer should not replay, so that fees and nonces cannot become an accidental contract.

## Out of Scope

- **Batch `ask`, and segmentation.** rocketh emits an ordered, annotated list; the user batches it. Deciding what constitutes one proposal, pausing a run at a segment boundary, and verifying a MultiSend execution by pasted hash are all a later feature, and the note that proposes them says so.
- **Raw signed transactions.** Argued above: strictly less replayable, and impossible for the impersonated senders that matter most. Additive to add later if a consumer with a real need appears.
- **A persisted ledger.** The output is a snapshot of one run, never read back by rocketh to decide anything. ADR 0012's warning is about a record that acquires AUTHORITY; this one has none by construction.
- **In-process EDR and just-in-time lookahead.** The fork here is a node the user already started, reached through `--is-fork` or `HARDHAT_FORK`.
- **Deciding the Solidity integration.** See below: `hardhat test solidity` can already fork, so the plugin may not need this list at all. That choice belongs to whoever builds the plugin, and this spec must not foreclose it.

## Further Notes

**The Solidity consumer has a second route, and it is worth checking before assuming this one.** `hardhat test solidity` supports forking today: `SolidityTestForkingConfig` takes `{url, blockNumber, rpcEndpoints}`, and the profile also exposes `fsPermissions` and `ffi`. So a plugin could run the deploy scripts against a local node and simply point the Solidity test profile at that node, and the tests would see the real deployed state with no capture, no replay and no fidelity question. That is simpler than replaying intents in `setUp()`, and it ships already.

Where capture wins for that consumer is the case with no live node at test time: a checked-in artifact that a pure `forge` user can replay, with no hardhat and no running RPC. Both are legitimate; the point is that the Solidity story is a REASON capture is useful, not a justification that stands on its own. **The load-bearing justification is the Safe batch**, which has no alternative route at all. If this spec is ever cut down, cut it to that.

**A correction owed to ADR 0012.** It rejects a `'collect'` policy partly on the grounds that the seam must return a real transaction hash, so collecting "would have to fabricate a hash, a receipt, and for a deploy an address". That is weaker now: the execute-state guard already made "this call produced no transaction" a representable return. The argument does not collapse entirely, since a deploy still has an address dependent code will use, but the ADR overstates a design constraint as an impossibility and should be corrected when this lands.
