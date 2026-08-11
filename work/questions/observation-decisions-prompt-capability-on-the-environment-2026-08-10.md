<!-- dorfl-sidecar: item=observation:decisions-prompt-capability-on-the-environment-2026-08-10 type=observation slug=decisions-prompt-capability-on-the-environment-2026-08-10 allAnswered=false -->

Item: [`observation:decisions-prompt-capability-on-the-environment-2026-08-10`](../notes/observations/decisions-prompt-capability-on-the-environment-2026-08-10.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Ratified - all six decisions accepted as-is; keep the note.**

Including the two with user-visible weight: the loader supplying `@rocketh/node`'s prompt to hardhat-deploy runs by default (decision 4), and an EMPTY answer being a VALUE rather than a cancellation (decision 6), which the interactive resolver's defer semantics rest on.

Two things were checked while ratifying, and both hold:

- The TTY question this note anticipated is settled by what landed: the gate lives in the RUNTIME (`packages/rocketh-node/src/environment/prompt.ts` supplies `promptText` only when `process.stdin.isTTY`), not in `canPromptForText()`, which stays pure method presence per ADR 0007.
- Decision 4's asymmetry between the two entry points is FIXED rather than ratified. The environment loader built its prompt per call while the execute path used a module-level one built at import, so the two agreed only by coincidence (identical for a CLI process, divergent for an embedder running deployments in-process). Both now build per call, and a caller-supplied `ExecutionParams.promptExecutor` still wins over both. Note the CLI and hardhat-deploy's deploy task are the same code path - both call `loadAndExecuteDeploymentsFromFiles` - so this was never a CLI-vs-hardhat-deploy difference.

Decided and closed alongside this: the runtime will NOT also withhold the text ability when `process.env.CI` is set. The guarantee rests on `process.stdin.isTTY` alone. A CI runner that allocates a pty therefore still gets a text prompt, which is the accepted residual: the docs are carefully qualified ("a CI run whose stdin is not a terminal"), and withholding on an env var would break someone deliberately running interactively in a CI-labelled environment.
