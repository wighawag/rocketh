---
title: 'Split the chain-config lookup: connection from the local node, semantics from the forked network'
slug: fork-semantics-come-from-the-forked-network
spec: fork-of-a-named-network
blockedBy: [fork-descriptor-names-the-network]
covers: [3, 4, 9, 13]
---

## What to build

The correction the whole spec is named for, and it is a SPLIT rather than a swap.

One lookup currently answers two unrelated questions for a fork run, by sending both to the local chain bucket. Half of that is right and is easy to delete by accident: that bucket is what supplies the PROVIDER, so pointing it at the local chain is exactly what makes a fork run talk to the fork instead of to production. The other half is wrong: the same bucket also supplies the deployment semantics and the policy, so a user who configures the network they are forking does not get their own configuration, and a user who configures their local dev node gets THAT applied to a fork of mainnet instead.

So: **connection from the local side, semantics from the forked network.** Deployment semantics and policy means the deterministic-deployment settings, the unknown-signer policy, auto-impersonation, the confirmation count, auto-mining and the environment TAGS. The provider stays where it is.

Tags deserve naming separately, because they are the sharpest edge and the least obvious. Deploy scripts branch on tags. A user whose local chain config carries a `local` tag is currently having that tag applied during what they believe is a mainnet rehearsal, so a script that takes a shortcut under `local` takes it. That is not missing configuration, it is different configuration actively applied.

**The lookup key is the descriptor's chain id when it has one, and the id the run already computed otherwise.** That second case is not a degradation, it is what makes zero configuration work: the computed id IS the provider's, a non-fork run already resolves its settings that way, and **anvil forking mainnet reports 1**, so `chains[1]` is found with nothing declared at all. Only hardhat breaks the coincidence by reporting 31337 while simulating mainnet, and there the fallback lands on exactly today's behaviour rather than on anything worse. So no notice, no degraded mode, no new state: one expression with a fallback.

**The split is THREE-way, not two, and this is the part that will bite if it is not stated.** The one chain-config object feeds three consumers: the PROVIDER, the POLICY and tags, and the chain INFO that becomes `env.network.chain`. Only the middle one moves in this task. The info stays with the CONNECTED side, because `env.network.chain.id` is what `execute` and `tx` put in the transaction's `chainId` field, and a transaction has to declare an id the node will accept. Move it here by accident and a user who declared their forked network's chain id, then ran against a hardhat node reporting 31337, would have their locally signed transactions rejected, with no test covering the combination. Making the identity deliberate is the NEXT task; this one must simply not disturb it.

**Half the layering already works**, which makes this smaller than it sounds: the environment-level override layer already runs on fork runs, because the environment name IS the forked network's name. What is wrong is only the chain bucket underneath it. You are sliding the right bucket under a merge that already happens, not inventing a merge.

The existing TODO comment about resolving the fork's chain id is answered by this task and should be deleted, not edited.

## Acceptance criteria

- [ ] On a fork, deployment semantics and policy come from the FORKED network's chain configuration
- [ ] On a fork, the connection still comes from the local side, so a fork run talks to the local node and never to the forked network's public endpoint
- [ ] Environment TAGS on a fork come from the forked network, not from the local chain bucket
- [ ] The discriminating test exists: configure the local chain bucket and the forked network's bucket DIFFERENTLY, run a fork, and assert which one the run adopted. Without this, an implementation that changed nothing would pass
- [ ] A non-fork run is completely unaffected, tested
- [ ] `env.network.chain` is UNCHANGED by this task, so the transactions a fork run builds declare exactly what they declare today. Tested with a declared simulated chain id that DIFFERS from the provider's, which is the combination that would otherwise break
- [ ] With NOTHING declared, a fork against a node reporting the forked chain's id resolves that network's settings, since this is the zero-configuration path and the one most users are on
- [ ] With nothing declared, a fork against a node reporting a local engine id behaves exactly as it does today, with no notice and no new state
- [ ] The environment-level override layer still applies on top, so a user's existing overrides keep winning
- [ ] The stale TODO about fork chain-id resolution is gone
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `fork-descriptor-names-the-network`: the lookup needs to know WHICH network is forked, which is what that task makes knowable. It also edits the same resolution function, so the ordering serialises the edits.

## Prompt

