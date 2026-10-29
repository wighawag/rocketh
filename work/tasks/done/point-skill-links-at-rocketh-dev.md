---
title: 'Point the skill links at rocketh.dev once the site serves them'
slug: point-skill-links-at-rocketh-dev
spec: agent-skill-for-rocketh-users
blockedBy:
  - working-with-an-ai-agent-docs-page
  - hardhat-deploy-init-writes-informing-agents-md
  - rocketh-website-serves-skill-files
  - rocketh-deploy-skill-references
covers: [10]
---

## What to build

Replace every raw GitHub link to a skill (`https://raw.githubusercontent.com/wighawag/rocketh/main/skills/...`) with its `https://rocketh.dev/skills/<name>/SKILL.md` equivalent: the "Working with an AI agent" page (install paths and fragment), the `AGENTS.md` template `hardhat-deploy init` writes if it links a skill file directly, and anywhere else the repository links them.

## Acceptance criteria

- [ ] No raw GitHub skill link remains in `documentation/`, `hardhat-deploy/`, `skills/` (the sibling-skill URLs inside the skills themselves), `packages/hardhat-deploy/templates/` or the READMEs (grep to confirm).
- [ ] The init-template test is updated if it asserts the URL.
- [ ] A changeset for `hardhat-deploy` (patch) only if the template changes; none otherwise.
- [ ] `pnpm test`, `pnpm format:check` pass; `pnpm docs:build` passes when a rocketh-website checkout is available.

## Blocked by

- `working-with-an-ai-agent-docs-page`
- `hardhat-deploy-init-writes-informing-agents-md`
- `rocketh-website-serves-skill-files`
- `rocketh-deploy-skill-references`

## Prompt

Goal: a mechanical link switch after the website task lands. Check the URLs actually serve the files first; if they do not, route this task to needs-attention instead of switching. Done means every link points at rocketh.dev and the checks pass.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.

## Decisions

- **The GitHub file-view (`blob`) skill links were switched too, not only the raw ones.** The acceptance criterion names only raw GitHub links, but the goal says "every link points at rocketh.dev", and those links also go to a `SKILL.md` given to an AI agent. It touches `hardhat-deploy/migration/index.md`, `hardhat-deploy/migration/step-by-step/index.md` and `packages/hardhat-deploy/README.md`. The alternative was to leave them, since GitHub's file view renders the Markdown for a human reader, which the plain `text/markdown` file on rocketh.dev does not. It is a one-line revert per link.
- **A `hardhat-deploy` patch changeset for a README-only link change.** The README ships in the npm package, and the `verify` gate counts the package as changed. The task asks for a changeset only if the template changes, so this goes slightly past it. I chose patch over an empty changeset because, per `CONTEXT.md`, an empty changeset left alone on `main` silently blocks publishing. A minor changeset (`hardhat-deploy-init-agents-md`) is already pending for the same package, so this adds no extra release.
