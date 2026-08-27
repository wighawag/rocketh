---
title: 'A fork is a fork OF something: make the flag say which network, and derive the run defaults from it'
slug: fork-of-a-named-network
humanOnly: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: the tasks in `work/tasks/`.

## Problem Statement

rocketh already runs against a fork, and hardhat-deploy users do it every day through `HARDHAT_FORK`. What rocketh does not have is any idea that it is on a fork **of** something.

`env.network.fork` is set from `typeof environmentProvided !== 'string'`, so it means "the environment was not given as a string". `environment` is optional, so an ordinary in-memory run is flagged as a fork, and a fork of mainnet carries the same bare `true` as `-e memory`. The flag cannot answer the only question anyone actually asks of it, which is "a fork of what?".

Three consequences follow, and they are all the same consequence: **a decision that should be derived from "this is a fork of mainnet" is instead derived from nothing, or from the wrong side.**

**The run takes its deployment semantics and policy from the LOCAL node's chain config.** `idToFetch = fork ? 31337 : chainId` sends the whole lookup to 31337. Half of that is correct and load-bearing: `actualChainConfig` supplies the provider, so 31337 is exactly what points a fork run at the fork instead of at production. The other half is wrong, because the same lookup also supplies `deterministicDeployment`, `onUnknownSigner`, `autoImpersonate`, `confirmationsRequired`, `autoMine` and the environment tags. A user who configures mainnet's policy and then rehearses against a fork of mainnet does not get mainnet's policy.

**`autoImpersonate` is off unless someone sets it**, and it is the one thing that makes a Safe-owned step execute on a fork at all. Combined with the previous point, a user who sets it on their `mainnet` chain config still does not get it, because the run reads 31337's config.

