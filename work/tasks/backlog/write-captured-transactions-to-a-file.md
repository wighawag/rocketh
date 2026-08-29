---
title: 'Write the captured transactions to a file, once, at the end of a successful run, behind a CLI flag'
slug: write-captured-transactions-to-a-file
spec: captured-transactions
blockedBy: [capture-broadcast-transactions-on-the-environment]
covers: [1, 4, 5, 8]
---

## What to build

The file sink over the in-memory captured list: the way an operator takes a rehearsed batch to their Safe, and the way a team building a Solidity fixture gets the deployment sequence out of a JavaScript run.

**A CLI flag turns it on, and names where it goes.** Absent, the run behaves exactly as it does today and writes no new file at all. The flag takes the output PATH: the consumer who needs it is an operator already on the `--is-fork` path, so a flag reaches them without a config change, and a path-taking flag is also the escape hatch for anyone who wants a stream (they point it at one). Suggested spelling `--capture-transactions <file>`, following the spec's own vocabulary; confirm it against the existing option surface and its conventions, and say so in your report if you deviate.

**Lifecycle: written ONCE, ATOMICALLY, at the end of a SUCCESSFUL run.** That is the whole lifecycle, and the simplicity is a consequence of the model rather than an accident. There is no truncate-at-start, no append-as-you-go, no `complete` flag: on a fork or a memory node nothing real happened, so a run that halts halfway has not produced a smaller truth, it has produced a misleading one. A partial batch is actively dangerous, because an operator who executes it sends a subset of the work believing it is the whole. A run that throws therefore writes NOTHING and leaves any previous file at that path untouched. A throw is a real error and the fix is to fix it, not to publish half a plan.

That reasoning is about a fork or a memory node, and the flag is NOT gated on either, so on a run against a real network a mid-run throw means transactions really were sent and the file is still not written. Do not add a run-mode gate here (the spec asks for one flag and one file, and rocketh already keeps pending-transaction records for recovery); DO name the asymmetry in your report, so the documentation task can state plainly which run modes this output is designed for.

**The file is a contract with consumers outside this process and outside JavaScript** (a Solidity test's `setUp()`, a Safe batching tool), so the serialization has to be parseable by them. How `value` is carried in memory is settled by the previous task (its open question 4: the 0x-quantity wire form the choke point actually receives, or the spec's bigint); read what LANDED. If it landed as a bigint, JSON has no bigint, so an encoding must be chosen and the 0x-quantity form the JSON-RPC wire already uses is the idiomatic candidate; if it landed as a 0x quantity, carry it through unchanged rather than inventing a second form. Either way the encoding is pinned by a test. Absent fields stay absent rather than becoming `null`. Nothing that the entry does not carry may appear in the file: no gas, no fees, no nonce, no hash.

**Where the writer lives.** `@rocketh/core` and `rocketh` are browser-capable and must not reach for the filesystem (ADR 0002), so the write belongs on the Node side, after the executor has returned the environment, which is also what makes "only on success" fall out for free: a throw propagates past it. The flag reaches there the way other run-level options already do, and the CLI's boundary maps options explicitly rather than spreading them, for reasons the boundary module documents at length.

**Explicit non-goal:** the hardhat plugin's deploy task does not get this option in this task. The spec's plugin-author story is served by the in-process list from the previous task, without a temporary file and a path to agree on. Do not build a hook, a callback or a stdout mode either: writing to stdout would interleave with the run's own logging, which is a trap rather than a feature.

## Acceptance criteria

- [ ] A successful run given the flag writes a file at the named path holding every captured entry, in broadcast order
- [ ] A run given no flag writes no new file anywhere, and behaves exactly as it does today
- [ ] A run that throws writes nothing, and an existing file at that path is byte-identical after the failed run
- [ ] The write is atomic, so no consumer can observe a partially written file (write then rename within the same directory)
- [ ] The file is valid JSON a non-JavaScript consumer can parse, and a test pins the encoding of `value` (whichever in-memory form the previous task landed) and the full set of keys an entry may carry
- [ ] No gas, fee, nonce, hash or receipt field appears anywhere in the file, pinned by a test
- [ ] A fork run and a memory run both produce a file when asked, since capture is not a fork feature
- [ ] `--help` describes the flag accurately, and the existing option-surface test (which asserts the declared options and the parsed-options type are the same set) stays green with the new flag's key added
- [ ] Tests write ONLY into a per-test temp directory and assert no file is created outside it; nothing writes into the repo, the user's home or any shared location
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `capture-broadcast-transactions-on-the-environment`: this task serializes the list that task produces, and the entry shape it settles (including how a raw broadcast is represented) is what gets written.