> Goal: stop a fork run from taking its deployment semantics and policy from the local dev node's configuration, without breaking the reason it points at the local node in the first place.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the fork descriptor landed with a network name and chain id available at the resolution site.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`, in particular the paragraph on why the lookup splits rather than swaps, and `work/notes/observations/what-fork-actually-does-today.md` section 2, which is where the distinction was first drawn.
>
> The trap, stated plainly because an earlier draft of the investigation fell into it: "resolve the chain config from the forked network" is the WRONG fix. The chain config supplies the provider. Send the whole lookup to the forked network and a fork run connects to production mainnet. The connection must keep coming from the local side; only the semantics move.
>
> Where to look. One function in the executor resolves the execution params: it computes the id to fetch, reads the chain config, merges the environment-level overrides over it, and returns the tags, the provider and the policy. Everything this task touches is in that neighbourhood. Read how the merge is composed before changing it, because the environment-override layer already does the right thing and you are changing what sits UNDER it.
>
> Vocabulary: the SIMULATED chain is the forked network (its config is what you now want), the CONNECTED chain is the local node (its endpoint is what you must keep). ADR 0014 pins those terms; use them in the code so the next reader does not have to re-derive the distinction.
>
> Write the discriminating test first if you can. Configure the local bucket with one set of tags and policy, the forked network's bucket with another, run a fork, and assert which arrived. A test that only checks "a fork run has tags" passes both before and after this change and is worth nothing.
>
> Done means: a fork of mainnet is configured like mainnet, connects to the local node, and a local chain config no longer leaks its tags or policy into it.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, in particular what happens when the forked network has NO chain config at all. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.

## Decisions

_Where exactly the semantics/connection line falls, field by field._ I moved to the SIMULATED bucket precisely the six the task enumerates: `deterministicDeployment`, `onUnknownSigner`, `autoImpersonate`, `confirmationsRequired`, `autoMine` and `tags`. Everything else stays on the CONNECTED bucket, deliberately and not by omission: `info` (the three-way split, pinned by a test with a declared simulated id of 1 against a node reporting 31337), the provider/`rpcUrl`, `pollingInterval` (it describes how often we poll the node we are attached to) and `deleteDeploymentsIfDifferentGenesisHash` (it defaults from the id's membership in the resettable dev-chain set, which is a fact about the engine we are connected to, and a fork already skips the identity check at load time via `context.fork`). The alternative was to send `deleteDeploymentsIfDifferentGenesisHash` with the semantics, which flips a fork of mainnet from `true` to `false`; I rejected it because it is a records-deletion default, is outside the task's stated definition of "deployment semantics and policy", and has no test covering the fork combination. This touches `fork-chain-identity-simulated-versus-connected`, which owns `env.network.chain` next.

_A forked network with NO chain config gets the BUILT-IN defaults, silently._ `chains[<simulated id>]` missing now yields empty tags, the default create2/create3 info, `autoImpersonate: false`, `autoMine: false`, no `confirmationsRequired`, and `onUnknownSigner` left undefined so the existing `'auto'` default still resolves in `resolveExecutionParams`. It does NOT fall back to the local bucket, which is the whole point: an absence is strictly better than a _different_ configuration actively applied. It emits no notice, because an undescribed simulated network is not a misconfiguration and the task calls for no new state on the fallback path.

_That is why the simulated lookup uses a NEW silent function rather than `getChainConfigFromUserConfig`._ Reusing the existing one was the obvious implementation and I rejected it for two concrete reasons: it `console.warn`s `has no public info` about an `info` the semantics side never reads (a new, misleading notice on the common zero-config fork), and it THROWS `has no rpc url provided nor any provider to use` when the simulated chain has neither, which would be a brand-new refusal for a run that works today (no `provider` in the execution params, local `rpcUrl` declared, forked network undeclared). `getChainSemanticsFromUserConfig` is total and quiet; `getChainConfigFromUserConfig` keeps its warn/throw because it must produce an `info` and a way to reach a node.

_The new concept `ChainSemantics` is a Pick of `ChainConfig`, not a new config key or user-visible term._ Coherence check: it introduces no new spelling for users (no config key, no flag, no status), it reuses the ADR 0014 / `CONTEXT.md` simulated-vs-connected vocabulary rather than forking a synonym, and it names the half of an existing concept that the ADR already says splits. I kept it OUT of `rocketh`'s root export (unlike `getChainConfigFromUserConfig`) so the public surface does not grow for an internal seam; `packages/rocketh/test/chains.test.ts` already imports from the module path directly if it ever needs pinning.

_The environment-override bag is layered over BOTH buckets, not just one._ `environments[<name>].overrides` is an `Omit<ChainUserConfig, 'info'>`, so it carries connection fields (`rpcUrl`, `properties`) and semantic ones (`tags`, `onUnknownSigner`, …) in one bag. Rather than split the bag, I apply it over the connected config (as today, preserving rpc/properties behaviour) and over the simulated semantics, so a user's overrides keep winning on every field they could already override. Alternative considered: partition the override bag by side, which would have made an existing `overrides.tags` stop applying on a non-fork run for no benefit. The `whenForked` sub-key that ADR 0014 layers ON TOP of this belongs to `fork-config-sub-key-on-the-environment` and is untouched here.