**The run takes its chain IDENTITY from the local bucket too, and that one is a bug rather than a wart.** `env.network.chain` is built from `chains[31337].info`, whose `id` is the id that was asked for, so a fork run's `env.network.chain.id` is 31337 whatever the node says. `execute` and `tx` both put that into the transaction's `chainId` field. Nobody has hit it because the only caller that can fork today is hardhat, whose node also reports 31337, but a fork run against anvil (which reports the forked chain's id) would sign transactions declaring 31337 to a node that believes it is chain 1. Recorded in `work/notes/observations/a-fork-run-builds-transactions-declaring-chain-31337.md`.

**And `chains[31337]` is where the user configures their LOCALHOST dev node**, so all of it, including `tags`, silently becomes the configuration of a fork-of-mainnet run. Deploy scripts branch on tags, so a script that takes a shortcut under a `local` tag takes it during what the user believes is a mainnet rehearsal. That is worse than the missing-mainnet-settings half: it is not an absence, it is a different configuration actively applied.

**The chain-identity check behaves differently depending on which node you run.** Verified rather than assumed, and one belief was wrong: the mismatch is a `console.warn`, not a throw, and the provider's id then wins. anvil forking mainnet reports chain id 1 (its own banner says so), so nothing is warned. hardhat reports 31337, because `resolveEdrNetwork` defaults `chainId` to 31337 and the forking config never feeds it, so the warning fires AND the run proceeds with 31337. That id reaches `env.network.chain.id`, which is what `execute` puts in the transaction's `chainId`, so this is not only a log line.

Beyond the three, everything downstream in the unsignable-signer line of work needs a predicate meaning "this is a fork of X": the dry run that discovers pending privileged work, and the transaction capture that is its output, both branch on it. There is nothing to branch on today.

## Solution

**`fork` stops being a fact about how the environment was spelled and becomes a description of what is being simulated.** A run is either not a fork, or it is a fork of a named network whose chain id is known. Everything that should differ on a fork is then derived from that one fact rather than guessed at each site.

**Two axes that must stay separate**, and keeping them separate is the whole design:

- **Where we CONNECT** stays the local side. The provider still comes from the local chain config, because that is what makes a fork run talk to the fork rather than to production. Nothing about this changes.
- **What we are SIMULATING** is the forked network, and that is where deployment semantics, policy and tags come from.

Stating the existing TODO as a **split** rather than a swap is the point: "resolve the chain config from the forked network" would break the thing that currently works.

**`autoImpersonate` defaults on for a fork**, since impersonation is what makes the unsignable steps executable, and a fork is where rehearsing them is the entire purpose. It remains an explicit switch, so anyone testing the deferral path on a fork turns it off, exactly as the unknown-signer scenarios already do.

**The chain-identity check learns what a fork is.** When the run knows it is a fork of mainnet, a provider reporting 1 is a match and a provider reporting 31337 is a fork engine's local id rather than a contradiction. Neither should read as a misconfiguration, and the id the run then uses should be a decision rather than whatever `||` reached first.

## User Stories

1. As a deployer, I want `env.network.fork` to tell me WHICH network is being forked, so that a script or a tool can branch on "this is a fork of mainnet" rather than on "the environment was not a string".
2. As a deployer on a plain in-memory run, I do NOT want to be told I am on a fork, so that the flag means something.
3. As a deployer rehearsing on a fork of mainnet, I want the deployment semantics and policy of MAINNET (deterministic deployment, unknown-signer policy, confirmations, mining, tags), so that the rehearsal predicts the real run.
4. As that same deployer, I want the CONNECTION to keep coming from the local node's config, so that a fork run talks to my fork and never to production.
5. As a deployer rehearsing Safe-owned steps on a fork, I want impersonation on by default, so that the privileged steps actually execute and I see the whole run.
6. As a deployer testing the deferral path on a fork, I want to turn impersonation off for the run, so that the unsignable path is exercised deliberately.
7. As a deployer running against a forked anvil, which reports the forked chain's id, I do not want to be warned that my provider disagrees with my config, because it does not.
8. As a deployer running against a forked hardhat node, which reports 31337, I do not want that to look like a misconfiguration either, and I want to know which chain id my transactions will carry.
9. As a maintainer, I want one place that decides what differs on a fork, so that the next fork-dependent default is a line there rather than a fourth site that half-knows.
10. As a maintainer building fork-based discovery later, I want a predicate that means "a fork of network X" plus the forked network's chain id, so that capture and the dry run have something honest to branch on.
11. As a hardhat-deploy user, I want all of this without changing anything I do, since `HARDHAT_FORK` already tells rocketh which network is forked.
12. As a maintainer, I want the fork descriptor shaped so that a future in-process fork engine can be told WHERE to fork from and AT WHICH BLOCK without re-cutting the concept.
13. As a deployer with a configured `localhost` dev chain, I do NOT want those settings, and above all not those TAGS, applied to a fork of mainnet, because my deploy scripts branch on tags and I did not ask for the local branch during a mainnet rehearsal.
14. As a deployer forking mainnet with anvil, which reports chain id 1, I want the transactions rocketh builds to declare chain 1, so that a locally signed transaction is not rejected by the node it was built for.
15. As a deployer, I want to say WHERE my fork node is listening without having to configure a chain I am not using, so that pointing at a second fork on another port is not a lie about chain 31337.

## Autonomy notes

`humanOnly: true`: this changes the meaning of a published core field (`env.network.fork`) and two run defaults derived from it, which is public semantics we then keep. A human drives the tasking.

No `needsAnswers`. Two things were resolved before launch rather than carried as questions. The config shape for a fork's own overrides (a `fork` sub-key on the network's entry, rather than a conventional `"<network>:fork"` environment key) was decided with the maintainer, and it is a core type change, so it is agreed rather than assumed. And the one empirical unknown, whether the chain-identity check tolerates a fork under each tool, was resolved by running both rather than by reasoning: anvil reports the forked chain's id, hardhat reports 31337, and the check warns rather than throwing. Recorded as a correction in `work/notes/observations/what-fork-actually-does-today.md`, which also corrects that note's claim that it throws.

## Implementation Decisions

