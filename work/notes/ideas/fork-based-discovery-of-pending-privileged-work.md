# Discover pending privileged work by running against a FORK, and the case that `catchUnknownSigner` is the wrong primitive to build on

Raised while specifying `deferred-transaction-collector`, after that spec's file lifecycle was redesigned three times in three sittings. Repeated redesign of a small mechanism is usually a signal about the mechanism it sits on, so this note steps back and asks whether the base is right, rather than fixing the lifecycle a fourth time.

## The diagnosis

**`catchUnknownSigner` discovers pending privileged work by executing FORWARD through a counterfactual chain state.** The script runs on as though the deferred step had happened. It did not, so every subsequent read, encode and decision in that script is computed against a chain that does not exist.

Nearly everything awkward we have hit is downstream of that one property:

- steps must be independent of one another, which we require and cannot verify
- one wrapper per step, because the throw unwinds the action and the first deferral ends it
- the migrations hazard, because the script survives to reach `return true`
- the collector, its file, the truncate/append lifecycle and the `complete` flag, which exist to carry the results of that forward execution safely
- the multi-batch problem a production team reported ("I need 3 batches that, in theory, could all be executed within a single safe proposal"), which is this counterfactual meeting an ABI change

The repo has already half-said this. `unknown-signer-v1-migration` states that `catchUnknownSigner` "is a v1 compatibility shim, and its sole remaining purpose is letting a run continue past a step that did not happen". If that is true, then building the batching story ON it is entrenching a shim, not building the future.

## The goal, restated without the mechanism

What the two production teams actually want is not "continue past a failure". It is:

> **Discover every pending privileged action in ONE pass, so they go into ONE signing ceremony.**

Continuation is how v1 achieved that, not the goal itself. Without it a run halts at the first deferral, so twelve pending upgrades cost twelve round trips through a multisig, each needing signers to gather. That is the pain. Batching is the cure. Forward execution through a counterfactual is merely v1's route to it.

## The alternative: a FORK, not a guard-driven dry run

The first version of this note proposed evaluating guards to compute the pending set without executing. That is a dry run, and a dry run has two holes that make it the wrong shape:

- **A read after an execute is invalid.** The execute did not happen, so the read returns pre-change state, and any decision made on it is wrong. This is the counterfactual again, just relocated.
- **Deploys have to go somewhere.** Either the dry run does not deploy, and every later step that needs the address is stuck, or it does, and the run has side effects while claiming to be dry.

**A fork has neither hole, because everything genuinely executes.** Run the script against a fork of the target network with the unsignable account impersonated: the state advances, reads after executes are correct, deploys are real, and the ordering is real. There is no counterfactual anywhere, because nothing is being pretended.

The mechanism is already mostly present. `autoImpersonate` is a node-capability switch that runs BEFORE the seam (ADR 0006), so on a fork the Safe-owned account resolves to `impersonated`, becomes signable, and every step broadcasts normally. Running a deploy script against a fork today already executes the whole thing end to end.

What is missing is small and well-defined: **capture the transactions sent from accounts that are unsignable on the REAL network.** That is the batch. Compare that to the collector plus its file plus its lifecycle plus a dry-run mode, and it is a much smaller thing to build.

Guards remain valuable and independently justified (they are what makes a re-run converge, and what makes a repeated run not re-send), but they are not the discovery mechanism. The fork is.

**And then `ask` generalises from per-transaction to per-run.** Today `ask` pauses at each unsignable transaction, takes a pasted hash, verifies inclusion and continues with real state. That is exactly the right behaviour at the wrong granularity: N transactions means N pauses and N ceremonies, which defeats batching. But that granularity is an artifact of the seam sitting on a single `broadcastTransaction`, not a law.

A batch `ask` would: evaluate the guards, present the whole pending set once, let the operator execute it as one Safe batch, take one hash back, verify it, and continue the run with REAL state.

What that buys, beyond one ceremony instead of twelve:

- **The deployment records update in the same run.** This is the complaint neither `catchUnknownSigner` nor the collector answers, reported verbatim: "I have to re-run the script after Safe execution in order to update deployment files (i.e., ABI changes and new implementation address)."
- No counterfactual, because nothing continues past an un-executed step.
- No collector, no file, no lifecycle, no `complete` flag, no `runAtTheEnd` join point.
- No migrations hazard, because the step genuinely happened before the script returned.

## The claim that dependent steps cannot be batched is WRONG, and the fork is why

Stated twice in this design conversation as inherent, and it is not. Recording the correction because it changes what the feature is worth.

