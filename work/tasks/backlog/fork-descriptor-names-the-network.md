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

**The chain id is NOT always determinable, and this is the part a reviewer caught before it was built.** Core cannot turn a network name into a chain id: the name-to-id map is built on viem's chain list and lives in `@rocketh/node`, which depends on `rocketh`, while `rocketh` has no viem dependency. And nothing in this repo declares an `environments` config section at all, in any demo, template or documentation example, so the declared route is empty in practice. So resolve in this order: an id supplied by whoever constructed the fork input, else the forked network's declared environment entry, else UNKNOWN. Unknown is a supported state, not an error: the run is still a fork, records still load from that network's folder, and the sibling task that moves the semantics lookup degrades to today's behaviour. Say so once, clearly, rather than failing. `if (env.network.fork)` must still read naturally, and a non-fork must be falsy, because that is how the existing consumers are written.

**The one existing behaviour that must not regress**, and it is the whole reason the flag exists: `context.fork` is consulted when LOADING deployments, to skip the chainId and genesis-hash identity check. That is what lets a fork of mainnet read mainnet's deployment records even though the node is not mainnet. Find that site, understand it, and keep it working.

**The caller that can already fork must not change.** hardhat-deploy constructs the fork input from its own environment variable and passes it in; it should keep doing exactly that and get the new descriptor for free. Prove it with a test rather than by reading.

**Shape it so a creation half can be added later.** rocketh currently ATTACHES to a fork somebody else started, so nothing here describes where to fork from or at which block. When an in-process engine lands, it will CREATE forks and need those. Do not build it; do not foreclose it either.

## Acceptance criteria

- [ ] A run given a fork input reports WHICH network is forked through the environment
- [ ] The forked network's chain id is reported too WHEN it can be determined, from a caller-supplied id first and the declared environment entry second
- [ ] A fork of a network whose chain id cannot be determined still works: it is still a fork, records still load, and the unknown state is representable rather than an error or a fabricated id
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
