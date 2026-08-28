---
title: 'A fork has two chain identities: transactions follow the node, configuration follows the forked network'
slug: fork-chain-identity-simulated-versus-connected
spec: fork-of-a-named-network
blockedBy: [fork-semantics-come-from-the-forked-network]
covers: [7, 8, 14]
---

## What to build

Separate the two chain identities a fork run has, and fix the live bug produced by conflating them.

- The **simulated** chain is the network being forked. It drives the configuration lookup, the deployment records and the semantics. The sibling task before this one already moved configuration onto it.
- The **connected** chain is whatever the node actually reports. It drives the `chainId` field of every transaction rocketh builds, and it is what the chain-identity check has to be lenient about.

**The bug this closes, and what the previous task already did to it.** Historically the chain info that becomes `env.network.chain` was built from the LOCAL chain bucket, carrying the id it was asked for, with the provider never consulted; both `execute` and `tx` hex-encode `env.network.chain.id` into the transaction, so every fork run declared chain 31337 whatever the node believed. It never failed, because the only caller able to fork was hardhat, whose simulated network also reports 31337. It was a trap for the `--is-fork` path, whose whole purpose is attaching to anvil.

The previous task deliberately left the info on the CONNECTED side rather than moving it with the policy, so by the time you start, a fork's identity already follows the node in the common case. **Confirm that before assuming either the old bug or the new behaviour** (it is the first thing your drift check should establish). What is left for this task is to make it deliberate rather than incidental, to pin it with tests including the case where a declared simulated id DIFFERS from the provider's, and to make the identity warning fork-aware.

**Why the connected chain must win for transactions**, and this is the part that is easy to get backwards: a transaction's chain id is consensus-level. For a locally signed transaction, which is what the private-key signer protocol produces, the id is committed to in the signature and the node rejects a mismatch. Adopting the SIMULATED id for transactions would therefore break every hardhat-deploy user today, because hardhat reports 31337 while the simulated network is mainnet.

**The identity check becomes fork-aware.** For a fork, both answers from a provider are legitimate: anvil forking mainnet reports the forked chain's id, hardhat reports its own 31337. Measured, not assumed, and recorded in the observation note. Neither should read as a misconfiguration, so neither should produce the mismatch warning on a fork. Note the check WARNS rather than throwing, and the run then adopts whichever id reached first; make that adoption a decision rather than an accident.

## Acceptance criteria

- [ ] A fork run builds transactions declaring the chain id the NODE reports, tested against a provider reporting the forked network's id AND one reporting a local engine id
- [ ] Assert this on the transaction that is broadcast, not on `env.network.chain`, since the transaction field is what a node would reject
- [ ] Configuration, deployment records and semantics still follow the SIMULATED network, so the previous task's behaviour is unchanged
- [ ] No chain-identity warning is emitted on a fork under either provider shape
- [ ] A NON-fork run still warns on a genuine mismatch, so the leniency is scoped to forks and nothing else was loosened
- [ ] The id the run adopts is deliberate and documented at the choice site
- [ ] A hardhat-deploy shaped run (provider reporting a local engine id while simulating a named network) behaves exactly as it does today
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `fork-semantics-come-from-the-forked-network`: the simulated side must already be the source of configuration before the connected side can be separated from it, and both edit the same resolution path.

## Prompt

> Goal: let a fork run be honest about both chains it is involved with, and stop it signing transactions for a chain the node does not think it is.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the descriptor and the configuration split landed as the two previous tasks describe.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md` for the model, and `work/notes/observations/a-fork-run-builds-transactions-declaring-chain-31337.md`, which traces the bug through all five links from the chain-config lookup to the transaction field. Verify that chain yourself before changing it: the note cites line numbers that will have moved, so follow the symbols rather than the numbers.
>
> The rule to hold onto: **transactions follow the node, configuration follows the forked network.** A chain id in a signed transaction is not metadata, it is part of what was signed, so the only correct value is the one the node will accept. Everything else about a fork run points at the network being simulated.
>
> The measured facts behind the leniency, so you do not have to re-derive them, are recorded with their provenance in `work/notes/findings/fork-node-chain-identity-behaviour.md`: anvil forking mainnet reports chain id 1, while hardhat reports 31337. Both are normal. A fork is exactly the situation where the configured chain and the provider's chain legitimately disagree, which is why the warning must not fire there, and only there.
>
> Where to look. Two neighbouring places in the executor: the function that resolves the chain id for an environment (which holds the comparison, the warning and the `||` that picks a winner), and the function that resolves the execution params (which builds the chain info that becomes `env.network.chain`). The consumers of the id are the transaction builders in the read-execute package.
>
> Be careful about the blast radius of `env.network.chain`. It is public, it reaches deployment records and it is what user scripts read. Changing which id it carries is a user-visible decision, so make it deliberately and record it, rather than letting it fall out of whichever value happened to be truthy.
>
> Done means: a fork against a node reporting the forked chain's id and a fork against a node reporting its own local id both build transactions that node would accept, neither warns, and a genuine mismatch off a fork still warns.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, especially which id `env.network.chain.id` ends up carrying and why, since that field is public and reaches deployment records. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.

## Requeue 2026-08-28

The previous job's runner process died silently BEFORE the done-move, the gate and the integration, so none of them ran. Your prior work is preserved on this branch: the fork-aware identity check and adoption in getChainIdForEnvironment, chainInfo.id following the connected id in resolveExecutionParams, packages/rocketh/test/fork-chain-identity.test.ts, packages/rocketh-read-execute/test/fork-chain-identity.integration.test.ts and a changeset. CONTINUE from it, do not restart. Two things to check specifically. First, the changeset currently declares only 'rocketh': the diff also adds a test file under packages/rocketh-read-execute, so confirm 'pnpm changeset status --since=main' passes once everything is COMMITTED and add any missing package entry if it does not. Second, re-confirm the acceptance criteria hold, in particular that a hardhat-shaped run (provider reporting 31337 while simulating a named network) is byte-for-byte unchanged.
