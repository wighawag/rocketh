---
title: 'Playground examples: proxies and diamonds'
slug: playground-examples-proxies-and-diamonds
needsAnswers: true
blockedBy: [playground-examples-first-batch]
covers: []
---

Part of spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground). Spec stories covered: 2, 6, 9.

<!-- open-questions -->

## Open questions

1. The diamond sample needs `@rocketh/diamond`, which the `hardhat-deploy init` template does not depend on (its package.json has `@rocketh/proxy` but not `@rocketh/diamond`). The playground's runner resolves it, but the deploy check installs the template, and the playground's Download pins only packages the template already lists. Options: (a) an example may carry a `package.json` dependency addition that both the check and the playground's Download honour; (b) add `@rocketh/diamond` to the init template; (c) leave the diamond sample unmarked for now. Which?

<!-- /open-questions -->

## What to build

Mark the proxy and diamond samples, each with an example whose `rocketh/config.ts` registers the extension it needs (the starting config registers `@rocketh/deploy`, `@rocketh/read-execute`, `@rocketh/viem` and `@rocketh/unknown-signer` only): `documentation/index.md` and `documentation/proxies/` (`deployViaProxy` of `GreetingsRegistry`), `hardhat-deploy/migration/step-by-step/` (its `deployViaProxy` sample), and `documentation/diamonds/` (`CounterFacet` / `AdminFacet`, per the answer above). The example's `rocketh/config.ts` is the starting project's with the extension added, so it stays recognisable.

## Acceptance criteria

- [ ] Each sample above is marked with a passing example, or listed in the report with the reason it is not.
- [ ] `pnpm test` and `pnpm test:docs:playground-examples` pass.

## Blocked by

- `playground-examples-first-batch` (same files: serialised)

## Prompt

> Goal: proxy and diamond playground examples. Read spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground), `examples/playground/README.md` and the done records of the earlier playground-examples tasks. The playground's runner already resolves `@rocketh/proxy` and `@rocketh/diamond` (rocketh-playground `web/src/lib/playground/runner/bare-modules.ts`). Done means the acceptance criteria hold and `verify` passes.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: stop and report the discrepancy (WORK-CONTRACT "Drift is a needs-attention signal").
>
> The repositories are public: no file, pull request or commit message names a funder, a grant, a milestone or a report; describe a change by what it does for a user. Never write em dashes; do not hard-wrap Markdown prose. Bound every shell command with `timeout`, stop any server you start, and never send a transaction.
>
> RECORD non-obvious in-scope decisions you make while building in a `## Decisions` block at the end of your FINAL REPORT. When the task did not specify some behaviour and you had to choose, say what you chose and why. Do not write the done record, the commit message or the PR body yourself.
