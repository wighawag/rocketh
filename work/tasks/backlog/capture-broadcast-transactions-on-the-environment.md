---
title: 'Capture every transaction a run broadcasts, in order, and expose the list on the environment'
slug: capture-broadcast-transactions-on-the-environment
spec: captured-transactions
blockedBy: []
covers: [2, 3, 7, 9, 10]
---

## Decisions (these were the open questions; they are answered, do not re-open)

1. **An already-signed broadcast is captured AS ITSELF, under a `kind: 'raw'` variant.** The choke point already receives a discriminated union (`TransactionToBroadcast` in `@rocketh/core`: `{type:'object'; data}` | `{type:'raw'; from; raw}`), so it knows which it has and the raw variant carries `from`, meaning signability still resolves. Decoding Nick's-method into an intent was rejected: the canonical factory address derives from that exact sender and nonce, so a replay from any other sender lands the factory elsewhere and breaks the address equality a Solidity fixture depends on. Omitting it was rejected for leaving a replay unable to deploy the factory at all. The usual objection to raw does not apply here, because that transaction is designed to be replayed verbatim by anyone.

2. **There is no `account` field. `from` is the whole answer.** The address is what a Safe consumer proposes to and what a replay pranks, and it is unambiguous where a name is not. The rule behind it, which also settles the next question of this shape: capture what cannot be RECOMPUTED, omit what can. `signability` is runtime node state and is gone when the run ends; an account name is a join over config any consumer can redo from the address.

3. **A transaction resolved through `ask` IS captured**, and needs no new field to stay distinguishable. On a real network those are part of what the run accomplished, so omitting them would make the list silently incomplete. They cannot be mistaken for the batch because the unknown-signer seam is entered ONLY when signability is `unsignable` (`packages/rocketh/src/environment/index.ts:1391`, whose comment states that of the four states only `unsignable` reaches the policy, auto-impersonation having already run). So `impersonated` means rocketh sent it and it IS the batch; `unsignable` means a human already sent it out of band. A batch consumer proposes the former and never the latter, so double-execution cannot arise. A fork rehearsal should produce no `unsignable` entries at all, since impersonation is what makes those steps execute.

   **A DEFERRED transaction (the `throw` policy) is NOT captured.** It never happened. This list is what the run DID, not what it still owes, and that boundary is what stops this becoming the collector it replaced.

4. **`value` is the 0x-QUANTITY form, not a bigint.** That is what the choke point sees and what every call site already builds, so a bigint would mean decoding on capture and re-encoding at the file, and would make the list non-serialisable by a plain `JSON.stringify` (a bigint throws) which an in-process consumer hits before any file exists. The spec's `bigint` was an error and has been corrected.

## What to build

A run accumulates, in order, every transaction it broadcasts, and hands that list back as a field on the environment it returns. This is the primitive the whole spec rests on; the file sink is a separate task.

Capture happens at the single broadcast choke point every transaction already funnels through (the private function inside the environment module that `broadcastExecution` and `broadcastDeployment` both call). That placement is the point: there is no second send path to keep in step, and any future one inherits capture for free.

**What an entry holds** is the INTENT plus who sent it. From the spec:

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

Intent rather than the signed transaction is a decision, not a shortcut: a signed transaction commits to its nonce as part of the signature and can only be replayed by that sender at that nonce, while an intent replays at any nonce, under any prank, in any order. It is also the only thing that EXISTS for an impersonated sender, because the node fabricates the sender and no signed payload is produced anywhere.

**Nothing else is captured.** No gas, no fees, no nonce, no hash, no receipt. Recording a fee invites a consumer to replay it, and no consumer here wants the fee market of the moment the fork ran.

**`signability` is the existing classification, not a new one.** It is already a public type and the environment already computes it per address after impersonation resolves. `impersonated` means precisely "this account could not have signed for itself, the node faked it", which on a fork rehearsal is exactly the set that has to go to a Safe. A consumer finds its batch boundaries by watching this field change between consecutive entries, which is why rocketh never has to be correct about segmentation, only honest about ordering.

**Capture is NOT a fork feature and must not be gated on one.** The two consumers are two run modes: a fork of a real network with a Safe impersonated (wants the `impersonated` entries), and a memory node fresh from genesis (wants every entry). Capture everything, annotate it, let the consumer filter.

**The list is exposed on the environment**, alongside `deployments` and `tags`, because the environment IS what a run returns and there is no other place to put a run-scoped result without changing that signature. A deploy script therefore holds the same object and CAN read the list mid-run. That consequence is accepted knowingly and is deliberately not a feature: do not document it, do not build a hook, do not build a callback, and do not add a second capture-aware entry point to hide it.

The ordering promise is the load-bearing one and the only one: the list must be the true execution order of the run.

## Acceptance criteria