- **The fork descriptor names the network AND carries its chain id.** A name alone forces every consumer to re-resolve it, and the chain id is what the semantics lookup needs. Whatever `env.network.fork` becomes, `if (env.network.fork)` must keep reading naturally, and the in-memory case must be falsy.
- **The chain-config lookup SPLITS in two**, and this is the change everything else hangs off: a CONNECTION lookup (local, keyed 31337 as today) and a SEMANTICS lookup (keyed by the forked network's chain id when there is one, otherwise the same id as the connection). `deterministicDeployment`, `onUnknownSigner`, `autoImpersonate`, `confirmationsRequired`, `autoMine` and the tags move to the semantics side. The provider stays on the connection side. The existing TODO is deleted by this, not edited.
- **`autoImpersonate` resolves params > chain config > fork-aware default.** The default is on when the run is a fork and off otherwise. The precedence order is unchanged; only the last term stops being `undefined`.
- **The chain-identity comparison becomes fork-aware.** For a fork, both the forked network's id and the local engine's id are legitimate answers from the provider, and neither is a misconfiguration. Which id the RUN then uses must be chosen deliberately rather than falling out of `chainIdFromProvider || chainId`, since it reaches `env.network.chain.id` and therefore the `chainId` field of every transaction `execute` builds. Whatever is chosen, a fork run under anvil and under hardhat should not silently build transactions carrying different chain ids.
- **The descriptor must be able to grow a CREATION half, without being given one now.** Today rocketh ATTACHES to a fork somebody else started (anvil or hardhat), so the block to fork from is not rocketh's to choose: it was fixed when that node started, and pretending to configure it would be a lie. When an in-process engine lands, rocketh CREATES the fork and needs exactly what EDR's `ForkConfig` takes: `url`, `blockNumber`, `cacheDir`, `httpHeaders`. The url needs no new configuration, because the forked network's rpcUrl is already in the user's chain config, which is the same config this spec is teaching the run to read. So the growth is a `blockNumber` and a mode, and the descriptor should not foreclose it. Nothing in this spec builds it.
- **Inheritance is the DEFAULT, overrides are the exception.** A fork of mainnet takes its configuration from mainnet and states only what genuinely differs, which is the local endpoint and plausibly impersonation and tags.
- **A fork's own overrides live in a `fork` sub-key on the forked network's OWN environment entry** (decided; it is a core type change and was agreed rather than assumed):

  ```ts
  environments: {
  	mainnet: {chain: 1, fork: {rpcUrl: 'http://localhost:8545', autoImpersonate: true}},
  }
  ```

  The layering is then `chains[<forked id>]` under `environments[<name>].overrides` under `environments[<name>].fork`, most specific last, and the fork layer applies ONLY when the run is a fork. The shape wants no new vocabulary: `overrides` is already `Omit<ChainUserConfig, 'info'>`, which is exactly the bag a fork needs (rpcUrl, tags, autoImpersonate, deterministic deployment), so `fork` is a second override layer that is conditional rather than a new kind of thing. It grows the EDR creation fields later (a block number, a cache dir), which is why it is a bag rather than a bare url.

  The alternative considered and rejected was a conventional environment key, `"<network>:fork"`. It costs no new type, which is a real advantage, but it invites two mistakes that the sub-key cannot express: it reads as a NAME, and the obvious implementation makes it one, at which point the fork reads and writes a `mainnet:fork/` deployments folder and loses the only thing forking is for (a colon is also reserved on Windows, and the name reaches `path.join`); and a conventional key can collide with a user's own environment naming. Same reasoning that replaced `pushUnknownSignerPolicy`/`popUnknownSignerPolicy` with one scoping verb: prefer making the mistake unrepresentable over documenting the pairing.

- **Declaring `fork` does NOT put a run into fork mode.** A run is a fork because of how it was invoked, and the key only supplies the overrides when that happens. Presence of configuration must never be a mode switch, or a user who describes their fork once finds every subsequent run forked.
- **Half of that layering already works, which makes this smaller than it looks.** `resolveExecutionParams` already merges `config.environments[environmentName].overrides` over the chain config, and on a fork run `environmentName` is the FORKED network's name, so `environments.mainnet.overrides` already applies to a fork of mainnet today. What is wrong is the layer underneath it: the chain config being merged is `chains[31337]` rather than `chains[1]`. The work is to slide the right bucket under a merge that already happens, not to invent a merge.
- **The CONNECTION stops being borrowed from `chains[31337]`.** The local endpoint is a property of the FORK RUN, not of a chain the user is not using, and today the two are the same bucket. A fork should be able to say where its node is listening (defaulting to the same `http://127.0.0.1:8545` it effectively defaults to now, which is where anvil and `hardhat node` both listen) without the user having to configure chain 31337, and without a `localhost` chain config leaking its tags and policy into a mainnet rehearsal. Note that `DeploymentEnvironmentConfig.overrides` already exists and already accepts an `rpcUrl`, so the vocabulary for this is present.
- **The run's chain IDENTITY is the forked network's**, not the local bucket's. `env.network.chain.id` reaching the `chainId` field of every transaction is what makes this load-bearing rather than cosmetic (see the observation note). A fork engine's own id, where it differs, is a fact about the connection and belongs on the connection side.
- **What `{fork: X}` fundamentally means, stated once so the implementation can stop re-deriving it:** be the `X` environment for the purposes of deployment RECORDS, while not being `X` for the purposes of chain identity. Everything else the flag currently does to a run is incidental. The evidence is that an ordinary environment with `{chain: 1, overrides: {rpcUrl: 'http://localhost:8545'}}` already reproduces every other property of a fork run today, and the only thing it cannot do is read mainnet's deployment records.
- **No new CLI surface.** `-e <network>` plus the existing fork input is all the information required. The `--fork` flag itself is a separate, later piece of work.

## Testing Decisions

- The predicate itself, which is the cheapest and most valuable test: an in-memory run is NOT a fork, a fork of mainnet IS one and says so, and a plain named-network run is not.
- Semantics come from the forked network while the provider comes from the local config, asserted together in one test, since the bug being fixed is exactly that the two were the same lookup.
- `autoImpersonate` on by default for a fork, off for a non-fork, and an explicit `false` still wins on a fork (the deferral-rehearsal story).
- The identity check under both shapes: a provider reporting the forked network's id, and a provider reporting the local engine's id. Neither warns, and the chain id the run adopts is asserted, not incidental. The existing test harness can report either id, so both are cheap.
- A hardhat-deploy shaped run keeps working unchanged, since that is the one caller that constructs a fork today.
- The transaction a fork run BUILDS declares the forked network's chain id. Assert it on the transaction, not on `env.network.chain`, since the field is what a node rejects.
- A `chains[31337]` config carrying tags and a policy does NOT leak into a fork run of another network. This is the assertion that would have caught the localhost-bucket conflation, and it is cheap: configure both buckets differently and assert which one the run adopted.
- Prior art: `packages/rocketh/test/` for executor-level tests that build a real environment against a mock provider, and the unknown-signer scenarios for how a fork-shaped run is set up.

## Out of Scope

- **Moving "a fork does not save" into core.** Same family, deliberately deferred: it is not a live bug, because the only caller that can fork guards it itself, and it bites only the standalone `--fork` path that does not exist yet. It is Track B in `work/notes/ideas/fork-based-discovery-of-pending-privileged-work.md`. A builder who finds themselves changing `saveDeployments` defaults here has left this spec.
- **A `--fork` flag on the rocketh CLI.** Track B, for rocketh users who are not on hardhat. Note for whoever builds it: the connection URL for a fork run already comes from the local 31337 chain config, whose default is viem's hardhat chain, `http://127.0.0.1:8545`, which is where anvil and `hardhat node` both listen. That is why the flag needs no argument, and it should be documented rather than left as a coincidence.
- **Transaction capture and the dry run** it feeds. Track A item 3, and the reason this spec exists first.
- **An in-process fork engine (EDR).** Later, and it cannot live in core: it is a native binary and core stays browser-capable (ADR 0002), so it belongs in an optional Node-side package (ADR 0005). This spec only avoids foreclosing it.
- **Faking signatures on a fork** by overriding the `ecrecover` precompile, which is an in-process-engine capability and is parked in the fork-based-discovery idea with two open questions against it.

## Further Notes

The four gaps this spec closes were found by one investigation, `work/notes/observations/what-fork-actually-does-today.md`, and its own conclusion is the argument for doing them together: they are four answers to a single question, "what should differ when this is a real fork", and the flag's meaning is the one that unlocks the rest. That note also now carries a correction of its own claim that the identity check throws, which is worth reading before trusting any other sentence built on it.