The reasoning was: step B must be encoded against an ABI that only exists after step A (an upgrade) executes, so B cannot be in A's batch. That holds for N SEPARATE sequential transactions. It does not hold for an atomic batch. A Safe MultiSend executes its calls sequentially **within one transaction**, so A's effect IS visible to B, and the batch performs the same state transition the fork just performed.

And the fork is what makes B encodable in the first place: on the fork, A really executed, the new implementation is live, so B is encoded against the ABI that will be live when B runs inside the batch.

So the reported problem, "I need 3 batches that, in theory, could all be executed within a single safe proposal", is solvable, and the person reporting it already suspected it was. Fork to discover and encode, MultiSend to execute atomically, one proposal.

The honest caveat is staleness rather than impossibility: the fork is pinned at a block and the real chain moves, so an encoding can go stale between forking and execution. That degrades to a revert rather than to a wrong action in most shapes, and re-evaluating the guards at proposal time would narrow it further.

## A correction to ADR 0012 that this raises

ADR 0012 rejects a `'collect'` policy partly on the grounds that the seam must return a real transaction hash, so collecting "would have to fabricate a hash, a receipt, and for a deploy an address for a contract that does not exist".

That argument is weaker than it reads. `execute` returns `Promise<EIP1193TransactionReceipt>` (`packages/rocketh-read-execute/src/index.ts`), and `execute-state-guard` ALREADY forces the question of what it returns when a guard is satisfied and no transaction is sent. Once "this call produced no transaction" is a representable return, fabrication is no longer required for the execute path.

It does not collapse entirely: a deploy still has an address that dependent code will use, and the counterfactual problem for dependent steps is untouched. But the ADR overstates a design constraint as an impossibility, and the guard spec has to answer the same question anyway. Worth correcting when this is resolved either way.

## Reconciling the batch with the scripts: the run is a SEQUENCE OF SEGMENTS

The hardest question this idea faces, and it kills the naive version. Take a script that does:

1. deployer deploys `NewImpl`
2. **Safe** upgrades the proxy to it
3. deployer calls a function on the new implementation
4. **Safe** grants a role, which only makes sense after 3

The naive batch is `[2, 4]`, executed as one Safe proposal. It is wrong: 4 depends on 3, 3 depends on 2, and hoisting 2 and 4 out of their positions changes the order the chain sees. Executing the batch and THEN running the scripts for real also requires every earlier step to be idempotent, which we ask for and cannot enforce.

The correct model is that a run is an ordered sequence of **segments**, each a maximal contiguous stretch of steps with the same executor. The example is four segments: deployer, Safe, deployer, Safe. Batching is only ever safe WITHIN a segment, never across one, because a segment boundary is exactly a point where somebody else's transaction has to land in between.

So the number of signing ceremonies is the number of Safe segments. That is more than one in the example, and that is correct rather than a failure: it is the minimum the topology allows, and the alternative is not fewer ceremonies but a batch that reverts. The win over today stands, because today each unsignable STEP costs a ceremony and here each unsignable SEGMENT does.

This also answers the interleaving question directly. A Safe batch that only works if some other sender's transaction lands in the middle is a batch that spans a segment boundary, and the segmentation refuses to build it. Better still, the fork run reports that in advance, instead of the operator discovering it when the proposal reverts.

### Which means the dry run should not be a separate command

If the plan is computed by a standalone dry run and then executed by a separate real run, the two can disagree, and reconciling them is exactly the idempotency problem we cannot enforce our way out of.

So do not separate them. The real run pauses at each segment boundary, and at that moment forks from the CURRENT chain state and runs forward on the fork just far enough to discover the rest of the segment. That gives the batch, which is presented, executed out of band, verified by hash, and the real run continues with real state.

The fork becomes an implementation detail of `ask` rather than a mode the user invokes. There is no plan artifact to go stale, because the lookahead happens at the moment it is needed, from the state that actually exists.

A standalone dry run is still worth having, for a different job: telling a team in advance how many ceremonies a deployment will cost and what is in each. That is planning, not execution, and it may go stale without harm.

## SCOPING DECISION: ship the standalone dry run first, and let the user do the batching

The segmented just-in-time model below is the better end state, but it is not what ships first. The first deliverable is the standalone dry run, producing **the transactions in order, annotated with their sender**, and the user batches them however their governance requires.

This is right for three reasons. It is what the teams already have the other half of: both wrote their own proposal code, and neither asked us to decide their batching. It defers the EDR work, which is the only genuinely new runtime capability in this whole idea. And it means rocketh never has to be correct about segmentation, only honest about ordering, which is a much smaller promise to keep.

