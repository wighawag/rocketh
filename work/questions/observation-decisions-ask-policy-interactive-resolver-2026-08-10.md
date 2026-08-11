<!-- dorfl-sidecar: item=observation:decisions-ask-policy-interactive-resolver-2026-08-10 type=observation slug=decisions-ask-policy-interactive-resolver-2026-08-10 allAnswered=false -->

Item: [`observation:decisions-ask-policy-interactive-resolver-2026-08-10`](../notes/observations/decisions-ask-policy-interactive-resolver-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all eight decisions accepted as-is; keep the note.** Nothing here is reopened, including the four with real user-visible weight: `'auto'` becoming interactive wherever a text prompt exists (narrowed by decision 7's TTY gate, so a run WITHOUT a terminal behaves exactly as before); the refusal on a pasted transaction whose receipt is not successful; the bounded re-ask (`MAX_HASH_PROMPT_ATTEMPTS` = 3, then defer); and the resolver NOT being gated to executions, so deployments resolve interactively too.

One factual correction was applied to the note rather than ratified: decision 2 named `requireSuccessfulExecutedTransaction`, a symbol that does not exist. The function that landed is `waitForPastedTransaction` (the name decision 8 already used), which absorbed the successful-status check during the same requeue that added the unknown-hash bound. Corrected in place, with a dated note saying so, because a decision record whose cited symbol cannot be grepped fails the one reader it exists for.

Live residue, not decided here: whether the runtime should ALSO withhold the text ability when `process.env.CI` is set (a CI runner that allocates a pty still gets `promptText`), and whether `PASTED_TRANSACTION_LOOKUP_ROUNDS` = 10 rounds at the polling interval is long enough for a hash pasted straight after a Safe execution against a load-balanced public RPC. Both are recorded on the matching review-nits note.
