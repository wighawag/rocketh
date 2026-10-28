---
title: 'A "Working with an AI agent" documentation page, linked where users start'
slug: working-with-an-ai-agent-docs-page
spec: agent-skill-for-rocketh-users
blockedBy: [rocketh-deploy-skill-core, rocketh-safe-owned-changes-skill]
covers: [7, 10]
---

## What to build

Add `documentation/agent-skills/index.md` (title "Working with an AI agent") listing the three skills and when each is used, and the two ways a user installs them, both by their own action and both usable before a project exists: `npx skills add wighawag/rocketh` (into the project, or user-wide with `-g`), and a one-line prompt for an agent without skills support, "Read <raw GitHub URL of skills/rocketh-deploy/SKILL.md> and follow it before deploying". It also carries the `AGENTS.md` fragment for pasting into an existing project (the same text `hardhat-deploy init` writes), and says that the skills follow `main` and state the `rocketh` version they were written for. Add it to `documentation/_sidebar.yaml`; link it from `documentation/getting-started/`, `hardhat-deploy/getting-started/`, the root `README.md` (which `rocketh` copies into its package at publish, `packages/rocketh/package.json` `prepublishOnly`; `packages/rocketh/README.md` itself is gitignored) and `packages/hardhat-deploy/README.md`; and add a pointer to `rocketh-deploy` in the body of `skills/hardhat-deploy-migration/SKILL.md` for the work after a port.

## Acceptance criteria

- [ ] The page states that nothing is installed into the user's agent environment without their action, and why (ADR 0017), in one sentence.
- [ ] The `AGENTS.md` fragment text is: "This project deploys with hardhat-deploy v2 and rocketh. If the rocketh skills are not available to you, tell the user they exist and how to install them (`npx skills add wighawag/rocketh`, or the one-line prompt at https://rocketh.dev/documentation/agent-skills/)." followed by a place for what no file in the project says (who approves a privileged change).
- [ ] All skill links use `https://raw.githubusercontent.com/wighawag/rocketh/main/skills/<name>/SKILL.md` (a later task switches them to rocketh.dev).
- [ ] The migration skill's harness checks still pass after the pointer is added.
- [ ] `pnpm format:check` passes; `pnpm docs:build` passes when a rocketh-website checkout is available.
- [ ] A changeset for `rocketh` and `hardhat-deploy` (patch, README only) is added, since their READMEs ship in the packages (the root README reaches npm as `rocketh`'s).

## Blocked by

- `rocketh-deploy-skill-core`
- `rocketh-safe-owned-changes-skill`

## Prompt

Goal: the one place a user learns the skills exist and how to install them. Keep it short; it is a page of facts, not a tutorial. Follow the style of the neighbouring docs pages. Done means the page exists, is in the sidebar, is linked from the two getting-started pages and the two READMEs, and the docs build is green.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.

## Decisions

- **The page does not yet say "this is the same text `hardhat-deploy init` writes".** Why: `hardhat-deploy-init-writes-informing-agents-md` is still in `ready/` and is blocked by this task, so a published page saying that would be false until it lands. Alternative: write the sentence now, ahead of the code. Touches: that init task, which should add a line saying a project made with `hardhat-deploy init` already has the fragment, and keep the wording identical.
- **The fragment's place for project-specific notes is a `## Project notes` heading with an HTML-comment placeholder.** Why: the task asks for "a place" without fixing its shape; a comment keeps it empty but self-explaining when pasted. Alternative: a bulleted placeholder or plain prose. Touches: the init task's template `AGENTS.md`, which should use the same shape so users see one wording.
- **Sidebar placement is "Start", after "Get started without Hardhat"**, and only in the `documentation/` sidebar as the task says, not in `hardhat-deploy/_sidebar.yaml`. Why: it is a starting point for both setups, and the hardhat-deploy getting-started page links to it. Alternative: the "Guides" group, or listing it in both sidebars.
- **The migration skill's pointer is a new final `## After the port` section** after "Summary", not added to the skill's table of contents ("Summary" isn't listed there either). Why: that is where the port ends and the follow-on work starts.
