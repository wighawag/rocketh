---
title: 'Re-ask for a pasted transaction hash that is not found, pre-filling the previous answer'
slug: re-ask-a-not-found-pasted-hash-with-the-previous-value
blockedBy: []
covers: []
---

## What to build

Today, when a user pastes a transaction hash into the interactive unknown-signer prompt and this node has never heard of that hash, the run FAILS: `waitForPastedTransaction` polls `eth_getTransactionByHash` for a bounded number of rounds and then throws, printing the transaction that still needs executing. Everything the user typed is gone, and the whole deploy run has to be started again to get back to the same prompt.

Change that terminal failure into a RE-ASK. When the lookup gives up, ask the same question again with the hash the user previously typed PRE-FILLED, so the common causes (a truncated paste, a character dropped by a terminal, the right hash before the RPC caught up) cost an edit rather than a re-run. The user can correct it, press enter on the unchanged value to wait again, or take the existing exits (empty / `cannot sign` / Ctrl-C) to defer.

The bound must not disappear. The point of the current bound is that a run cannot hang for ever on a hash no node will ever know about, and that property has to survive: put a limit on how many times the not-found question is re-asked, after which the run defers (or fails) exactly as it does now. Deciding that limit, and whether exhausting it defers or fails, is part of this task.

This needs a way to pre-fill a text prompt, which the prompt abstraction does not currently have. `PromptExecutor.promptText` takes `{type, name, message}`; something like an optional `initial` has to reach the `prompts` library's own initial-value support in the Node runtime, and be honoured (or ignored, harmlessly) by the other implementations of the abstraction: the browser adapter, which supplies no text ability at all, and the test double in `@rocketh/test-utils`. Widening that request type is a `@rocketh/core` public-type change, so it needs a changeset and deliberate wording.

Watch the interaction with the OTHER re-ask that already exists. A paste that is not a well-formed hash is already re-asked, up to a fixed number of attempts, and that path is not the same as this one: malformed-input is a syntax failure, not-found is a lookup failure, and they can now both re-ask with different budgets. Decide explicitly whether they share one attempt budget or keep separate ones, and record the decision — two independent counters that can each reset is the kind of thing that turns into an unbounded loop by accident.

## Acceptance criteria

- [ ] A pasted hash that this node does not know about, after the existing lookup rounds, RE-ASKS with the previously typed value pre-filled, instead of failing the run.
- [ ] Pressing enter on the unchanged pre-filled value retries the lookup for that same hash.
- [ ] Correcting the value and submitting it looks up the corrected hash and, when found, resolves the run normally (a real receipt, no transaction sent).
- [ ] The existing exits still work from the re-asked prompt: an empty answer, `cannot sign`, and an aborted prompt all defer, producing the same `UnknownSignerError` as before.
- [ ] The re-ask is BOUNDED. A user who never supplies a findable hash reaches a terminal outcome in finite time, and a test proves the run terminates without depending on a wall clock.
- [ ] The interaction with the existing malformed-input re-ask is decided and recorded: whether the budgets are shared or separate, and why. A test pins that alternating between malformed and not-found answers cannot loop for ever.
- [ ] Pre-filling is expressed on the prompt abstraction (an optional field on the text request), implemented in the Node runtime against the prompt library's initial-value support, and safely ignorable by an implementation that does not support it. The browser adapter still supplies no text ability and is unaffected.
- [ ] The test double in `@rocketh/test-utils` can assert what was pre-filled, so a test can prove the previous answer really was carried over rather than the question being asked from scratch.
- [ ] Deployment and execution funnels behave the same, since both reach this prompt through the same choke point. The deployment address invariants still run on the eventually-accepted hash, and a rejected hash still saves NOTHING (no deployment record, no pending-transaction file, no gas-tracker entry).
- [ ] The user-facing documentation of the interactive flow describes the re-ask, replacing the current text that says a not-found hash is reported and the run stops.
- [ ] A changeset covers the widened core type and the user-visible behaviour change.

## Blocked by

- None — can start immediately.

## Prompt

Implement an interactive re-ask for a pasted transaction hash that the node cannot find, replacing today's hard failure, with the user's previous answer pre-filled in the new prompt.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `tasks/done/`, the relevant ADRs, and the tasks it depends on? If the interactive path has changed shape since this was written, do NOT build on the stale premise — route the task to needs-attention with the discrepancy as the reason. Building on a stale task produces wrong-but-compiling work.

