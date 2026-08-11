<!-- dorfl-sidecar: item=observation:review-nits-unknown-signer-package-2026-08-09 type=observation slug=review-nits-unknown-signer-package-2026-08-09 allAnswered=false -->

Item: [`observation:review-nits-unknown-signer-package-2026-08-09`](../notes/observations/review-nits-unknown-signer-package-2026-08-09.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all findings accepted as-is; no reversal.** The task this reviews is in `work/tasks/done/`, so none of these block anything.

Accepted: `UnknownSignerError` re-exported from the `./errors` subpath with the root staying function-only (verified correct, and now pinned in `AGENTS.md` and `CONTEXT.md` - `withEnvironment` calls every root export as `value(env)`, so a spread-in class is refused by name); the deferred-transaction block printed through `env.showMessage`, and therefore gated by the run log level, rather than v1's unconditional `console.log`; and the cross-realm look-alike rule that only treats a by-name `UnknownSignerError` as ours when it also carries object `data` with a `from` key.

Live residue: the README never mentions the `./errors` subpath, so a consumer wanting an `instanceof` check cannot discover it. Worth one line.

The type-checking finding is answered separately on `observation:test-files-are-outside-pnpm-typecheck-2026-08-09`; the missing-Decisions-block finding is covered by the repo-wide process question.
