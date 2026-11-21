---
title: 'Playground examples: the first batch of pages'
slug: playground-examples-first-batch
blockedBy: [playground-examples-check]
covers: []
---

Part of spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground). Spec stories covered: 5, 6, 9.

## What to build

Mark the complete deploy-script samples on the spec's first-batch pages, each with an example project under `examples/playground/`, following the convention `playground-examples-check` set: `documentation/deploy-contracts/` (two samples: `GreetingsRegistry` with an `execute`, and `ExampleLibrary` / `Example`, a linked library), `documentation/deterministic-addresses/` (`A` / `B`), `documentation/viem/` and `hardhat-deploy/typed-artifacts/`. They need only the extensions the starting config registers (`@rocketh/deploy`, `@rocketh/read-execute`, `@rocketh/viem`, `@rocketh/unknown-signer`).

Each sample's fence must stay what the page needs: write the example around the sample, not the sample around the example. Where a sample is not a complete runnable file as it stands, either leave it unmarked and say why in the report, or, if a small edit keeps the page's point, make it and say what changed. Every file of an example's `deploy/` runs on Deploy, so an example holds exactly the scripts that make sense together.

Also add one short paragraph where the docs first present a sample with the button (the first-batch page you judge best, or `documentation/index.md`): what the button opens, that the playground runs the latest release and so can lag the documentation by up to a day after one.

## Acceptance criteria

- [ ] Every complete runnable deploy-script sample on those five pages is marked, or listed in the report with the reason it is not.
- [ ] `pnpm test` (equality) and `pnpm test:docs:playground-examples` pass for every example.
- [ ] The paragraph about the button exists.
- [ ] `pnpm docs:build` builds, `pnpm format:check` passes.

## Blocked by

- `playground-examples-check`

## Prompt

> Goal: the first batch of playground examples. Read spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground) ("What the documentation holds today" and the first-batch decision), `examples/playground/README.md`, and the done record of `playground-examples-check`. Done means the acceptance criteria hold and `verify` passes.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: stop and report the discrepancy (WORK-CONTRACT "Drift is a needs-attention signal").
>
> The repositories are public: no file, pull request or commit message names a funder, a grant, a milestone or a report; describe a change by what it does for a user. Never write em dashes; do not hard-wrap Markdown prose. Bound every shell command with `timeout`, stop any server you start, and never send a transaction.
>
> RECORD non-obvious in-scope decisions you make while building in a `## Decisions` block at the end of your FINAL REPORT. When the task did not specify some behaviour and you had to choose, say what you chose and why. Do not write the done record, the commit message or the PR body yourself.