## Prompt

> Goal: let an operator rehearsing an upgrade on a fork of mainnet end the run holding a file of exactly the transactions their Safe must send, in order, and let a team on a fresh memory node end the run holding the deployment sequence they can replay inside a Solidity test. One flag, one file, written once at the end of a successful run.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): read the entry shape that actually landed in `capture-broadcast-transactions-on-the-environment` and its `## Decisions` in the done record, rather than assuming the shape described here. Two things there were open at tasking time and decide your serializer: how a raw pre-signed broadcast is represented, and what form `value` takes. If it landed differently, serialize what landed and say so; do not build on the stale premise.
>
> Domain vocabulary (`CONTEXT.md` pins it): _signability_ (`local` / `node` / `impersonated` / `unsignable`) is what a consumer segments a batch on, and a _fork run_ attaches to a node somebody else forked, which is why the CLI flag for it is `--is-fork` and never `--fork` (ADR 0014's naming section). Name your flag with the same discipline: it asserts what the run should DO with what it captured, and must not promise a capability rocketh does not have.
>
> Where to look. The CLI's option surface lives in `packages/rocketh-node/src/cli-options.ts`, deliberately separated from the bin script so a test can parse it; `cli-tags.test.ts` and `cli-is-fork-flag.test.ts` show how a flag is pinned, and one of them asserts the declared options and the parsed-options type carry the same keys, so a flag added without its key goes red. `toExecutionParams` in that same module is the explicit boundary from commander's shapes to core's run parameters, and its comment explains why nothing is spread there. Run-level parameters are `ExecutionParams` / `ResolvedExecutionParams` in `packages/rocketh-core/src/types.ts`; `reportGasUse` and `saveDeployments` are the closest precedents for a run-level option that changes what happens at the end of a run. The Node-side run assembly is in `packages/rocketh-node/src/executor/index.ts`, which is where the executor returns the environment and where the filesystem is allowed.
>
> Two facts about that boundary, checked rather than assumed. First, the bin script does NOT await the run: `packages/rocketh-node/src/cli.ts` ends with a bare `loadAndExecuteDeploymentsFromFiles(executionParams);`, so there is no place in the bin script that holds the returned environment. The write therefore belongs INSIDE the Node-side run assembly (the executor path that awaits `executeDeployScriptModules` and returns its environment), not in the bin script. Second, `toExecutionParams` returns core's `ExecutionParams`, and the resolver turns that into `ResolvedExecutionParams`, so carrying the option from the CLI to that point means ADDING A FIELD to those core types, which `AGENTS.md` lists as an ask-first change. The spec ratifies exactly this (the file is turned on by a CLI flag on the operator's existing path), so it is in scope here: add the one run-level option field, mirroring `reportGasUse` / `saveDeployments`, and reshape nothing else. If you find a Node-local route that keeps the path out of core entirely, that is acceptable and preferable; say which you chose and why in your `## Decisions` block.
>
> Constraints. Core and `rocketh` stay browser-safe (ADR 0002): no `node:fs` there. Do not route this through the `DeploymentStore`: that abstraction is keyed by a deployments folder and an environment name, and this file is a user-named path, not a deployment record. This artifact has NO authority: nothing in rocketh ever reads it back to decide anything, which is what keeps it clear of ADR 0012's warning about records that acquire authority.
>
> Seams to test at. The option surface (parse argv, assert the flag and its `--help` text), the serialization (feed a known captured list through the writer and assert the exact JSON), and the lifecycle (a run that throws leaves an existing file untouched). Use a temp directory for every filesystem assertion.
>
> Done means: `rocketh -e mainnet --is-fork <your flag> ./batch.json` leaves a file that an operator can hand to a Safe tool, a failed run leaves that file untouched or absent, and a run without the flag is byte-for-byte the run it is today.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: the flag's spelling and why, the bigint encoding you chose, how you made the write atomic, and where you put the writer relative to the executor. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.
