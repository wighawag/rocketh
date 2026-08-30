---
title: 'Ported hardhat-deploy v1 proxy-upgrade script as a whole-script parity test'
slug: ported-v1-proxy-upgrade-script-test
spec: unknown-signer-v1-migration
blockedBy: []
covers: [1, 8]
---

## What to build

A realistic hardhat-deploy v1 deploy script that uses `deployments.catchUnknownSigner` around a proxy upgrade (a governance-owned proxy: Safe as `proxyOwner`, an `upgradeTo(newImpl)`-style call the Safe must sign), ported MECHANICALLY to rocketh (change the import and add the arrow function — nothing else), lifted into the `@rocketh/unknown-signer` test suite, and pinned by observable-behaviour assertions.

The test demonstrates "identical behaviour" on a whole script rather than per-field:

- The script is a plausible v1 upgrade script (a proxy already deployed at a prior "run", now upgrading its implementation via `catchUnknownSigner(() => execute(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [next]}))`).
- Run it; assert the wrapped call DEFERRED rather than waited (no receipt, no revert, `deferred` is non-null and has the v1 shape).
- Assert the rest of the script still runs after the deferral (the wrapper unwinds only the wrapped action; the next statement is reached — a follow-up read / log / no-op step should be observable).
- Assert that on a SECOND run (state now updated on-chain, simulating the Safe having executed the deferred transaction), the wrapped upgrade step is SKIPPED by the script's own on-chain idempotency check and the script completes without deferring — this is what "idempotency comes from on-chain state alone" looks like end-to-end.
- Assert the returned deferred object has the v1 shape (`{from, to, value, data}` with keys present, `value` a string).

Keep the port faithful: comments or a header in the test should show the v1 form beside the rocketh form (the one-line diff) so the test doubles as a migration example.

## Acceptance criteria

- [ ] New integration test file under `packages/rocketh-unknown-signer/test/` named to reflect "ported v1 script".
- [ ] The scripted scenario is a proxy upgrade whose upgrade authority is a Safe-style unsignable account (use the existing `safeOwner` fixture pattern in this package).
- [ ] Test asserts the wrapped call DEFERRED (returned the v1-shape object) and that the STATEMENT AFTER the wrapper still executes (rest-of-script continues).
- [ ] Test asserts that a re-run after the on-chain state has changed skips the upgrade step via idempotency and returns `null` (or does not call the wrapper).
- [ ] Test header / comment shows the v1 → rocketh port as the one-line diff (import + `() =>`).
- [ ] Tests run in the package's normal `pnpm test`.
- [ ] Tests ISOLATE any filesystem writes to a temp dir (if a store is used) and do not touch real user paths.

## Blocked by

- None — can start immediately.

## Prompt

> Goal: demonstrate that a REALISTIC hardhat-deploy v1 deploy script using `deployments.catchUnknownSigner` around a proxy upgrade behaves identically after a MECHANICAL port to rocketh (import change + arrow function only). This is the "prove it on a whole script" story of `work/specs/tasked/unknown-signer-v1-migration.md`, story 8.
>
> FIRST, check this task against current reality. Read `packages/rocketh-unknown-signer/test/scenarios.integration.test.ts` — it already covers the mechanism (a Safe-owned proxy, a deferral, a second-run skip) at a scenario level. Your task is DIFFERENT: it presents the same shape as a mechanically-ported v1 SCRIPT, so a reader can see the migration diff. Do not just duplicate the scenario file; the point is the script-as-example.
>
> Vocabulary: "port mechanically" means the v1 source and the rocketh source differ ONLY in the import line and in wrapping the action in `() =>`. Everything else — `namedAccounts` names (`proxyOwner` / `safeOwner`), the proxy artifact, the `execute(proxy, {functionName: 'upgradeTo', args: [next]})` call — reads the same.
>
> Where to look: `@rocketh/unknown-signer` (existing scenarios + helpers), `@rocketh/proxy` (proxy artifacts and `deployViaProxy` if you want a full end-to-end), `@rocketh/test-utils` for `createTestEnvironment` + `createMockArtifact`, and the `hardhat-deploy/` folder in this repo for reference on the v1 script shape. The `demoes/hardhat-deploy/proxies/` folder may also carry a v1 example worth mirroring.
>
> Seams to test at: the return value of the wrapper; execution of the statement after the wrapper; a second run's idempotency skip. Do NOT test the seam mechanics — those are pinned elsewhere.
>
> Done means: `pnpm --filter @rocketh/unknown-signer test` passes with the new file; a reader who has never used rocketh can look at the test file's script and see, from the header/comment, exactly the one-line change to migrate from v1.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report (e.g. how you simulated the "second run" state change, or which real v1 script you took as your template).
