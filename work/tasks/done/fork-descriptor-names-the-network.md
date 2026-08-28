---
title: 'Make the fork flag say WHICH network is forked, instead of "the environment was not a string"'
slug: fork-descriptor-names-the-network
spec: fork-of-a-named-network
blockedBy: []
covers: [1, 2, 10, 11, 12]
---

## What to build

The enabling change for everything else in this spec: `fork` stops being a fact about how the environment was spelled and becomes a description of what is being simulated.

Today the flag is derived from the environment argument not being a string. The environment argument is optional, so an ordinary in-memory run is flagged as a fork, and a fork of mainnet carries the same bare `true` as a memory run. Nothing can branch on "this is a fork of mainnet" because that is not what the flag says.

**After this task**, the run either is not a fork, or is a fork of a NAMED network, and where the forked network's chain id can be determined it is readable too.

**The descriptor asserts only what it KNOWS about the chain id.** Core cannot turn a network name into a chain id: the name-to-id map is built on viem's chain list and lives in `@rocketh/node`, which depends on `rocketh`, while `rocketh` has no viem dependency. So the id has two honest sources, in order: supplied by whoever constructed the fork input, else declared as the forked network's environment entry. When neither exists, the descriptor names the network and carries NO chain id, rather than borrowing the one the run computed from the provider. Under hardhat that number is the local engine's 31337, and calling it the simulated chain would be a lie told to every later consumer, since the dry run and the transaction capture both branch on this field. The sibling task that moves the semantics lookup has its own fallback and does not need the descriptor to invent one. `if (env.network.fork)` must still read naturally, and a non-fork must be falsy, because that is how the existing consumers are written.

**The one existing behaviour that must not regress**, and it is the whole reason the flag exists: `context.fork` is consulted when LOADING deployments, to skip the chainId and genesis-hash identity check. That is what lets a fork of mainnet read mainnet's deployment records even though the node is not mainnet. Find that site, understand it, and keep it working.

**The caller that can already fork must not change.** hardhat-deploy constructs the fork input from its own environment variable and passes it in; it should keep doing exactly that and get the new descriptor for free. Prove it with a test rather than by reading.

**Shape it so a creation half can be added later.** rocketh currently ATTACHES to a fork somebody else started, so nothing here describes where to fork from or at which block. When an in-process engine lands, it will CREATE forks and need those. Do not build it; do not foreclose it either.

## Acceptance criteria

- [ ] A run given a fork input reports WHICH network is forked through the environment
- [ ] The forked network's chain id is carried WHEN it is known, from a caller-supplied id first and the declared environment entry second
- [ ] When neither source exists, the descriptor still names the network and simply has no chain id: it does not fabricate one, and does not borrow the provider's
- [ ] A run with no environment (the in-memory default) is NOT a fork
- [ ] A run given a plain named environment is NOT a fork
- [ ] The existing truthiness reading (`if (env.network.fork)`) still works for every current consumer
- [ ] Deployment loading still skips the chain-identity check on a fork, so a fork of a network still reads that network's records. Tested, because this is the property the whole feature exists for
- [ ] The hardhat-deploy path is unchanged: same input, same behaviour, no plugin edit required. Tested
- [ ] The public core type change is made at BOTH sites that carry the flag today, and they agree
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- None, can start immediately.

## Prompt

