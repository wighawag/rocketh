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

**Half the layering already works**, which makes this smaller than it sounds: the environment-level override layer already runs on fork runs, because the environment name IS the forked network's name. What is wrong is only the chain bucket underneath it. You are sliding the right bucket under a merge that already happens, not inventing a merge.

The existing TODO comment about resolving the fork's chain id is answered by this task and should be deleted, not edited.

## Acceptance criteria

- [ ] On a fork, deployment semantics and policy come from the FORKED network's chain configuration
- [ ] On a fork, the connection still comes from the local side, so a fork run talks to the local node and never to the forked network's public endpoint
- [ ] Environment TAGS on a fork come from the forked network, not from the local chain bucket
- [ ] The discriminating test exists: configure the local chain bucket and the forked network's bucket DIFFERENTLY, run a fork, and assert which one the run adopted. Without this, an implementation that changed nothing would pass
- [ ] A non-fork run is completely unaffected, tested
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
