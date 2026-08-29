---
title: 'Give rocketh users who are not on hardhat a way to say "the node I am pointing at is a fork": `--is-fork`'
slug: is-fork-flag-on-the-cli
blockedBy: [a-fork-does-not-save-unless-asked, a-provider-less-fork-discovers-its-connected-chain-id]
covers: []
---

## What to build

The last piece of the fork feature, and the only one that is audience expansion rather than a correction.

Everything a fork run needs now exists in core: the descriptor names the simulated network, the configuration is inherited from it, transactions follow the node, impersonation defaults on, and `whenForked` says what differs. But the only way to REACH any of it is the hardhat plugin's `HARDHAT_FORK` variable or constructing the fork input programmatically. A rocketh user who is not on hardhat, running `anvil --fork-url ...`, cannot say so.

**The flag needs NO ARGUMENT.** `-e, --environment <value>` is already a required option naming the environment, and the environment name IS the forked network's name, so `-e mainnet --is-fork` carries everything. It maps directly onto the existing shape: `environment: options.isFork ? {fork: options.environment} : options.environment`.

**It is spelled `--is-fork`, and this is not a preference.** ADR 0014 has a whole section on it. `--fork` reads as an IMPERATIVE, and rocketh does not fork anything: it ATTACHES to a node somebody else forked. `--fork` is deliberately reserved for a future in-process engine that could honour the imperative, at which point it would need somewhere to fork FROM and a block to fork AT. Naming the attach flag `--fork` today would force the create flag to be named around it tomorrow. Do not "improve" this to `--fork`.

> CORRECTION (conductor, after a build agent rightly refused this task): the zero-configuration claim below was FALSE when first written, and is being made true by a prerequisite rather than by this task. `getChainIdForEnvironment` runs before `resolveExecutionParams` and only dials when the CALLER supplied a provider, which the CLI does not, so `-e mainnet --is-fork` with nothing declared used to throw `Could not find chainId for environment named "mainnet" (no provider)` before dialling anything. `a-provider-less-fork-discovers-its-connected-chain-id` makes a provider-less fork ask the node, so the criteria below hold as written. CONFIRM that landed before you build, and if it did not, stop rather than quietly requiring a declaration.

**The connection needs no new option, and adding one would be a mistake.** A fork with no `whenForked` layer dials the conventional local endpoint, which is where both anvil and `hardhat node` listen, and a fork that listens elsewhere says so with `whenForked: {rpcUrl}`. So the zero-configuration case is `anvil --fork-url ... &&  rocketh -e mainnet --is-fork` with nothing declared at all. Confirm that end to end rather than assuming it: this is the headline path and the one a reader will try first.

**Why this is blocked by the saving task rather than merely ordered after it.** This flag is the exact path the saving trap was laid for: a caller that constructs `{fork: ...}` and does not also pass `saveDeployments: false` writes into the real network's records. Until that rule lives in core, shipping this flag ships the corruption. Confirm the rule landed before you build.

**A shipped page says this does not exist, in two places.** `documentation/fork-runs/index.md` has a section "There is no `--is-fork` flag yet" and repeats it as a non-goal at the bottom; it also tells the reader to drive `@rocketh/node` programmatically instead. All of that must be replaced with how to actually use the flag, including the zero-configuration example. Leaving a page that denies the existence of the feature it documents would be the worst outcome of this task.

## Acceptance criteria

- [ ] `rocketh -e <network> --is-fork` runs as a fork OF that network: the environment reports the fork descriptor, and the deployment records of that network load although the node is not it
- [ ] The flag takes no argument, and without it the same command is NOT a fork, tested
- [ ] The flag is spelled `--is-fork`; `--fork` is not introduced as a name or an alias
- [ ] With nothing configured, the run dials the conventional local endpoint, so `anvil --fork-url ...` plus `-e mainnet --is-fork` works with no configuration at all
- [ ] A `whenForked: {rpcUrl}` layer still names a fork listening elsewhere, so the flag composes with the configuration that already exists
- [ ] The run does not write into the forked network's deployment folder, since the core rule landed first. Tested from the CLI path specifically, because that is the caller the rule was moved into core to protect
- [ ] `--help` describes the flag as an assertion about the node being attached to, not as an instruction to create a fork
- [ ] `documentation/fork-runs/index.md` documents the flag, and both places that currently say it does not exist are gone
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `a-fork-does-not-save-unless-asked`: this flag is the precise path the saving trap was laid for, so the rule must live in core before a second caller can construct a fork input. Shipping the flag first ships the corruption.

