---
title: 'Impersonation defaults ON for a fork, and an explicit false still wins'
slug: fork-aware-autoimpersonate-default
spec: fork-of-a-named-network
blockedBy: [fork-chain-identity-simulated-versus-connected]
covers: [5, 6]
needsAnswers: true
---

## What to build

The smallest change in this spec, and the one a user notices first.

Auto-impersonation currently resolves as run params, then chain config, then nothing, so it is OFF unless somebody sets it. Impersonation is the mechanism that makes an account rocketh cannot sign for executable on a node that supports it, which means it is the only reason a Safe-owned step runs at all during a fork rehearsal. A fork with impersonation off stops at the first privileged call, which is the opposite of what someone forking mainnet wants to see.

So the last term stops being nothing and becomes fork-aware: on when the run is a fork, off otherwise. The precedence order does not change.

**The explicit `false` must still win**, and this is not a detail: turning impersonation off for a run is the supported way to exercise the unknown-signer deferral path on a fork, which is exactly how the existing unknown-signer scenarios build a Safe. If a fork forced impersonation on, that whole test suite's setup would stop being expressible.

Note also that this interacts with the configuration split from an earlier task in this chain: a user who sets impersonation on the network they are forking now actually gets it, because the run reads that network's configuration rather than the local node's.

> READ FIRST, planted by the conductor after the two tasks before this one landed. The last term is NOT currently reachable by simply appending one, and this is the whole difficulty of the task. `getChainSemanticsFromUserConfig` (`packages/rocketh/src/environment/chains.ts`) returns `autoImpersonate: chainConfig?.autoImpersonate || false`, so the value is ALWAYS defined, `false` when nobody configured it. The resolution in `resolveExecutionParams` then reads `if (autoImpersonate === undefined && actualChainSemantics.autoImpersonate !== undefined)`, which therefore always fires and always wins. A fork-aware term added after it would be DEAD CODE, and a test that only exercises a fork with no `chains` entry at all could still pass while a user with a `chains[1]` entry that simply does not mention impersonation silently gets `false`. So the real work is making "nobody configured it" distinguishable from "configured false" along that path, without disturbing the semantics split. Verify this in the code before designing around it.

## Acceptance criteria

- [ ] A fork run has auto-impersonation ON without anyone configuring it
- [ ] A non-fork run is unchanged: still off unless configured
- [ ] An explicit `false` at the run level wins on a fork, so the deferral path stays exercisable there
- [ ] A value set on the FORKED network's chain configuration is honoured, which it is not today
- [ ] Precedence is tested with discriminating cases, not merely present ones: each test must be able to fail if the order regresses
- [ ] The unknown-signer scenarios that build an unsignable Safe on a fork-shaped environment still pass unchanged
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `fork-chain-identity-simulated-versus-connected`: no logical dependency, but it edits the same resolution function as the three tasks before it, so the ordering serialises those edits and keeps rebases trivial.

## Prompt

> Goal: make a fork rehearsal actually execute the privileged steps, by defaulting impersonation on where it makes sense, without taking away the switch that turns it off.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the fork descriptor and the configuration split landed, since the default depends on knowing the run is a fork and the chain-config term now reads the forked network.
>
> READ FIRST: `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`, which is the constraint that matters here, and `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md` for why a fork is where impersonation belongs.
>
> The invariant you must not blur, and it has already been lost once in this repo's history: `autoImpersonate` is a NODE CAPABILITY switch resolved BEFORE the unknown-signer seam, while `onUnknownSigner` is the POLICY afterwards. Defaulting the capability on for forks does not give the policy a new value, does not make a wrapped `catchUnknownSigner` call impersonate, and must not touch the seam at all. If you find yourself editing the seam, stop.
>
> Why `false` must keep winning: `autoImpersonate: false` is the supported way to test the throw-and-defer path on a fork or dev node, and the existing `@rocketh/unknown-signer` scenarios are built on exactly that (a named account declared as a bare address, with impersonation off, IS the Safe in those tests). A fork that forced impersonation on would make that setup inexpressible and would quietly gut that suite.
>
> Where to look. The resolution is a short chain of fallbacks in the executor's execution-params resolution, a few lines below where the chain config is read. Only the final fallback changes.
>
> Done means: forking gets you a run where the Safe-owned steps execute, a non-fork is untouched, and anyone who wants the deferral path on a fork can still ask for it.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.
