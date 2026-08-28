---
title: 'A fork states only what differs, in a whenForked sub-key on the forked network own entry'
slug: fork-config-sub-key-on-the-environment
spec: fork-of-a-named-network
blockedBy: [fork-aware-autoimpersonate-default]
covers: [15]
---

## What to build

Somewhere for a fork's own configuration to live, now that everything else is inherited from the network being forked.

A fork of mainnet should be configured like mainnet and state only what genuinely differs. In practice that is the local endpoint above all, and plausibly impersonation and a tag or two. Today there is nowhere to put that, so the local endpoint is taken from the chain bucket of a chain the user is not running, which is also where they configure their local dev node.

**The shape, decided with the maintainer** (it is a core type change, so it was agreed rather than assumed):

```ts
environments: {
	mainnet: {chain: 1, whenForked: {rpcUrl: 'http://localhost:8545', autoImpersonate: true}},
}
```

A `whenForked` sub-key on the forked network's OWN environment entry. The name is a CONDITION, not an imperative, and that is deliberate: a key called `fork` reads as a command, which invites exactly the mode-switch misreading this task has to warn against two paragraphs down. A conditional name makes that misreading unavailable rather than merely discouraged. The layering becomes the forked network's chain config, then that environment's existing overrides, then this fork layer, most specific last, and the fork layer applies ONLY when the run is a fork.

It needs no new vocabulary: the existing environment `overrides` field is already the right bag (an endpoint, tags, impersonation, deterministic-deployment settings), so `whenForked` is a second override layer that happens to be conditional rather than a new kind of thing. Keep it a bag rather than a bare url, because an in-process fork engine will later add creation options (a block to fork from, a cache directory) and they belong here.

**Two things that are easy to get wrong:**

- **Declaring `whenForked` does NOT put a run into fork mode.** A run is a fork because of how it was invoked. If the presence of configuration were the switch, a user who described their fork once would find every later run forked.
- **The default endpoint stays what it effectively is today**, the local node's conventional address, which is where both anvil and a hardhat node listen. Someone with a fork on the usual port should still need no configuration at all.

The rejected alternative, recorded so it is not re-proposed: a conventional environment key such as `"<network>:fork"`. It costs no new type, which is a real advantage, but the environment NAME is a directory name for deployment records, so that convention invites an implementation where a fork reads and writes its own folder and forfeits the only thing forking is for.

## Acceptance criteria

- [ ] A fork run picks up the `whenForked` layer from the forked network's environment entry
- [ ] Declaring the entry is CHEAP: an environment entry that exists only to carry `whenForked` is valid, since nothing in this repo declares an `environments` section today and this is the first reason to
- [ ] The layering order holds and is tested: the forked network's chain config, then that environment's overrides, then the fork layer, most specific winning
- [ ] The `whenForked` layer is IGNORED on a non-fork run of the same environment, tested, so configuration presence is not a mode switch
- [ ] With no `whenForked` layer configured, a fork still connects to the conventional local endpoint, so the zero-configuration case is unchanged
- [ ] The local endpoint no longer comes from the chain bucket of the local chain, so a user's dev-node configuration cannot leak into a fork of another network
- [ ] The core type change is additive: every existing configuration still type-checks and behaves identically
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `fork-aware-autoimpersonate-default`: this is the last of the chain that edits the same resolution path, and the layering it adds sits on top of the split and the identity work done by the three tasks before it.

## Prompt

