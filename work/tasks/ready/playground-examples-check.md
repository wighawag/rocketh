---
title: 'Playground examples: one marked sample, its example project, and the checks that keep them honest'
slug: playground-examples-check
blockedBy: []
covers: []
---

Part of spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground). The spec's story numbers covered here: 6, 7, 8, 9. Its other tasks are on rocketh-playground's board.

## What to build

The tracer bullet for "Open in playground" on rocketh's side, with ONE sample: the deploy script on `documentation/deploy-scripts/` (`deploy/001_deploy_greetings_registry.ts`, which deploys `GreetingsRegistry`).

1. **The example folder.** `examples/playground/<name>/` holds only the files that differ from the playground's starting project, which is the published `hardhat-deploy init` template (`packages/hardhat-deploy/templates/basic/` is its source): here `contracts/GreetingsRegistry.sol` (import-free, the playground compiles `contracts/` with no import callback) and the deploy script. A `README.md` in `examples/playground/` states the convention, including that the starting project's own files stay (its `deploy/01_deploy_counter.ts` still runs on Deploy unless the example has a file at the same path), and that every example must deploy on a fresh chain with the starting config's accounts.
2. **The marker.** The fence gets `playground=<name>/deploy/001_deploy_greetings_registry.ts` in its info string (after the language). Check that rocketh-website's current engine renders such a fence unchanged until it learns the marker (it reads only `[label]` from the info string today); if it does not, stop and report.
3. **The equality check**, run by `pnpm test`: every marked fence in `index.md`, `documentation/` and `hardhat-deploy/` names an existing example file, and its body equals that file byte for byte (allowing only the fence's trailing newline). A mismatch fails naming the page, the line and the file.
4. **The deploy check**, `pnpm test:docs:playground-examples`: for each example, the published `hardhat-deploy init` template in a fresh temporary folder, the example's files over it, `pnpm i`, `pnpm hardhat compile`, `pnpm hardhat deploy` on the in-memory network. Reuse `scripts/test-doc.sh --outside`'s hygiene (unset `npm_config_*`, an empty `XDG_CONFIG_HOME` exempting rocketh's own packages from `minimumReleaseAge`, the lockfile untouched); one install reused across examples is fine if each example starts from a clean copy.
5. **CI.** Run the deploy check on pull requests that touch `examples/playground/` or a marked page (`test.yml`), and in `docs-release-smoke.yml` after every release and daily. These workflow changes are approved with the spec's answers (2026-11-20, "The check runs in rocketh's CI").

No changeset if no package changes.

## Acceptance criteria

- [ ] `examples/playground/<name>/` exists with its README, and the `deploy-scripts` sample is marked.
- [ ] `pnpm test` fails when the marked fence and its file differ, and when a marker names a missing file (tests for both).
- [ ] `pnpm test:docs:playground-examples` deploys the example against the published packages, and fails on a deliberately broken example (shown in the report, not committed).
- [ ] The two workflows run it as described, and `pnpm format:check` passes.
- [ ] `pnpm docs:build` still builds (the site renders the marked fence as an ordinary code block until rocketh-website learns the marker).

## Blocked by

- None. Can start immediately.

## Prompt

> Goal: rocketh's half of "Open in playground" for one sample: the example-project convention, the marker, the equality check, the deploy-against-the-release check, and CI. Read spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground), then `AGENTS.md`, `CONTRIBUTING.md` (the docs tests and the documentation site), `scripts/test-doc.sh` and the two workflows named above. The playground's own proof that a project deploying this way also deploys in the tab is its `pnpm test:export` (rocketh-playground `test/export/installs-and-deploys.export.ts`). Done means the acceptance criteria hold and `verify` (dorfl.json) passes.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: stop and report the discrepancy (WORK-CONTRACT "Drift is a needs-attention signal").
>
> The repositories are public: no file, pull request or commit message names a funder, a grant, a milestone or a report; describe a change by what it does for a user. Never write em dashes; do not hard-wrap Markdown prose. Bound every shell command with `timeout`, stop any server you start, and never send a transaction.
>
> RECORD non-obvious in-scope decisions you make while building in a `## Decisions` block at the end of your FINAL REPORT. When the task did not specify some behaviour and you had to choose, say what you chose and why. Do not write the done record, the commit message or the PR body yourself.