What that puts on the OUTPUT, though, is the whole burden: it has to carry enough for a user to segment it themselves. Ordered, each entry naming its sender, and each entry marked with whether that sender is signable on the REAL network. Without the last part a user cannot see where the boundaries are, and the boundaries are the entire question (see the segment discussion above). The ordering must be the true execution order from the fork, not a grouping we imposed.

A good test of the output: a user reading it should be able to tell, unaided, that the example above needs two proposals rather than one.

## Forking in-process, and why it is not just about dropping a dependency

Just-in-time lookahead needs a fork on demand, mid-run. Spawning anvil at that moment is awkward; instantiating EDR in-process is not. So the runtime choice and the segment model are linked, and the staging suggested during design is the right shape:

1. **Rely on an already-running anvil or hardhat node**, with `--fork` telling rocketh which network that node forks. Cheapest, unblocks the standalone dry run, and does not support just-in-time lookahead.
2. **Use EDR in-process**, with the real node used only for reads. Enables lookahead mid-run, and removes the requirement that users run a node themselves.
3. **Our own fork implementation**, only if ever needed. Almost certainly not worth it.

One constraint on step 2: EDR is a native binary, so it cannot live in `@rocketh/core`, which ADR 0002 keeps browser-capable. It belongs in an optional package on the Node side, which is what ADR 0005's fine-grained packaging is for.

### What EDR looks like up close, since "probably not trivial" was the worry

Read from `@nomicfoundation/edr@0.15.0`'s type declarations in this repo's own tree. Four things, and they all point the same way:

- **It is already here.** EDR 0.15.0 is in the lockfile, pulled in transitively by the hardhat 3.12 that `packages/hardhat-deploy` depends on. Adopting it would be a new DECLARED dependency for a rocketh package, not a new download for anyone already in this tree.
- **Forking is a config field, not an integration.** `ProviderConfig.network` is `ForkConfig | LocalConfig`, and `ForkConfig` is `{url, blockNumber?, cacheDir?, chainOverrides?, httpHeaders?}`. Construct a provider, point it at a URL, optionally pin a block. `cacheDir` caches remote JSON-RPC responses, which matters if lookahead ever forks repeatedly in one run.
- **The precompile hook is first-class**, which answers the `ecrecover` question. `ProviderConfig.precompileOverrides: Array<Precompile>` is a documented field, `Precompile` is an exported class, and `precompileP256Verify(): Precompile` ships as an example. So overriding `0x1` is a supported configuration rather than a trick, and it is available ONLY in-process, since there is no RPC equivalent. **Caveat, and it is the load-bearing one: it is not clear from the declarations whether a caller can supply an ARBITRARY precompile implemented in JS, or only select from ones EDR ships.** Check that before promising signature faking.
- **It also runs Solidity tests.** `SolidityTestRunnerFactory` is exported. That is the other feature already wanted (Solidity tests against a deployment built by the TypeScript deploy scripts), so an EDR integration would serve two purposes, not one. That changes its cost/benefit considerably and is worth weighing when step 2 comes up.

## The signing gap: impersonation sends transactions, it does not sign messages

Impersonation lets a node send a transaction AS an address. It does not let anyone produce a SIGNATURE from that address, so a deploy step that needs a signed message from a privileged account (an EIP-712 authorisation, a permit, a signature passed as calldata) cannot be simulated by impersonation alone.

The suggested workaround is to hijack the `ecrecover` precompile so any signature recovers to the desired address. Two things to check rather than assume:

- **Whether it can be done over RPC at all.** In revm-family EVMs precompiles are resolved BEFORE account code, so setting code at `0x1` through `anvil_setCode` plausibly does nothing. If that holds, this is another capability available only via EDR in-process, which strengthens step 2 above.
- **Whether it should be default.** It makes every signature check in the system pass, so the fork stops being a faithful simulation of anything. If built, it should be explicitly opt-in and loudly reported in the run output.

## Transaction capture is wanted twice over