> Goal: give a fork somewhere to say what makes it different from the network it forks, without borrowing a chain the user is not running.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the configuration split landed, since this layer sits on top of it.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`, which records this decision and the alternative it beat, and why.
>
> Where to look. The environment entry type lives in the core types next to the chain configuration types; the merge that composes a chain config with an environment's overrides is in the executor's execution-params resolution, and you are adding a third, conditional layer to a merge that already has two.
>
> The core type is public and every user's configuration is typed against it, so the change must be strictly additive: an optional field, no existing configuration invalidated, no behaviour changed for anyone who does not write it.
>
> Watch the mode-switch trap. It is tempting to treat the presence of a `whenForked` key as "this environment can be forked" or worse "fork this run", because it reads that way. It must not do either: a run is a fork because of how it was invoked, and this key only supplies the overrides once that has happened. Test the negative case, a non-fork run of an environment that HAS a `whenForked` key, and assert nothing from the key applied.
>
> Keep the zero-configuration path working. Someone running anvil on the conventional port with no fork configuration at all must still just work, exactly as they effectively do today.
>
> Done means: a fork can name its own endpoint, that endpoint is not a lie about another chain, the layering is tested in order, and configuring a fork does not fork anything by itself.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: the exact field type you gave the fork bag, and how you treated a fork key on an environment that is never forked. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.

## Decisions

- _The fork bag's type is `Omit<ChainUserConfig, 'info'>`, identical to the existing `overrides`._ It is a second override layer that happens to be conditional, not a new kind of thing, so it needs no new vocabulary and every field a user can already override (endpoint, tags, impersonation, deterministic deployment, polling, properties, confirmations, policy) is available to a fork on day one, including the creation options an in-process fork engine would later add. `info` stays excluded for the same reason `overrides` excludes it: a fork does not get to redefine the connected chain's identity metadata. Alternatives considered: a bare `rpcUrl` string (rejected by the task itself, it forecloses the creation half), or a new purpose-built type (rejected: it would fork the vocabulary and make `overrides` and `whenForked` two things that must be kept in sync). Touches: nothing outside `DeploymentEnvironmentConfig`, but it is the shape the `document-fork-runs` task will document and the shape a future `--is-fork` CLI path will read.
- _A fork key on an environment that is never forked is completely inert, by construction rather than by discipline._ `whenForked` is dereferenced only inside `const whenForkedOverrides = fork ? environmentConfig?.whenForked : undefined`, so on a non-fork run the value is never read at all: no warning, no validation, no "this environment is forkable" state. I deliberately did NOT add a notice for a declared-but-unused fork layer, because a notice would re-introduce the mode-switch reading the name exists to prevent (it would imply the key means something to a non-fork run) and would fire on every ordinary `-e mainnet` run of a correctly configured project. It is pinned by two tests, one on the resolved values and one asserting the run is still not a fork. Touches: the mode-switch contract in ADR 0014, and the future `--is-fork` flag, which stays the _only_ way to enter fork mode.
- _`environments[<name>].chain` is now OPTIONAL._ The criterion "an environment entry that exists only to carry `whenForked` is valid" cannot hold while `chain` is required. It is a widening, so no existing configuration is invalidated, and only `getChainIdForEnvironment` and `resolveForkDescriptor` read the field, both already `?.`-guarded and both already handling the absent case (the id then comes from the provider, or the run fails with `Could not find chainId for environment named ...`). Alternative considered: keep `chain` required and let the fork example always carry it, which is one line for the user but makes the cheapest possible declaration impossible and is what the acceptance criterion rules out. Touches: ADR 0010 (_environments stay explicit_) in spirit only, since such an entry is still explicitly written by the user and nothing is auto-populated; and it means an entry without `chain` silently skips the declared-versus-reported chain-identity check, exactly as an undeclared environment already does.
- _A fork run's endpoint no longer comes from `chains[31337]`, and the conventional local address became a stated constant._ This is the one behaviour change for a user who writes no `whenForked`: someone whose dev-node bucket names a non-default port and who then forks will now dial `http://127.0.0.1:8545` unless they say otherwise in `whenForked`. It is required by the acceptance criteria ("the local endpoint no longer comes from the chain bucket of the local chain"), and the zero-configuration case is unchanged because the previous default reached the same address by coincidence, through viem's `hardhat` entry that `@rocketh/node` merges into `chains[31337]`. The only caller that can fork today (hardhat-deploy) always passes a live `provider`, which still wins over any url, so no shipping user path changes. The constant is named `CONVENTIONAL_LOCAL_RPC_URL` rather than anything containing `fork`: per CONTEXT.md and ADR 0014 the bare word is ambiguous across three parts of speech, and a `FORK_RPC_URL` would read as the url to fork _from_, which is precisely what it is not. Touches: the future `--is-fork` CLI flag (which needs no url argument for exactly this reason) and the `document-fork-runs` task.
- _The layering was kept uniform rather than special-casing the endpoint out of the `overrides` layer._ `overrides.rpcUrl` therefore still wins over the conventional local endpoint on a fork run, which for a real network's environment entry is that network's real endpoint. I did not change it, because the layering order is what this task's criteria state and because the preceding task deliberately decided `overrides` applies to both sides of the split; `whenForked` gives the user a way to win over it. The residual hazard is latent (it needs a fork run with no supplied provider, i.e. the `--is-fork` path that does not exist yet) and is captured in `work/notes/observations/a-fork-run-still-dials-the-environment-overrides-rpc-url.md` rather than fixed here.
