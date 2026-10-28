---
title: 'Pull request to ethskills: Scaffold-ETH 2 Hardhat flavor runs on hardhat-deploy v2 and rocketh'
slug: ethskills-pull-request-pointing-to-rocketh-deploy
spec: agent-skill-for-rocketh-users
humanOnly: true
blockedBy: [rocketh-deploy-skill-core, rocketh-website-serves-skill-files]
covers: [10]
---

## What to build

Open a pull request to github.com/austintgriffith/ethskills that corrects `orchestration/SKILL.md`, which states as true of Scaffold-ETH 2 in general that "`yarn verify` replays `broadcast/run-latest.json`, so run it from the checkout that did the deploy" and that the working key is in `packages/foundry/.env.example`. Both are Foundry-flavor facts. In the Hardhat flavor, `yarn verify` calls `rocketh-verify`, which reads the deployment records and works from any machine that has them. The PR also points to the `rocketh-deploy` skill, naming hardhat-deploy, since that is what Scaffold-ETH 2's Hardhat users see.

## Acceptance criteria

- [ ] The PR follows ethskills' `CONTRIBUTING.md` (baseline-test the change against a stock model, classify each line) and cites the Scaffold-ETH 2 files (`packages/hardhat/package.json`, `scripts/runVerify.ts`) at a commit.
- [ ] It links `https://rocketh.dev/skills/rocketh-deploy/SKILL.md`.

## Blocked by

- `rocketh-deploy-skill-core`
- `rocketh-website-serves-skill-files`

## Prompt

`humanOnly` because it is a public action in a third-party repository, opened by the maintainer or with the maintainer's explicit go-ahead. The evidence is in `work/notes/findings/ethskills-structure-coverage-and-reuse.md` (Coverage); re-check it against the current ethskills and Scaffold-ETH 2 `main` before opening. A courtesy and a discovery path; nothing in this repository waits for it.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. A change to a published package needs a changeset (`CONTEXT.md`, Conventions); a docs-only or skills-only change needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.
