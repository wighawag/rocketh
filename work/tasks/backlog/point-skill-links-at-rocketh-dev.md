---
title: 'Point the skill links at rocketh.dev once the site serves them'
slug: point-skill-links-at-rocketh-dev
spec: agent-skill-for-rocketh-users
blockedBy:
  [
    working-with-an-ai-agent-docs-page,
    hardhat-deploy-init-writes-informing-agents-md,
    rocketh-website-serves-skill-files,
  ]
covers: [10]
---

## What to build

Replace every raw GitHub link to a skill (`https://raw.githubusercontent.com/wighawag/rocketh/main/skills/...`) with its `https://rocketh.dev/skills/<name>/SKILL.md` equivalent: the "Working with an AI agent" page (install paths and fragment), the `AGENTS.md` template `hardhat-deploy init` writes if it links a skill file directly, and anywhere else the repository links them.

## Acceptance criteria

- [ ] No raw GitHub skill link remains in `documentation/`, `hardhat-deploy/`, `packages/hardhat-deploy/templates/` or the READMEs (grep to confirm).
- [ ] The init-template test is updated if it asserts the URL.
- [ ] A changeset for `hardhat-deploy` (patch) since the template changes.
- [ ] `pnpm test`, `pnpm format:check` pass; `pnpm docs:build` passes when a rocketh-website checkout is available.

## Blocked by

- `working-with-an-ai-agent-docs-page`
- `hardhat-deploy-init-writes-informing-agents-md`
- `rocketh-website-serves-skill-files`

## Prompt

Goal: a mechanical link switch after the website task lands. Check the URLs actually serve the files first; if they do not, route this task to needs-attention instead of switching. Done means every link points at rocketh.dev and the checks pass.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. A change to a published package needs a changeset (`CONTEXT.md`, Conventions); a docs-only or skills-only change needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.
