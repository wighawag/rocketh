---
title: 'hardhat-deploy init writes an AGENTS.md that tells the agent the skills exist'
slug: hardhat-deploy-init-writes-informing-agents-md
spec: agent-skill-for-rocketh-users
blockedBy: [rocketh-deploy-skill-core, rocketh-safe-owned-changes-skill, working-with-an-ai-agent-docs-page]
covers: [7, 10]
---

## What to build

`hardhat-deploy init` copies `packages/hardhat-deploy/templates/basic/` into a new project. Add `templates/basic/AGENTS.md` with the informing text, so an agent opening a new project learns the rocketh skills exist and tells the user, who decides whether to install them. It loads nothing. The user can delete the file. It also sits inside this repository as a nested `AGENTS.md`, so an agent editing the template reads it; that is harmless, since it describes the project the template scaffolds, and needs no change.

> FORWARD-POINTER (from the drive that landed `working-with-an-ai-agent-docs-page`): `documentation/agent-skills/index.md`, section "A line for your project's AGENTS.md", now carries the fragment. Make `templates/basic/AGENTS.md` the SAME text and the SAME shape as that fragment: the mandated sentence, then a `## Project notes` heading with the HTML-comment placeholder naming who approves a privileged change, so users see one wording. That page deliberately does not yet say that `hardhat-deploy init` writes this file, because it was not true when the page landed. In this task, add one sentence to that section saying a project made with `hardhat-deploy init` already has it. Keep it a single-line paragraph, and run `pnpm docs:build` if a rocketh-website checkout is available.

## Acceptance criteria

- [ ] The template contains `AGENTS.md` with: "This project deploys with hardhat-deploy v2 and rocketh. If the rocketh skills are not available to you, tell the user they exist and how to install them (`npx skills add wighawag/rocketh`, or the one-line prompt at https://rocketh.dev/documentation/agent-skills/)." and a short, empty section for project-specific notes (who approves a privileged change).
- [ ] A test asserts the file is in `templates/basic/`, contains the install command and the docs page URL, and is NOT excluded by the template's own `.gitignore` filter that `init` applies when copying (use `createIgnoreFilter` / `parseGitignore` from `src/utils/gitignore.ts`, as `gitignore.test.ts` does; `generateProject` is private to the bin script, so do not import `cli.ts`).
- [ ] The file is included in what the package publishes (`files` already lists `templates`; confirm `init` copies it into the new project).
- [ ] A changeset for `hardhat-deploy` (minor: the scaffold gains a file).
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm format:check` pass.

## Blocked by

- `rocketh-deploy-skill-core`
- `rocketh-safe-owned-changes-skill`
- `working-with-an-ai-agent-docs-page` (the template links that page and uses the same fragment text)

## Prompt

Goal: the discovery path for new projects, respecting the user's consent: the file informs, it does not load. Read `packages/hardhat-deploy/src/cli.ts` (the `init` command) and `init-template.test.ts` first. Keep the text identical to the fragment on the docs page task, so a user sees one wording. Done means a fresh `init` writes the file and the test proves it.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.

## Decisions

- **The docs page is the single source of the wording, and a test enforces it.** The second new test reads `documentation/agent-skills/index.md` and requires the template file to equal the fenced fragment exactly. I chose this so the "one wording" requirement fails a test when broken, rather than relying on someone remembering. The alternative was to check only the install command and URL, which is all the acceptance criteria ask for. The cost is that any rewording of the fragment on the docs page now also needs the template edited, or `hardhat-deploy`'s tests go red. It touches the docs page and the template only.
- **Placement of the new docs sentence.** I made it its own single-line paragraph, between the intro paragraph and the fragment, rather than adding it to the end of the intro paragraph. That keeps the intro's "paste this" instruction separate from the note that `init` users already have the file.
