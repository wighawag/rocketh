<!-- dorfl-sidecar: item=observation:commented-out-proxy-tests-and-doc-drift type=observation slug=commented-out-proxy-tests-and-doc-drift allAnswered=false -->

Item: [`observation:commented-out-proxy-tests-and-doc-drift`](../notes/observations/commented-out-proxy-tests-and-doc-drift.md)

## Q1

**What should become of this observation? Reply with a disposition and a reason: resolve (settle it, keep the note on record — say why), promote (mint a task / spec / adr — say which and why), delete (redundant or obsolete — say why), or duplicate (maps onto an existing item — name it).**

> The engine records your disposition from the answer (no token needed); an answered promote mints the artifact, resolve keeps the note settled, delete/duplicate discharge it.

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Promote, split in two.** Both halves verified live.

1. The DOC DRIFT is the urgent half and should become a small task: `documentation.md:208` ("Named accounts are configured in the `rocketh.ts` file") and `:853` both name `rocketh.ts`, while the real path everywhere in this repo is `rocketh/config.ts` (`packages/hardhat-deploy/templates/basic/rocketh/config.ts`, all four `demoes/*/rocketh/config.ts`, and `skills/hardhat-deploy-migration/SKILL.md`). A new user following the docs creates a file rocketh never reads.
2. The COMMENTED-OUT TESTS (`packages/rocketh-proxy/test/proxy.integration.test.ts:274` and `:310`, full Transparent / Optimized-Transparent bodies under `// TODO`) are a separate decision: implement them against `createTestEnvironment` or delete them. Not decided here.

Keep the note until the doc-drift task exists, then narrow it to the commented tests.
