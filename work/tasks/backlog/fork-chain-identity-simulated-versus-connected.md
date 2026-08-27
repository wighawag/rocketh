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

**The bug.** The chain info that becomes `env.network.chain` is currently built from the LOCAL chain bucket, and the info carries the id it was asked for; the provider is never consulted. Both `execute` and `tx` hex-encode `env.network.chain.id` into the transaction. So every fork run declares chain 31337 no matter what the node believes. It has never failed because the only caller that can fork today is hardhat, whose simulated network also reports 31337. It is a trap for the `--fork` path, whose whole purpose is attaching to anvil.

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
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md` for the model, and `work/notes/observations/a-fork-run-builds-transactions-declaring-chain-31337.md`, which traces the bug through all five links from the chain-config lookup to the transaction field. Verify that chain yourself before changing it; the note cites file and line for each step.
>
> The rule to hold onto: **transactions follow the node, configuration follows the forked network.** A chain id in a signed transaction is not metadata, it is part of what was signed, so the only correct value is the one the node will accept. Everything else about a fork run points at the network being simulated.
>
> The measured facts behind the leniency, so you do not have to re-derive them: anvil forking mainnet reports chain id 1 (verified live against its banner and `eth_chainId`), while hardhat reports 31337 (`resolveEdrNetwork` defaults `chainId` to 31337 and the forking config never feeds it). Both are normal. A fork is exactly the situation where the configured chain and the provider's chain legitimately disagree, which is why the warning must not fire there, and only there.
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
