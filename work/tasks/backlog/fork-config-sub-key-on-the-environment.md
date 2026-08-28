---
title: 'A fork states only what differs, in a whenForked sub-key on the forked network own entry'
slug: fork-config-sub-key-on-the-environment
spec: fork-of-a-named-network
blockedBy: [fork-aware-autoimpersonate-default]
covers: [15]
needsAnswers: true
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
