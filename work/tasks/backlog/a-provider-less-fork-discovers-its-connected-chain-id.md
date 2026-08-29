---
title: 'A fork run with no provider asks the node it attaches to which chain it is, instead of throwing'
slug: a-provider-less-fork-discovers-its-connected-chain-id
blockedBy: []
covers: []
---

## What to build

The missing half of the fork story on the path that has no provider, and the prerequisite for a CLI flag that is worth having.

`getChainIdForEnvironment` runs BEFORE `resolveExecutionParams`, and it only ever asks a node when the CALLER supplied a provider. hardhat-deploy always does; `@rocketh/node` never does, because core builds the provider later from the resolved endpoint. So a provider-less fork run has exactly one source for the chain id, `environments[<name>].chain`, and with nothing declared it throws `Could not find chainId for environment named "mainnet" (no provider)` before it ever dials anything. Verified, and recorded in `work/notes/observations/a-provider-less-fork-run-cannot-resolve-its-chain-id.md`.

**On a fork, and only on a fork, the node can simply be asked.** The asymmetry is the whole reason this is possible, so state it in the code: a fork's endpoint is known WITHOUT the chain id, because it is `environments[<name>].whenForked.rpcUrl` else the conventional local endpoint. Off a fork the endpoint comes from `chains[<id>]`, which needs the id first, so there the question is genuinely circular and nothing here may change. This is fork-only, by necessity rather than by preference.

**The endpoint must be resolved in ONE place.** `resolveExecutionParams` already works out where a fork connects, and if discovery computes that endpoint independently the two can drift and the run would ask one node and then talk to another. Extract the fork-endpoint resolution into a single function both call. Today the answer is `whenForked.rpcUrl` else `CONVENTIONAL_LOCAL_RPC_URL`, because `chains[<id>].rpcUrl` and `overrides.rpcUrl` are both deliberately withheld from a fork's connection (ADR 0014 and its endpoint refinement) — confirm that is still true rather than assuming it.

**The precedence, which is the crux and is easy to get backwards.** When a node answers, its id WINS over `environments[<name>].chain`, exactly as it already does when a provider was supplied. It is tempting to dial only when nothing is declared, treating the declared value as the cheaper answer, and that is the wrong instinct: the docs tell a hardhat user to declare `chain: 1` so the SIMULATED network's settings are found, so the declared id is routinely the simulated one. Preferring it would put 1 into the `chainId` of every transaction built against a hardhat node reporting 31337, and the node would reject them. That is precisely the bug `fork-chain-identity-simulated-versus-connected` closed, and this is the path it would come back on. The declared id keeps its real job, which is naming the SIMULATED chain through `resolveForkDescriptor`; do not touch that.

**Decide what happens when the node cannot be reached, and say why in your report.** Falling back to the declared id is the dangerous option for the reason above, since it silently produces a run that signs for the wrong chain. The alternative is to fail with an error naming the endpoint that was tried, on the grounds that a fork run which cannot reach its node cannot do anything useful anyway. Whatever you choose, the message must name the endpoint, because "connection refused" without an address is the least actionable error there is.

**This makes an existing documentation claim true rather than requiring it to be corrected.** `documentation/fork-runs/index.md` says an environment entry carrying nothing but `whenForked` is valid, and that a fork of a network anvil reports honestly needs no declaration. Both are currently true of core's layering and FALSE on the provider-less path. Landing this makes them true everywhere, so add the test that pins it rather than editing the prose.

## Acceptance criteria

- [ ] A fork run with NO provider and NOTHING declared resolves its chain id by asking the node, instead of throwing
- [ ] The zero-configuration path works end to end: a fork of a network against a node reporting that network's own id (the anvil shape) resolves that network's settings with no `environments` entry at all
- [ ] An environment entry carrying only `whenForked` and no `chain` is valid on a provider-less fork run, which is what the documentation already promises
- [ ] The node's answer WINS over `environments[<name>].chain` on a fork, tested with a declared id that DIFFERS from the node's, since preferring the declared one is the regression this task must not cause
- [ ] The fork descriptor still takes its SIMULATED chain id from the supplied or declared value, unchanged, so the two identities stay separate
- [ ] Discovery dials the SAME endpoint the run then connects to, including when `whenForked.rpcUrl` names a non-conventional port. Tested, because a drift between the two would be invisible until it pointed at the wrong node
- [ ] Discovery is scoped to forks: a provider-less NON-fork run behaves exactly as it does today, including the existing error when nothing is declared. Tested, since the circularity means it cannot work there
- [ ] A run whose node cannot be reached fails with a message naming the endpoint it tried
- [ ] A run that DOES supply a provider is unaffected, tested
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

Nothing.

## Prompt

> Goal: let a fork run that nobody handed a provider find out which chain it is talking to, so pointing rocketh at an anvil fork needs no configuration.
>
> FIRST, check this task against current reality (it is a snapshot and may have DRIFTED). Confirm that `getChainIdForEnvironment` still dials only when `executionParams.provider` was supplied, and confirm how `resolveExecutionParams` currently arrives at a fork's endpoint before you extract it.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`, especially the two chain identities and the endpoint refinement, and `work/notes/observations/a-provider-less-fork-run-cannot-resolve-its-chain-id.md`, which is the measured statement of the problem.
>
> The two identities are the thing to keep straight. The value you are resolving here is the CONNECTED chain, the one every transaction declares and a node rejects a mismatch on. The SIMULATED chain is what the run is a fork OF, it comes from the fork input or the declared entry, and it drives the configuration lookup. This task changes only the first and must leave the second exactly as it is.
>
> Do not make this a general capability. Off a fork, resolving an endpoint requires the chain id, so asking the node first is circular; the guard is not a stylistic choice and should read as a necessity in the code.
>
> Done means: `anvil --fork-url <mainnet> &&  rocketh -e mainnet --is-fork` will need no configuration once the flag exists, and a hardhat-shaped fork still signs for the id its own engine reports.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: what you did when the node was unreachable and why, and where you put the shared endpoint resolution. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.
