---
title: review-gate non-blocking nits for 'ask-policy-interactive-resolver' (Gate 2 approve)
date: 2026-08-10
status: open
reviewOf: ask-policy-interactive-resolver
needsAnswers: true
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
  (the `## Decisions` block of `work/tasks/done/ask-policy-interactive-resolver.md` item 2 vs packages/rocketh/src/environment/index.ts)