- [ ] After a run, the environment carries an ordered list of the transactions the run broadcast, and the order is the true broadcast order
- [ ] Every funnel that reaches the choke point produces an entry: a deployment, an `execute` / `executeByName` / `tx`, a proxy or diamond upgrade, and the deterministic-factory funding transfer
- [ ] Each entry carries `from`, `data`, the `to` (absent for a contract creation), the `value` where there is one, and the `signability` of the sender as the run classified it after impersonation resolved
- [ ] An entry carries the named account where one is resolvable, per the answer to open question 2
- [ ] No gas, fee, nonce, hash or receipt field appears on an entry, and a test pins that the emitted shape has exactly the agreed keys, so a fee cannot become an accidental contract later
- [ ] Capture is unconditional: a memory run against a fresh node captures exactly as a fork run does, with no flag and no fork descriptor involved, and a test covers both
- [ ] A run with an impersonated sender and a node-held sender produces entries whose `signability` differs, so a consumer can see where a batch has to be split
- [ ] The list is reachable from a caller that ran the deployment in process, with no file and no path agreed in advance
- [ ] The entry type is EXPORTED from `@rocketh/core`'s types (where `Signability` and `TransactionToBroadcast` already live) rather than left as a local shape inside the environment module, so the file-sink task and an out-of-repo consumer can name it
- [ ] The entry is appended at ONE explicit point inside the choke point, and a test pins what the order is when two broadcasts are issued concurrently (a deploy script can `Promise.all` them), since ordering is the only promise this feature makes
- [ ] No new capture seam is introduced: a transaction cannot reach the node without passing the place capture happens
- [ ] Tests cover the new behaviour in `rocketh`'s own test suite (which builds a real environment locally rather than importing `@rocketh/test-utils`, to avoid the nx project-graph cycle), mirroring the existing seam tests
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- None — can start immediately.

## Prompt

> Goal: make a rocketh run remember what it sent. Today the run knows exactly which transactions it broadcast, in what order, from which account, and then throws all of it away; deployment records keep the contracts and nothing keeps the calls. Accumulate the transactions at the broadcast choke point and expose them, in order, on the environment the run returns. Nothing more: no file (a separate task), no hook, no callback, no streaming.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, the ADRs, and the tasks it builds on? If the seam moved or an ADR superseded an assumption here, do NOT build on the stale premise; route the task to needs-attention with the discrepancy.
>
> DO NOT START until ALL FOUR open questions above are answered. Three of them (1, 2, 4) decide what an entry IS and the fourth (3) decides which transactions are entries at all, so guessing any one of them ships a list that is convincingly wrong.
>
> Domain vocabulary you need (`CONTEXT.md` pins these, read it): _signability_ is whether rocketh can get a transaction signed for an address (`local` / `node` / `impersonated` / `unsignable`), and it is NOT the same as having an entry in `addressSigners`; a _fork run_ is a run against a node somebody else forked, which is the forked network for RECORDS and is not that network for chain identity (ADR 0014); the _signer_ union has three variants and they are easy to get backwards.
>
> Where to look. The choke point is the private `broadcastTransaction` inside `packages/rocketh/src/environment/index.ts`: it is deliberately not exported and not on the `Environment` interface, and both public funnels (`broadcastExecution`, `broadcastDeployment`) go through it. The unknown-signer seam lives in the same function and shows how `env.addressSignability` is consulted per transaction, plus (in its error-enrichment branch) the existing reverse lookup from an address to deployment names, which is the prior art open question 2 is about. `Signability`, `TransactionToBroadcast` and the `Environment` interface are in `packages/rocketh-core/src/types.ts`.
>
> One funnel does NOT reach the choke point, and you should know it before you design rather than discover it late: `recoverTransactionsIfAny` (same module, around line 1023) adopts transactions a PREVIOUS run broadcast, waits for their receipts and saves the resulting deployments, all before the scripts run. Those transactions were sent by that earlier run, so they never pass this run's choke point and will be absent from this run's list. Do not widen the seam to cover them (they are not this run's intent, and a fork run does not save, so it has no pending-transaction file to recover from in the first place); DO name the gap in your `## Decisions` block, since it is the one case where the list is not the whole of what this run's node saw happen.
>
> Note the shape of the choke point before you design: it takes a `TransactionToBroadcast`, which is a union of `{type: 'object', data}` and `{type: 'raw', from, raw}`, and it has an early return for the raw variant before any signer lookup. Open question 1 is exactly about that branch. Enumerate the union from the type rather than from a search result. Note also what the object variant CARRIES: `EIP1193TransactionData` holds `value` as a 0x-quantity string, not a bigint, and so do all the call sites that build one. Open question 4 is which of the two forms the entry keeps; do not silently convert either way.
>
> Exposing the list on the environment means adding a field (and the entry type) to `@rocketh/core`'s types, which `AGENTS.md` normally lists as an ask-first change. The spec ratifies exactly this placement (alongside `deployments` and `tags`, because the environment IS what a run returns), so it is in scope here, but keep the addition to that field plus the entry type, and reshape nothing else in the interface.
>
> Constraints. `@rocketh/core` and `rocketh` are browser-capable (ADR 0002), so nothing here may reach for the filesystem. Keep to the repo's functional, curried style: no classes. The list is data on the environment, not a service.
>
> Seams to test at. `rocketh` cannot import `@rocketh/test-utils` (that package depends on `rocketh`, and the reverse edge closes an nx cycle that fails `pnpm build`), so tests for this live in `packages/rocketh/test/` and build a real environment against the mock EIP-1193 provider the way `unknown-signer-seam.test.ts` and `addressSigners-casing.test.ts` do. Test the ORDER across a mixed run (a deploy, then an execute, then a transfer), and test that a memory run captures just as a fork run does.
>
> Done means: after `loadAndExecuteDeploymentsFromFiles` resolves, a caller in the same process can read the ordered list of transactions the run sent, with the sender's signability on each, and can tell from it alone where a Safe batch would have to be split.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: the field's name and why, how you resolved anything the open answers left open, and any funnel you found that does not reach the choke point. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.