Context you need, in the vocabulary this repo uses:

The UNKNOWN-SIGNER SEAM is the single `broadcastTransaction` choke point in `packages/rocketh/src/environment`. Every transaction funnels through it, and when the `from` address is `unsignable` it consults the `onUnknownSigner` POLICY. Under the `'ask'` policy an interactive resolver PAUSES the run, prints the transaction the human must execute out-of-band (on their Safe, hardware wallet, or whatever holds the key), and asks them to paste back the hash of the transaction they executed. Rocketh then looks that transaction up, waits for it, verifies it, and continues the run as if it had broadcast the transaction itself. ADR 0006 and ADR 0007 are the two decisions that shape all of this; read both.

The specific code you are changing lives around the pasted-hash wait in `packages/rocketh/src/environment/index.ts` (find it by the lookup-rounds constant) and the resolver next to it that owns the prompt loop and the accept/defer rules. The prompt ABSTRACTION is `PromptExecutor` in `@rocketh/core`'s types: `promptText` is OPTIONAL, and its ABSENCE is the capability signal that keeps CI and the browser out of the interactive path entirely — do not weaken that, and do not add a TTY or interactivity probe to `canPromptForText()`, which ADR 0007 pins as pure method presence. The runtime decides whether to SUPPLY the ability; `@rocketh/node` already gates it on stdin being a terminal, and that is the pattern to follow for anything runtime-specific here.

Three constraints that are easy to break:

1. THE BOUND IS LOAD-BEARING. The current not-found failure exists because an unbounded wait hangs a run for ever on a hash no node will ever know. Replacing it with a re-ask must not reintroduce that. A bounded number of re-asks, ending in a terminal outcome, is required, and a test must prove termination without sleeping.
2. THERE IS ALREADY A RE-ASK, for a paste that is not a well-formed hash. Read it before adding a second one. Two independent budgets that can each reset is how an unbounded loop arrives by accident; decide whether they share a budget, and pin it with a test that alternates malformed and not-found answers.
3. SAVE NOTHING ON A REJECTED HASH. The refusals on this path are deliberately positioned before any state is written — before the pending-transaction file, before the gas tracker, before the deployment record. Whatever you restructure, that ordering has to hold, and there are existing tests asserting it. A deployment additionally has address invariants (code at the expected address, or a receipt naming a created contract) that must run on the hash finally accepted.

Widening the text-prompt request with an optional pre-fill field is a `@rocketh/core` public-type change. Implement it in `@rocketh/node` against the prompt library's own initial-value support, make the `@rocketh/test-utils` double record it so tests can assert what was pre-filled, and leave `@rocketh/web` alone (it deliberately ships no text ability — see `work/notes/ideas/web-text-prompt-needs-a-ui-integration-point.md` for why that is a pending design question and not a permanent refusal).

Test at the seam, not through the CLI: build a real environment against a mock provider and drive `env.broadcastExecution` / `env.broadcastDeployment` with a scripted prompt, which is how the existing interactive tests are written (`packages/rocketh/test/interactive-unknown-signer.test.ts` and `interactive-deployment-address.test.ts`). Note that asserting only "it threw `UnknownSignerError`" is NOT discriminating on this path: a run that enters the interactive path and fails inside it throws the same error as one that never entered. Assert on what the user was SHOWN and on what was ASKED, as the existing tests do.

Update the interactive-flow section of `documentation.md`, which currently tells users a not-found hash stops the run, and write a changeset covering both the core type widening and the user-visible change.

RECORD non-obvious in-scope decisions durably and link them from the done record — especially the re-ask budget, what happens when it is exhausted, and the shared-vs-separate budget question. If a decision meets the ADR gate (hard to reverse, surprising without context, a real trade-off), write it as an ADR; otherwise a JSDoc at the choice site plus a link from the done record is enough. An un-recorded in-scope decision is a review finding, not a silent default.

---

### Claiming this task

```sh
# atomically claim it (works with a GitHub remote OR a local --bare remote):
dorfl claim <slug> --arbiter <remote>      # default --arbiter origin
# then start work on the updated main:
git fetch <remote> && git switch -c work/<slug> <remote>/main
# on completion, in the work branch's PR/merge:
git mv work/tasks/ready/<slug>.md work/tasks/done/<slug>.md
```
