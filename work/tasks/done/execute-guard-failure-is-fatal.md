---
title: 'A guard that throws fails the run, and never falls through to executing the call'
slug: execute-guard-failure-is-fatal
spec: execute-state-guard
blockedBy: [execute-guard-storage-kind]
covers: [7]
---

## What to build

The asymmetry that makes the guard safe to rely on: a guard that cannot produce a verdict is FATAL, and is never treated as "not satisfied".

A guard whose read reverts, whose target is not deployed yet, whose slot cannot be read, or whose predicate itself throws, has told us nothing about whether the call is needed. Falling through to executing on that basis would reintroduce precisely the hazard the guard exists to remove: the operator is handed a privileged transaction they may already have executed, and for a mint, a transfer, an increment or a nonce-bearing governance action, executing it twice is a loss rather than a wasted round trip (ADR 0012). Failing loudly costs a re-run; failing open costs money.

So: the run aborts, the call is NOT executed, and the error says which guard failed, on which target, and what the underlying failure was. The underlying error must not be swallowed or reworded into something that hides it.

One behaviour to pin deliberately rather than discover later: the call kind goes through the existing read path, which RETRIES an empty return when the address is a known deployment before giving up. That retry is inherited on purpose, so a guard against a contract that is momentarily unreadable does not fail the run on the first attempt, but once the retries are exhausted the failure is fatal like any other. Test the end state, so a later change to the retry policy cannot silently turn a fatal guard into a fall-through.

## Acceptance criteria

- [ ] A guard whose read reverts aborts the run
- [ ] A guard whose read returns no data (the target is not a contract, or not deployed yet) aborts the run once the existing retry behaviour is exhausted
- [ ] A guard whose `satisfied` predicate throws aborts the run
- [ ] A storage guard whose slot read fails aborts the run
- [ ] In every one of the above, NO transaction is sent. Assert it from the recorded provider requests, not from the return value, since there is no return value on a throwing path
- [ ] The surfaced error identifies the guard's target and preserves the underlying failure rather than replacing it
- [ ] A test pins that a failing guard is not treated as unsatisfied, in a way that would go red if someone made it fall through
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `execute-guard-storage-kind`: this task covers both kinds, so both must exist, and it edits the same module as the three tasks before it, so the ordering serialises those edits.

## Prompt

> Goal: make a guard that cannot answer the question fail the run, loudly, instead of quietly answering "not satisfied" and executing a privileged call that may already have happened.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm both guard kinds landed and that the evaluator has one place where failures can be caught; if the earlier tasks already made failure fatal, verify the tests actually discriminate rather than building it twice, and route to needs-attention if there is nothing left to do.
>
> READ FIRST: `docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`, whose consequences section is the argument for this task. rocketh cannot know that an operator executed a deferred transaction out of band, so the chain-derived guard is the ONLY thing that makes a re-run converge. A guard that fails open removes that, and the failure mode is silent, because the run looks exactly like a run where the step is genuinely still needed.
>
> The asymmetry is deliberate and worth stating in a comment at the choice site: an error while evaluating is NOT evidence that the call is needed. Fail-loud costs a re-run and a fixed script; fail-open costs a duplicated governance action.
>
> Where to look. The guard module from the seam task, and the read path it delegates to, which already contains a retry loop for the empty-return case that resolves the address against known deployments. Understand that loop before you test around it: your fatal assertion must be about the END state after retries, not about the first attempt, or a later tuning of the retry policy will make your test lie.
>
> Test harness notes. The mock provider's default `eth_call` answers `0x`, which is the empty-return case, so the "not a contract" scenario is nearly free but also means an under-canned test can look like it is testing this when it is testing a missing mock. Be explicit. A reverting call is canned by throwing from the response function. The provider records every request, which is how you prove no transaction was sent on a throwing path.
>
> Done means: every way a guard can fail to produce a verdict aborts the run without executing the call, the error names the guard, and a test would catch a regression to fall-through behaviour.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, in particular the error type you raise and whether you wrap or rethrow the underlying failure. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks. The runner transcribes the block verbatim into the done record, `pnpm format:check` covers `work/` and is the FIRST link of the acceptance gate, and prettier normalises asterisk emphasis. `execute-guard-seam-and-call-kind` lost a whole cycle to exactly that: the build was green and the gate red before build, typecheck or test ever ran (`work/notes/observations/decisions-block-formatting-reds-the-gate-after-a-green-build.md`).

## Decisions

**The error type is a new `GuardEvaluationError`, on a `./errors` subpath.** A plain `Error` cannot be identified by a caller and carries no structured `target`, and the criterion asks the surfaced error to _identify_ the guard. It lives on `@rocketh/read-execute/errors` rather than the package root because `withEnvironment` calls every root export as `value(env)` and refuses a class by name, exactly the reasoning `@rocketh/unknown-signer` records for `UnknownSignerError`. Alternatives considered: reuse a plain `Error` (rejected, nothing to catch on); put it in `@rocketh/core` beside `UnknownSignerError` (rejected, the guard is a `read-execute` concept and core should not learn about it); export it from the root (rejected, breaks the documented extension-spread idiom). What it touches: a new `./errors` entry in `packages/rocketh-read-execute/package.json`, the README, and any later `document-execute-state-guard` or collector work that renders a guard failure. Its _type_ (`GuardEvaluationErrorData`) is re-exported from the root, since types erase and cost the spread nothing.

**Foreign failures are WRAPPED, not rethrown; our own are rethrown untouched.** A bare `AbiDecodingZeroDataError`, or a node's `method eth_getStorageAt is not available`, does not say which of a script's guards asked or which contract it read, and those are the two facts needed to fix the script. So the underlying error is kept whole on `cause` _and_ quoted in the message (`the guard on slot 0x36… of 0xee… could not be evaluated, so nothing was executed: <underlying>`), which is how "preserves the underlying failure rather than replacing it" is satisfied on both channels. Alternatives considered: rethrow unchanged (rejected, loses the guard's identity, which is the criterion); replace the message with a guard-specific one (rejected, loses the actionable cause); attach the guard to the original error object by mutation (rejected, mutating someone else's error is worse than a `cause` chain). An error that is _already_ a `GuardEvaluationError` is rethrown as is, so the message never says the same thing twice.

**The guard module's own declaration throws became `GuardEvaluationError` too** (no target, no verdict, an `output` the ABI does not declare). They are declaration mistakes rather than chain failures, but the consequence has to be identical, and one error type means a caller writing `instanceof` covers every way a guard fails to answer. Side effect worth naming: a call guard's "states no verdict" and "selects the output" messages now also carry ` of <target>`, which they did not before; the existing tests' `/no target/i` and `/bool/i` assertions still match, since the underlying wording is preserved. This touches the three earlier `execute-guard-*` tasks' error strings and nothing else.

**No new ADR.** ADR 0013's consequences already state "a guard that reverts or otherwise throws is FATAL, never _not satisfied_"; this task implements that decision rather than making a new one, so the rationale went to the choice site and to `errors.ts` instead of to `docs/adr/`.
