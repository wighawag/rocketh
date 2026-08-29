---
title: 'The CLI `--tags` value never reaches core as a list, so the tag filter matches on CHARACTERS'
slug: cli-tags-reaches-core-as-a-list
blockedBy: []
covers: []
---

## What to build

`rocketh --tags <value>` does not work, and has not. It is documented as "comma separated list of tags to execute", it is typed `string[]` on the other side, and nothing between the two ever splits it.

**Reproduced, not inferred.** `packages/rocketh-node/src/cli.ts` hands commander's options to core with `...(options as ExecutionParams)` and fixes up individual fields afterwards; `tags` is not among them, and nothing in `@rocketh/node`'s executor splits it either. So `--tags Token` arrives as the STRING `'Token'`. Running the real `resolveExecutionParams` with `{tags: 'Token'}` returns `tags` still the string, `tags.length > 0` is then true so the filter ENGAGES, and `for (const tagToFind of resolvedExecutionParams.tags)` (`packages/rocketh/src/executor/index.ts`, the script-selection loop) iterates `['T','o','k','e','n']`.

**Two failure modes, and the second is the one that makes this more than an annoyance:**

- A script tagged `Token` is NOT selected by `--tags Token`. The run selects nothing and exits having done nothing, which reads as "no scripts matched" rather than as a bug.
- A script whose tag is a SINGLE CHARACTER _is_ selected by any value containing that character. Verified: `--tags cat` selects a script tagged `a`. So this can also run something the user did not ask for, which is the worse direction and is invisible.

**hardhat-deploy is unaffected and shows the intended shape**: `packages/hardhat-deploy/src/tasks/deploy.ts` splits with `tags?.split(',')`, and guards the empty string first (`args.tags && args.tags != '' ? args.tags : undefined`) so that `--tags ''` means "no filter" rather than a filter for the empty tag. Match that behaviour; splitting without the guard turns `''` into `['']`, which engages the filter and matches nothing.

Splitting on `,` is unambiguously right here: the option is documented as comma separated, and a script tag containing a comma is already refused by an explicit throw in the same selection loop.

**The root cause is the CAST, and it has already produced this bug twice before.** `options as ExecutionParams` tells the compiler to stop checking, which is exactly why a `string` reaching a `string[]` field type-checks. Two other options needed hand-written fixes after the spread for the same reason (`onUnknownSigner`, then `environment` for `--is-fork`), each found by someone noticing rather than by the compiler. `--tags` is the one nobody noticed. So fix the instance, and then close the class: replace the blanket cast with an explicit, TYPED mapping from parsed options to `ExecutionParams`, so that the next option whose CLI shape differs from its core shape is a build error rather than a silent misbehaviour.

**Expect that mapping to surface other mismatches, and treat that as the point rather than as scope creep.** If removing the cast reveals another option that never reached core correctly, report it. Fix it if it is the same one-line shape as this one; if it is bigger, capture it as an observation and leave it, rather than growing this task.

**Check whether the flag ever worked** before writing the changeset, so the entry is honest about whether this is a regression or has always been broken: `git log -p` on the CLI around the option's introduction will say. Do not assert either way without looking.

## Acceptance criteria

- [ ] `--tags Token` selects a script tagged `Token`, tested through the same path the CLI uses rather than by calling core with an array
- [ ] `--tags a,b` selects scripts tagged `a` or `b`
- [ ] A single-character tag is no longer spuriously selected: a script tagged `a` is NOT selected by `--tags cat`. This is the discriminating one, since a fix that only splits could still pass a naive test while a character-iterating one would fail here
- [ ] `--tags ''` (and an omitted flag) means NO filter, so every script runs, rather than a filter matching nothing
- [ ] The blanket `as ExecutionParams` cast is gone, replaced by a typed mapping, so a future option whose CLI shape differs from its core shape fails the build instead of misbehaving silently
- [ ] Any other mismatch the mapping reveals is either fixed (if trivially the same shape) or captured as an observation, and named in the final report either way
- [ ] The already-correct post-spread fixes (`onUnknownSigner`, `environment`/`--is-fork`) keep working, tested, since the mapping replaces the mechanism they rely on
- [ ] hardhat-deploy's tag handling is untouched, since it was already correct
- [ ] A changeset accompanies the change, stating honestly whether this was a regression or never worked
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

Nothing.

## Prompt