The capture this idea needs (record the transactions a run sent, with enough fidelity to replay them) is also what a Solidity-side test fixture needs: build a deployment from the TypeScript deploy scripts, then exercise it from Foundry tests. That was already a wanted feature (`work/notes/ideas/foundry-support-via-forge-deploy.md`, and the field study's finding that Foundry interop must work Solidity-side rather than JS-side).

So capture should be specced for both consumers rather than as a private detail of this idea. If it is built once and serves two features, it is also considerably easier to justify.

## Two gaps this depends on

**Fork support is not exposed outside the hardhat-deploy plugin.** `environment?: string | {fork: string}` is in `@rocketh/core` (`packages/rocketh-core/src/types.ts:349`) and the executor honours it (`getEnvironmentName`, which sets `fork` and switches the chain lookup to 31337). But the only code that ever CONSTRUCTS `{fork: ...}` is `packages/hardhat-deploy/src/helpers.ts`, from the `HARDHAT_FORK` environment variable. The rocketh CLI has no `--fork` option at all. So the capability this whole idea rests on is reachable only by hardhat users, through an env var. If the fork is the answer, exposing it is the first task, and it is small.

**Core would save a fork run into the real deployments folder, though the one caller that can fork guards against it, and there are three other corrections besides.** Investigated and written up in `work/notes/observations/what-fork-actually-does-today.md`. In short: `saveDeployments` defaults true for any environment not named `memory`/`hardhat`/`default`, and a fork of mainnet is named `mainnet`; `fork` currently means "the environment was not given as a string", so a plain in-memory run is flagged as a fork; the forked network's chain config is not used (the existing `idToFetch = fork ? 31337 : chainId` TODO), so a dry run would use the wrong policy; and `autoImpersonate` has no fork-aware default. Four corrections to something that exists, plus capture and CLI exposure as the only genuinely new parts.

## Recommendation

Do not build `deferred-transaction-collector` yet. Compare it against fork-based discovery, and the collector may turn out to be unnecessary rather than merely second.

**A hardhat-deploy user needs no `--fork` at all.** They already get a fork through `HARDHAT_FORK` and hardhat's own network config, which is what `packages/hardhat-deploy/src/helpers.ts` turns into `{fork: name}`. `--fork` exists ONLY for rocketh users who are not on hardhat or hardhat-deploy. That splits the work in two, and the audience that actually reported this problem is on the side that needs less of it: both DeFi teams in the field study deploy with hardhat.

**Track A, needed by both audiences, and enough to ship the dry run for hardhat-deploy users:**

1. `execute-state-guard`, regardless. Every path needs it and it is unambiguously right.
2. The fork-semantics corrections, all core-level and therefore affecting hardhat users too: a flag that means "fork of X" rather than "the environment was not a string", a fork-aware `autoImpersonate` default, and the existing `idToFetch` TODO resolved as a SPLIT rather than a swap (the connection must keep coming from the local 31337 config, since that is what points a fork run at the fork instead of at production; only the deployment semantics and policy should come from the forked network).
3. Transaction capture, plus the output format. Specced for BOTH consumers: this idea, and Solidity-side test fixtures. This is the actual deliverable, and the only genuinely new thing in Track A.

**Track B, standalone rocketh users only:**

4. Move "a fork does not save" into core. A fork run must keep READING the forked network's deployments, which is the point of it and already works; it must not save into that folder. Core's default would, but the hardhat-deploy caller guards it itself (`helpers.ts:130`, `saveDeployments: isFork ? false : undefined`). So this is not a live bug, it is precisely the trap the standalone path would spring, which is why it belongs here rather than first.
5. `--fork` in the rocketh CLI, against an already-running anvil or hardhat node. A BOOLEAN flag with no argument: `-e, --environment` already names the environment and the connection URL already comes from the local chain config, so `-e mainnet --fork` needs nothing more and nothing conflicts.

**Later, either audience:**

6. Just-in-time lookahead and EDR in-process, which is what a segmented `ask` needs, and which now has a second justification (the Solidity test runner).

Two things worth noticing about this shape. Most of Track A is corrective rather than additive, and worth doing even if the batching idea is dropped entirely. And the dry run reaches the people who asked for it after Track A alone, so `--fork` is audience expansion rather than a prerequisite.

## What would kill this idea

- If a fork run cannot be kept from writing to the real deployments folder without unpleasant surgery (see the gap above).
- If a batch `ask` cannot verify a Safe batch execution the way the current `ask` verifies a single transaction. The evidence classifier already handles the "goes TO the Safe carrying our call inside it" shape (`pastedTransactionIntent.ts`, the `embedded` tier), which is encouraging, but a MultiSend carrying N calls is a harder match and has not been checked. Note this only affects the batch-`ask` variant; handing the list to the user's own proposer does not need it.
- If teams cannot or will not run a fork as part of their deployment flow. Worth asking the two teams directly, since both already run forks for testing.
- If real deployments turn out to be mostly ONE Safe segment anyway, in which case the segment machinery is over-engineering and a single pause is all anyone needs. Worth checking against a real upgrade script before building segmentation.
- If fork staleness bites harder in practice than the revert-not-corrupt reasoning above suggests.