## Prompt

> Goal: let someone running anvil against a mainnet fork rehearse their deployment with rocketh, without hardhat and without writing a script.
>
> FIRST, check this task against current reality (it is a snapshot and may have DRIFTED). Confirm the saving rule landed in core, and confirm the CLI still builds its execution params by spreading `options` in `packages/rocketh-node/src/cli.ts`, since that spread is what decides whether a new option needs threading by hand.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`, in particular its naming section, which is why the flag is `--is-fork` and why `--fork` is reserved.
>
> Where to look. The CLI is `packages/rocketh-node/src/cli.ts`; the fork input shape is `ForkInput` in the core types; the descriptor is built in `getEnvironmentName` / `resolveForkDescriptor`. You are adding an option and mapping it onto an input shape that already exists, not adding a mode.
>
> Watch the spread. The CLI passes `...(options as ExecutionParams)` and then fixes up individual fields AFTER it, precisely because commander's raw values are not always what core should receive. `environment` is one that must be transformed rather than passed through, since core expects either a string or a `ForkInput`.
>
> Done means: someone with anvil, a mainnet fork and a Safe-governed upgrade script can rehearse it from the command line with no configuration file changes, and the documentation page tells them how instead of telling them it is impossible.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: how you transformed `environment` relative to the spread, and anything you found in the CLI that made the obvious mapping wrong. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.

## Decisions

- **`environment` is transformed AFTER the spread, and the ordering is pinned by a test rather than by a comment alone.** The CLI does `...(options as ExecutionParams)` and then fixes up individual fields; commander's `environment` is _always_ a string, so a fork input built before the spread is silently overwritten and the run is quietly not a fork. I put the transform next to the existing `onUnknownSigner` fixup, with the same reasoning in the comment, and added a test that asserts `{...options}.environment` is the raw string while the built params carry the `ForkInput`. The alternative (normalise the options bag before spreading) would have made the two fixups live in different places for no gain. _Touches_: nothing else; `--save-deployments`, `--reset` and `--on-unknown-signer` keep their current handling.
- **The CLI's option surface moved into `packages/rocketh-node/src/cli-options.ts`, verbatim, so the flags can be parsed by a test.** `cli.ts` is a bin script that executes a deployment on import, so its flags were reachable by no test at all: "the flag takes no argument", "`--fork` is not an alias" and the `--help` wording are acceptance criteria that can only be checked by parsing argv. `cli.ts` still owns everything with side effects (log level, `resolveOnUnknownSigner`, the executor call). The alternative was spawning the built CLI as a subprocess per case, which is slower, needs a project on disk, and still cannot inspect the option list. _Touches_: every other CLI flag moved with it (no behaviour change, verified by `--help` output and the live runs); `resolveOnUnknownSigner` deliberately did NOT move, since it calls `process.exit` and is another task's surface.
- **No `chainId` is inferred for the fork input, deliberately.** `@rocketh/node` does hold a name-to-chain map, but it is keyed by viem's kebab-cased chain name (mainnet's key is `ethereum`), so matching it against an environment name would be a coincidence dressed as a mechanism (ADR 0014 says so explicitly). The CLI therefore emits the bare `{fork: <name>}` and lets the run ask the node. _Touches_: the chain-id discovery path landed by `a-provider-less-fork-discovers-its-connected-chain-id`, which is what makes the zero-configuration case work; the hardhat-node caveat (declare `environments[<name>].chain`) stays the documented remedy.
- **`--save-deployments` stays the only way to turn saving on for a fork; I did not add `--no-save-deployments`.** The flag is set-only, and once the fork default is off that is exactly the right shape (ADR 0014's saving refinement says as much). Documented on both the docs page and the README instead of adding a flag. _Touches_: a hypothetical future negative flag, and the `--fork` name, which stays reserved.
- **The `@rocketh/node` README was updated too, although the criterion named only `documentation/fork-runs/index.md`.** That README carries the CLI's option table, so shipping a flag absent from it would leave a second page quietly denying the feature, which is the exact failure the criterion exists to prevent. _Touches_: the `@rocketh/node` package docs; covered by the same changeset.
