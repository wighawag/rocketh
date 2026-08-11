---
title: review-gate non-blocking nits for 'ask-policy-interactive-resolver' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: ask-policy-interactive-resolver
needsAnswers: false
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'ask-policy-interactive-resolver' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- The CI guarantee now rests entirely on process.stdin.isTTY. A CI runner that allocates a pty (docker run -t, some Jenkins/GitLab configurations) still gets promptText, so an unsignable from under the default auto would pause and wait for input nobody types. Should the runtime also withhold the ability when process.env.CI is set, or is TTY-only the ratified probe? The docs and changeset are carefully qualified (a CI run whose stdin is not a terminal), so this is a residual, not a false claim.
  (packages/rocketh-node/src/environment/prompt.ts, isStdinInteractive default; docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md case 3 shows a pipe answers with whatever bytes are on it)
- Ratify the unknown-hash bound: PASTED_TRANSACTION_LOOKUP_ROUNDS is 10 rounds at the run pollingInterval, which at the default of 1s is about 10 seconds before a hard plain Error that saves nothing. A hash pasted straight after a Safe execution against a load-balanced public RPC can plausibly take longer to be visible. It bites hardest on the deployment funnel (ratified decision 5), where giving up on a transaction that did execute leaves no deployment record and a re-run redeploys. Keep 10 rounds, or make it a wall-clock grace period?
  (packages/rocketh/src/environment/index.ts PASTED_TRANSACTION_LOOKUP_ROUNDS and waitForPastedTransaction; packages/rocketh/src/executor/index.ts defaultPollingInterval: 1)
- The measured prompts@2.4.2 non-TTY behaviour is verified external ground truth, which the work/ contract homes in work/notes/findings/ with a source:. It landed instead in a brand-new docs/spikes/ directory (absent on main) alongside a committed probe.mjs, while work/notes/findings/ is empty. Is docs/spikes/ a deliberate new convention to pin in CONTEXT.md, or should the measurement move to a finding note?
  (docs/spikes/ask-policy-interactive-resolver/{probe.mjs,prompts-non-tty-behaviour.md}; work/notes/findings/ is empty; WORK-CONTRACT bucket polarity)
- The durable decisions note still names requireSuccessfulExecutedTransaction in decision 2, but the function that landed is waitForPastedTransaction (decision 8 in the same file uses the new name). A future reader grepping the cited symbol finds nothing.
  (work/notes/observations/decisions-ask-policy-interactive-resolver-2026-08-10.md item 2 vs packages/rocketh/src/environment/index.ts)

## Applied answers 2026-08-11

### q1: What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).

**Ratified, with one finding turned into work and one still open.** The task this reviews is in `work/tasks/done/`, so none of it blocks anything.

- **The unknown-hash bound: CHANGED, not ratified.** A hash the node cannot find should NOT end the run. It should RE-ASK, with the previously typed hash PRE-FILLED, so a truncated paste or an RPC that has not caught up costs an edit instead of a whole re-run. Minted as `work/tasks/backlog/re-ask-a-not-found-pasted-hash-with-the-previous-value.md`, which carries the constraint that the bound itself must survive in some form (an unbounded re-ask is the hang the current bound exists to prevent) and must reconcile with the malformed-input re-ask that already exists.
- **The `docs/spikes/` vs `work/notes/findings/` question** is being decided upstream in `../dorfl`, where the protocol source of truth lives, together with the `decisions-*` note-kind and missing-Decisions-block questions.
- **The stale symbol** (`requireSuccessfulExecutedTransaction`, which never existed; the landed function is `waitForPastedTransaction`) is FIXED in the decisions note it was raised against.
- **Still open, deliberately:** whether the runtime should also withhold the text ability when `process.env.CI` is set. A CI runner that allocates a pty still gets `promptText` today, so the guarantee rests on `process.stdin.isTTY` alone.
