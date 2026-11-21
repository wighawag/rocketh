---
title: 'Playground examples: deploy each example without the starting project''s Counter, and say so, together with the site that opens them that way'
slug: playground-examples-bare-base
blockedBy: []
covers: []
---

Part of spec `bare-starting-project`, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/bare-starting-project.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground). Spec stories covered: 2, 6. Its other tasks are on rocketh-playground's board.

Staged in `work/tasks/backlog/` on purpose: it is blocked, in other repositories, by rocketh-playground's `project-link-bare-base` and by `rocketh-website-bare-base` (built in rocketh-website, filed on rocketh-playground's board), which a `blockedBy` here cannot express. Promote it once both are merged AND play.rocketh.dev has served `project-link-bare-base` for at least a day: the playground that was live before it refuses a link carrying `base` and drops it from the URL, and a returning visitor's service worker serves a cached build on the first load, so this wait is what protects the rollout (spec, "Order of landing").

## What to build

"Open in playground" links will open an example without the starting project's Counter sample (rocketh-website's `base: "bare"`). This task makes rocketh match, in ONE pull request, so the page, the link and the check never disagree on rocketh.dev, which deploys this repository's content as soon as it lands:

1. **The deploy check.** `scripts/test-playground-examples.sh`: after copying the published `hardhat-deploy init` project and before writing an example over it, remove `contracts/Counter.sol`, `deploy/01_deploy_counter.ts`, `contracts/Counter.t.sol` and `test/Counter.ts`, failing (naming the file) if any of them is missing from the template, so a template change is noticed rather than absorbed. Its comment names the playground's definition of the bare base (`bareProject()` in rocketh-playground's `web/src/lib/playground/project/template.ts`), so a change is made in both. Every example still deploys.
2. **The convention.** `examples/playground/README.md`: replace "The starting project's own files stay" with what is now true (an example opens without `contracts/Counter.sol` and `deploy/01_deploy_counter.ts`; it keeps the starting `rocketh/config.ts` and `rocketh/deploy.ts` unless it has its own; an example that wants `Counter` carries the files itself), and update every other sentence that assumes the Counter files stay: that the playground writes the example's files over the starting project, that nothing is deployed before an example "but what its own scripts and the starting project's scripts deploy", and "The checks" description of `pnpm test:docs:playground-examples` (it now removes the four Counter files first, failing if one is missing).
3. **The page.** The `documentation/deploy-scripts/` paragraph about the button: the playground opens the example's files over the starting project's config, without its `Counter` sample.
4. **The pin.** Move `ROCKETH_WEBSITE_REF` in `.github/workflows/deploy.yml` to the rocketh-website commit named by `rocketh-website-bare-base`'s report (or that repository's main once it holds it), and say in the PR what it was verified against, as the earlier pin moves do (`git log -- .github/workflows/deploy.yml`): `pnpm test:e2e` in rocketh-website's `web/` at the old and the new commit, against a built checkout of this branch (`pnpm i --frozen-lockfile`, `NX_SKIP_NX_CACHE=true pnpm docs:widgets`). This workflow change is the one the spec's landing order asks for; it is approved when the maintainer promotes this task.

No changeset: no package changes.

## Acceptance criteria

- [ ] `pnpm test:docs:playground-examples` deploys every example without the four Counter files, and fails naming the file when one of them is missing from the template (shown in the task's final report, not committed).
- [ ] `examples/playground/README.md` and the `documentation/deploy-scripts/` paragraph describe the bare base.
- [ ] `ROCKETH_WEBSITE_REF` points at a rocketh-website commit that writes `base: "bare"`, and the PR says what it was verified against.
- [ ] `pnpm test`, `pnpm format:check` and `pnpm docs:build` pass; `verify` (dorfl.json) passes.

## Blocked by

- rocketh-playground `project-link-bare-base` (other repository), served on play.rocketh.dev for at least a day.
- `rocketh-website-bare-base` (rocketh-website, filed on rocketh-playground's board).

## Prompt

> Goal: rocketh's half of spec `bare-starting-project`: the bare deploy check, the README and page that describe it, and the pin that makes rocketh.dev write bare links, in one pull request. Read the spec, which lives in github.com/wighawag/rocketh-playground at `work/specs/tasked/bare-starting-project.md` (read it from that repository's origin/main; local ~/dev/github/wighawag/rocketh-playground), then `AGENTS.md`, `examples/playground/README.md`, `scripts/test-playground-examples.sh`, `documentation/deploy-scripts/index.md`, `.github/workflows/deploy.yml` and the done records of the earlier `playground-examples-*` tasks. Done means the acceptance criteria hold and `verify` passes.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code, `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? In particular, confirm that rocketh-playground's `project-link-bare-base` and `rocketh-website-bare-base` are in that repository's `work/tasks/done/`. If a dependency landed differently than this task assumes, do NOT build on the stale premise: stop and report the discrepancy (WORK-CONTRACT "Drift is a needs-attention signal").
>
> The repositories are public: no file, pull request or commit message names a funder, a grant, a milestone or a report; describe a change by what it does for a user. Never write em dashes; do not hard-wrap Markdown prose. Bound every shell command with `timeout`, stop any server you start, and never send a transaction.
>
> RECORD non-obvious in-scope decisions you make while building in a `## Decisions` block at the end of your FINAL REPORT. When the task did not specify some behaviour and you had to choose, say what you chose and why. Do not write the done record, the commit message or the PR body yourself.
