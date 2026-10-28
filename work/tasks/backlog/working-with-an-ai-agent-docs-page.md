---
title: 'A "Working with an AI agent" documentation page, linked where users start'
slug: working-with-an-ai-agent-docs-page
spec: agent-skill-for-rocketh-users
blockedBy: [rocketh-deploy-skill-core, rocketh-safe-owned-changes-skill]
covers: [7, 10]
---

## What to build

Add `documentation/agent-skills/index.md` (title "Working with an AI agent") listing the three skills and when each is used, and the two ways a user installs them, both by their own action and both usable before a project exists: `npx skills add wighawag/rocketh` (into the project, or user-wide with `-g`), and a one-line prompt for an agent without skills support, "Read <raw GitHub URL of skills/rocketh-deploy/SKILL.md> and follow it before deploying". It also carries the `AGENTS.md` fragment for pasting into an existing project (the same text `hardhat-deploy init` writes), and says that the skills follow `main` and state the `rocketh` version they were written for. Add it to `documentation/_sidebar.yaml`; link it from `documentation/getting-started/`, `hardhat-deploy/getting-started/`, `packages/rocketh/README.md` and `packages/hardhat-deploy/README.md`; and add a pointer to `rocketh-deploy` in the body of `skills/hardhat-deploy-migration/SKILL.md` for the work after a port.

## Acceptance criteria

- [ ] The page states that nothing is installed into the user's agent environment without their action, and why (ADR 0017), in one sentence.
- [ ] The `AGENTS.md` fragment text is: "This project deploys with hardhat-deploy v2 and rocketh. If the rocketh skills are not available to you, tell the user they exist and how to install them (`npx skills add wighawag/rocketh`, or the one-line prompt at https://rocketh.dev/documentation/agent-skills/)." followed by a place for what no file in the project says (who approves a privileged change).
- [ ] All skill links use `https://raw.githubusercontent.com/wighawag/rocketh/main/skills/<name>/SKILL.md` (a later task switches them to rocketh.dev).
- [ ] The migration skill's harness checks still pass after the pointer is added.
- [ ] `pnpm format:check` passes; `pnpm docs:build` passes when a rocketh-website checkout is available.
- [ ] A changeset for `rocketh` and `hardhat-deploy` (patch, README only) is added, since their READMEs ship in the packages.

## Blocked by

- `rocketh-deploy-skill-core`
- `rocketh-safe-owned-changes-skill`

## Prompt

Goal: the one place a user learns the skills exist and how to install them. Keep it short; it is a page of facts, not a tutorial. Follow the style of the neighbouring docs pages. Done means the page exists, is in the sidebar, is linked from the two getting-started pages and the two READMEs, and the docs build is green.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. A change to a published package needs a changeset (`CONTEXT.md`, Conventions); a docs-only or skills-only change needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.