> Goal: make `env.network.fork` answer "a fork of what?" instead of "was the environment argument a string?".
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, the relevant ADRs and anything since landed in `work/tasks/done/`? If an assumption here is stale, route to needs-attention rather than building on it.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`, which is the governing decision, and `work/notes/observations/what-fork-actually-does-today.md`, which is the investigation behind it and cites every claim to a file and a line. Note that the note carries a CORRECTION at the bottom: it originally claimed the chain-identity check throws, and it does not, it warns. Read the correction before trusting the body.
>
> The single most important sentence in that ADR for this task: what `{fork: X}` fundamentally means is "be `X` for deployment RECORDS while not being `X` for chain identity". That is why the flag is consulted at a load-time site to skip an identity check, and why breaking that site would remove the only thing forking is for.
>
> Where to look. The flag is derived in the executor's environment-name resolution, threaded through the resolved execution params into the environment's `context`, and surfaced on `env.network`. It is carried in two places in the core types. There is exactly one behavioural consumer today, at deployment load time, plus the public field. Grep before you assume that list is complete.
>
> Domain vocabulary, from `CONTEXT.md` and the ADR: the SIMULATED chain is the network being forked, the CONNECTED chain is whatever the node reports. This task is about naming the simulated one. A later sibling task splits the identity properly; do not try to fix the transaction chain id here, and do not change where the chain CONFIG is read from either, which is its own sibling task.
>
> Keep the falsy-when-absent property. Every current reader is a truthiness test, and quietly turning the field into something always-truthy would silently make every run behave like a fork, including the in-memory one that is wrongly flagged today.
>
> Done means: the environment says which network is forked and its chain id, an in-memory run is not a fork, records still load on a fork, and hardhat-deploy needed no edit.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: the descriptor's shape and field names above all, since four sibling tasks consume them. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks. The runner transcribes the block verbatim into the done record, `pnpm format:check` covers `work/` and is the FIRST link of the acceptance gate, and prettier normalises asterisk emphasis, which reds the gate after an otherwise green build.

## Decisions

_The descriptor's shape and field names_ (four sibling tasks consume them). `ForkDescriptor = {networkName: string; chainId?: number}`, surfaced unchanged at `env.network.fork` and `ResolvedExecutionParams.environment.fork`. I chose `networkName` over `network` because at the path `env.network.fork.network` the word `network` already denotes an OBJECT one level up, and re-meaning it as a string there is exactly the kind of muddle `CONTEXT.md` warns about; `networkName` also says it is a NAME (the environment key under which records live). I kept `chainId` rather than `simulatedChainId`: the descriptor's whole subject is the simulated side, so the container qualifies it (`fork.chainId` reads "the forked network's chain id"), and the JSDoc pins it against `env.network.chain.id`, which stays the CONNECTED chain. Alternatives considered: `{name, chainId}` (rejected: `fork.name` reads as a name OF the fork) and a bare `{network, chainId}`. Sibling consumers get `fork.chainId` as the lookup key (`fork-semantics-come-from-the-forked-network`) and `environments[fork.networkName]` as the config entry (`fork-config-sub-key-on-the-environment`).

_The caller-supplied chain id is a sibling key on the fork input, not a nested object._ `ExecutionParams.environment` becomes `string | ForkInput` where `ForkInput = {fork: string; chainId?: number}`. Flat and additive, so hardhat-deploy's `string | {fork: string}` still type-checks and behaves identically with no edit. The alternative, `{fork: {network, chainId}}`, would have been a breaking change to the one shipped caller for no gain. The bag is where a future creation half (a block to fork from, a url) goes, per ADR 0014.

_A new exported function, `resolveForkDescriptor(config, executionParams)`._ The two id sources need the config, and `getEnvironmentName` does not take one, so I put the precedence in ONE named place rather than inline in `resolveExecutionParams` where the sibling tasks would have to re-find it. It is exported from `rocketh`'s root next to `getEnvironmentName`, which is a small public-surface addition. `getEnvironmentName` still returns a descriptor, but one that knows only what the INPUT carried; the JSDoc on both says which is which.

_A run with no environment stops taking its chain config from 31337._ This is the mechanical consequence of "the in-memory default is not a fork", and it is user-visible beyond the flag: `idToFetch = fork ? 31337 : chainId` now sends a no-environment run to the id its PROVIDER reports, so `env.network.chain.id`, the tags/policy bucket and the `deleteDeploymentsIfDifferentGenesisHash` default follow the connected node rather than being forced to 31337, and such a run now has the load-time identity check applied. In practice every such run is against a local node reporting 31337, so nothing in the repo or the getting-started flow moves. I chose this over special-casing `memory` back to 31337, which would have re-introduced the "not a named network" heuristic under a new name and contradicted ADR 0014. It touches ground the `fork-semantics-come-from-the-forked-network` and `fork-chain-identity-simulated-versus-connected` tasks will revisit, so it is named here rather than discovered there.

_The descriptor asserts no chain id when neither source said so._ Following the ADR and ADR 0012's instinct, `resolveForkDescriptor` deliberately does not fall back to the run's computed id, and the test pins that a fork of mainnet on a hardhat-shaped node (reporting 31337) reports `networkName: 'mainnet'` with `chainId` absent. The semantics lookup may use the computed id as its own fallback; the descriptor may not claim it.
