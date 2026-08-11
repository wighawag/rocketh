<!-- dorfl-sidecar: item=observation:strict-bytecode-match-untested-and-undocumented type=observation slug=strict-bytecode-match-untested-and-undocumented allAnswered=false -->

Item: [`observation:strict-bytecode-match-untested-and-undocumented`](../notes/observations/strict-bytecode-match-untested-and-undocumented.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Promote.** Verified live on both halves: `strictBytecodeMatch` appears NOWHERE in `documentation.md`, and no test names it (`packages/rocketh-deploy/test/deploy.integration.test.ts` covers `alwaysOverride` only). It is implemented in four places (`rocketh-deploy/src/index.ts:297,345`, `rocketh-diamond/src/index.ts:71`, `rocketh-router/src/index.ts:63`). ADR 0004 makes non-strict matching a deliberate decision, which makes an undocumented, untested OPT-OUT of that decision the one item in this cluster with a correctness edge rather than a tidiness one. Task should carry: dedicated tests, a `documentation.md` section, and named constants for the CBOR-stripping magic values.