> Goal: make `rocketh --tags deploy` actually run the scripts tagged `deploy`, and make the next option of this kind impossible to get wrong silently.
>
> FIRST, check this task against current reality (it is a snapshot and may have DRIFTED). Confirm the CLI still spreads `options as ExecutionParams` with no `tags` fix-up, and confirm the selection loop still compares `tag === tagToFind` over `resolvedExecutionParams.tags`. The reproduction above was run against the built `packages/rocketh/dist`, so re-run it rather than trusting it.
>
> Where to look. `packages/rocketh-node/src/cli.ts` and its option surface in `packages/rocketh-node/src/cli-options.ts` (extracted so flags can be parsed by a test, which is where the test for this belongs); the selection loop is in `packages/rocketh/src/executor/index.ts`.
>
> Decide WHERE to fix, and say why. Splitting in the CLI matches hardhat-deploy and keeps core's contract (`tags: string[]`) honest. Coercing in core would also work and would protect every caller, but it makes `string[]` a lie and invites more of the same. Prefer the boundary fix plus the typed mapping that stops the boundary lying again; if you disagree after reading both sites, argue it in your report rather than doing both.
>
> Done means: the documented option does the documented thing, and the compiler now stands where a human had to notice three times.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: where you fixed it and why, what shape the typed mapping took, and anything else the removed cast revealed. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.

## Decisions

**Fixed at the CLI boundary, not in core.** `parseTags` splits in `@rocketh/node`, leaving `ExecutionParams.tags: string[]` honest. Alternative considered: coercing `string | string[]` in `resolveExecutionParams`, which would protect every caller but makes the declared `string[]` a lie and invites the next caller to pass a string too. It also puts a CLI-syntax concern (comma separation) in core, which knows nothing about command lines and already _refuses_ a tag containing a comma. Touches: nothing else, since core's contract is unchanged.

**The typed mapping is `toExecutionParams(options: RockethCLIOptions): ExecutionParams`, in `cli-options.ts`.** Two named types plus one total function, rather than per-field fix-ups after a spread. `RockethCLIOptions` declares what commander actually parses (`tags?: string`, flags `true`-or-absent, `environment` required) and `program.opts<RockethCLIOptions>()` is the single remaining assertion, made once and stated, instead of once per run and hidden. Because every field is written out, a CLI-shape-vs-core-shape mismatch is now a compile error. Two enforcements back it: a `@ts-expect-error` pinning that `tags: 'a,b'` must _not_ typecheck (`pnpm typecheck` covers `test/`, per `CONTEXT.md`), and a `Record<keyof RockethCLIOptions, true>` compared against the program's declared options, so declaring a flag without declaring its parsed shape goes red. Touches: `cli-is-fork-flag.test.ts`, which mirrored the old spread and now calls the mapping.

**`--scripts` / `--deployments` fixed rather than left as an observation.** The task's rule was "fix if trivially the same shape". It is: they belong in `ExecutionParams.config` (`ConfigOverrides`), and the sibling CLIs (`@rocketh/export`, `@rocketh/doc`, `@rocketh/verifier`) already route `--deployments` there, so the destination was not a judgement call. Alternative considered: encoding the drop explicitly in the mapping and filing an observation, rejected because it would have written the bug down as intent while the correct target sat one field away. Note this is user-visible: `rocketh -d somewhere` was ignored and now moves where deployments are read and written. `config` is always present with possibly-`undefined` entries; `resolveConfig` skips undefined, so an absent flag still overrides nothing. Touches: any caller relying on those flags being inert (none in this repo), and a pre-existing precedence subtlety I did _not_ change, that `environments[<name>].scripts` still wins over `config.scripts` inside `resolveExecutionParams`.

**Comma segments are not trimmed.** `--tags "a, b"` yields `['a', ' b']` and ` b` matches nothing. I matched hardhat-deploy exactly (guard `''` first, then `split(',')`) rather than adding a trim, because the task named that implementation as the intended shape and because silently editing a tag is another way for the flag to mean something other than what the user typed. Alternative considered: trim and drop empty segments, friendlier but a divergence from the reference behaviour and a second place where the flag's meaning is decided. Recorded because it is a user-visible choice, and it is cheap to reverse if someone prefers the friendlier reading.

**The `--on-unknown-signer` refusal moved from `process.exit` to a `throw`, caught in `cli.ts`.** Same message on stderr, same exit code 1 (checked against the built `dist/cli.js`), but the option surface is now callable from a test, which is what let the acceptance criterion "the already-correct fix-ups keep working, tested" be met. This is a relocation of an existing refusal, not a new one. Touches: `cli.ts` only, which is the one place allowed to talk to a terminal.
