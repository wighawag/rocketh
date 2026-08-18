<!-- dorfl-sidecar: item=observation:test-coverage-gaps-2026-08-11 type=observation slug=test-coverage-gaps-2026-08-11 allAnswered=false -->

Item: [`observation:test-coverage-gaps-2026-08-11`](../notes/observations/test-coverage-gaps-2026-08-11.md)

## Q1

**For the six zero-test packages (signer, viem, router, web, export, doc), is it approved to add the required vitest wiring (vitest.config.ts, test script, vitest devDep) to each?**

> Note (2026-08-18): the TS-config half of this wiring is no longer a separate step. Each package now carries a broad checking `tsconfig.json` (`noEmit`, `types: ["node"]`, covering `src` + `test`) alongside the emitting `tsconfig.build.json`, so `test/` is type-checked as soon as it exists. The `tsconfig.test.json` this question originally named no longer exists; see `CONTEXT.md`.

> AGENTS.md flags adding new package dependencies as an 'ask first' item. The observation's §1 lists this wiring as a prerequisite before any tests can be written for these packages.

_Suggested default: Yes — vitest is already the repo-wide test runner; adding it to sibling packages is consistent, not a new dep at the monorepo level._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Should the eight verified bugs listed under 'Bugs surfaced while mapping coverage' be split out as individual bug observations/tasks, or handled inline as part of the coverage work?**

> The note explicitly frames them as 'decisions, not test cases — resolve the intent before pinning behaviour' (FS-store listFiles ignoring filter; doc emptying docs/; blockscout dead !url guard; blockscout early-return; diamond mutating options.facets; unreachable proxy zero-owner throw; diamond's dead validated salt; ERC165 asymmetry). Each has an intent question that must be answered before a test can encode the correct behaviour.

_Suggested default: Split each into its own bug observation so triage decides disposition per bug; do not let them ride silently on a coverage task._

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

## Q3

**For the dead-code items (getChainIdForExecutionParams, executeDeployScriptsFromFiles, lookupFile, newEnvironments, autoMine/autoImpersonate undefined defaults) — delete, export, or leave?**

> Observation §'Dead code found' names five. `newEnvironments` (rocketh-node/src/executor/index.ts:174-184) is computed but not included in the returned config — the note calls this 'bug or dead code', which is itself an open question.

_Suggested default: Delete the four uncalled/unreachable ones; investigate `newEnvironments` as a bug candidate before deleting._

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

## Q4

**Is `askBeforeProceeding` consulting the executor's own `promptExecutor` (rocketh/src/executor/index.ts:444,455) instead of `resolvedExecutionParams.promptExecutor` a bug or intentional?**

> The note flags this as an asymmetry with :422-424 that 'looks like a bug'. The answer determines whether the eventual test pins current behaviour or the corrected behaviour.

_Suggested default: Treat as a bug — the resolution path exists precisely so callers can override; the direct read defeats it._

<!-- q4 fields: id=q4 -->

**Your answer** (write below this line):

## Q5

**Should the weak `toBeDefined()`-only tests in proxy/diamond (proxy 2/3/4; diamond 2/3/5/6/7) be strengthened before adding new happy-path coverage?**

> §Caveat: these inflate the coverage number without pinning behaviour, so the reported 65.81% is an optimistic ceiling. Strengthening them is cheaper per line than new tests.

_Suggested default: Yes — strengthen first; a lower but honest baseline is the correct measurement to plan against._

<!-- q5 fields: id=q5 -->

**Your answer** (write below this line):
