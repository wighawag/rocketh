<!-- dorfl-sidecar: item=observation:review-nits-prompt-capability-on-the-environment-2026-08-10 type=observation slug=review-nits-prompt-capability-on-the-environment-2026-08-10 allAnswered=false -->

Item: [`observation:review-nits-prompt-capability-on-the-environment-2026-08-10`](../notes/observations/review-nits-prompt-capability-on-the-environment-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings in this note are accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

The TTY-probe question this note raises has since been ANSWERED BY WHAT LANDED: the gate went into the runtime (`packages/rocketh-node/src/environment/prompt.ts` supplies `promptText` only when `process.stdin.isTTY`), not into `canPromptForText()`, which stays pure method presence per ADR 0007. A non-TTY CI run therefore has no capability at all and `'auto'` still resolves to `'throw'` there.

Live residue: the narrower confirm-site scope is ratified as-is. A caller injecting a prompt through `ExecutionParams` overrides the environment's capability but NOT the `askBeforeProceeding` confirms, which still use the constructor-supplied executor. The decisions note reads broader than what landed and should be tightened when next touched.

Keep the note until the residue above is either acted on or judged not worth acting on; it is the only record of these choices outside the code.
