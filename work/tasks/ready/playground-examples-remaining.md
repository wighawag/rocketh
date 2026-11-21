---
title: 'Playground examples: routers and the remaining runnable samples'
slug: playground-examples-remaining
blockedBy: [playground-examples-proxies-and-diamonds]
covers: []
---

Part of spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground). Spec stories covered: 5, 6, 9.

Also blocked, in another repository, by rocketh-playground's task `runner-resolves-rocketh-router` (the routers sample cannot run in the tab before it lands).

## What to build

Mark the rest of the complete deploy-script samples that can run on a fresh chain in the tab: `documentation/routers/` (`deployViaRouter`, with an example config registering `@rocketh/router`), and, judging each against the spec's Out of Scope (no fork, no account rocketh cannot sign for, no package imports in Solidity, no artifacts from a package), `documentation/execute-guard/`, `documentation/script-lifecycle/`, `hardhat-deploy/migration/` (the plain `MyContract` deploy) and `hardhat-deploy/migration/step-by-step/` (`SimpleERC20`). `documentation/fork-runs/`, the `catchUnknownSigner` samples and `documentation/sharing-contracts/` stay unmarked.

## Acceptance criteria

- [ ] Each sample listed is marked with a passing example, or listed in the report with the reason it is not.
- [ ] The routers example deploys in the deploy check.
- [ ] `pnpm test` and `pnpm test:docs:playground-examples` pass.

## Blocked by

- `playground-examples-proxies-and-diamonds` (same files: serialised)
- rocketh-playground `runner-resolves-rocketh-router` (other repository)

## Prompt

> Goal: the remaining playground examples. Read spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground), `examples/playground/README.md` and the done records of the earlier playground-examples tasks. Done means the acceptance criteria hold and `verify` passes.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: stop and report the discrepancy (WORK-CONTRACT "Drift is a needs-attention signal").
>
> The repositories are public: no file, pull request or commit message names a funder, a grant, a milestone or a report; describe a change by what it does for a user. Never write em dashes; do not hard-wrap Markdown prose. Bound every shell command with `timeout`, stop any server you start, and never send a transaction.
>
> RECORD non-obvious in-scope decisions you make while building in a `## Decisions` block at the end of your FINAL REPORT. When the task did not specify some behaviour and you had to choose, say what you chose and why. Do not write the done record, the commit message or the PR body yourself.
