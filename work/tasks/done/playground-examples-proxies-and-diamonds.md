---
title: 'Playground examples: proxies and diamonds'
slug: playground-examples-proxies-and-diamonds
blockedBy: [playground-examples-first-batch]
covers: []
---

Part of spec `open-in-playground`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/open-in-playground.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground). Spec stories covered: 2, 6, 9.

## Answers (maintainer, 2026-11-20)

1. The diamond sample needs `@rocketh/diamond`, which the `hardhat-deploy init` template does not depend on. Decided: dependencies are declared by importing them. The deploy check adds every package an example's files import that the template's `package.json` lacks, at its latest published version, before `pnpm i`. The playground's Download does the same at the version the tab ran (rocketh-playground task `runner-resolves-rocketh-router`). So an example never carries a `package.json`, and the diamond sample is marked.

## What to build

Mark the proxy and diamond samples, each with an example whose `rocketh/config.ts` registers the extension it needs (the starting config registers `@rocketh/deploy`, `@rocketh/read-execute`, `@rocketh/viem` and `@rocketh/unknown-signer` only): `documentation/index.md` and `documentation/proxies/` (`deployViaProxy` of `GreetingsRegistry`), `hardhat-deploy/migration/step-by-step/` (its `deployViaProxy` sample), and `documentation/diamonds/` (`CounterFacet` / `AdminFacet`).

Extend `pnpm test:docs:playground-examples` with the answer's rule: before installing, add to the copied template's `package.json` every bare package the example's files import that it does not list (in `devDependencies`, where the template keeps its rocketh packages), at its latest published version. An example importing only the template's packages installs exactly as before. The example's `rocketh/config.ts` is the starting project's with the extension added, so it stays recognisable.

## Acceptance criteria

- [ ] Each sample above is marked with a passing example, or listed in the report with the reason it is not.
- [ ] The deploy check adds an imported package the template lacks (the diamond example proves it), and leaves `package.json` untouched otherwise.
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

## Decisions

- **Example names:** `greetings-registry-proxy` for the proxies page, `greetings-registry-proxy-intro` for `documentation/index.md`, `greetings-registry-proxy-migrated` for the step-by-step page, and `counter-diamond`. They follow the contract-plus-suffix naming of the earlier tasks. The three proxy samples differ (the tags, the `id`, `postUpgrade` versus `init`), and every file in `deploy/` runs, so each needs its own folder. The alternative was naming them after pages, as the spec's `proxies` example does.
- **`Proxied.sol` is copied into each proxy example** from `packages/rocketh-proxy/solc_0_8/ERC1967/Proxied.sol` (MIT), and imported as `./Proxied.sol`. The playground compiles with no import callback, and this keeps the contract identical to the docs' contract apart from the import path. The alternative was an inline guard written for the example, which would drift from what the page teaches.
- **`AdminFacet.setCount` checks the caller against `IERC173(address(this)).owner()`**, asking the diamond itself. That way the facet does not depend on the storage layout of `@rocketh/diamond`'s ownership facet. The alternative, reading that facet's storage slot directly, would break silently if the package changed its layout.
- **How a missing package is added:** the check writes `^<latest>` from `pnpm view` into `devDependencies` (keys sorted, indentation kept), then runs `pnpm install --no-frozen-lockfile`. It does not use `pnpm add`, which may refuse to add to a workspace root, and the template has a `pnpm-workspace.yaml`. The caret matches how the template pins its rocketh packages. `--no-frozen-lockfile` is needed because pnpm freezes the lockfile in CI. This touches only the deploy check, not the playground's Download.
- **Which imports count:** only `.ts`/`.js` files (including `.mts`/`.cjs` and the like), not contracts. Type-only and dynamic imports count. A subpath counts as its package (`@rocketh/diamond/types` is `@rocketh/diamond`). Relative paths, absolute paths and Node built-ins are ignored. A package listed in any dependency field (dependencies, dev, peer, optional) counts as present. The scan is a regex, so an import-like string inside a comment would also count; none of the current examples has one.
- **CI trigger:** the one-path edit to `.github/workflows/test.yml` described above.
