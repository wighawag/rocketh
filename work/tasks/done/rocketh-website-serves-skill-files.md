---
title: 'rocketh.dev serves the skill files at /skills/<name>/SKILL.md'
slug: rocketh-website-serves-skill-files
spec: agent-skill-for-rocketh-users
humanOnly: true
blockedBy: [rocketh-deploy-skill-core, rocketh-safe-owned-changes-skill, rocketh-deploy-skill-references]
covers: [10]
---

## What to build

In the separate rocketh-website repository (github.com/wighawag/rocketh-website), serve each `skills/<name>/SKILL.md` and `skills/<name>/references/*.md` of this repository as raw Markdown (`text/markdown`) at `https://rocketh.dev/skills/<name>/SKILL.md`, the way the site already reads `documentation/` and `hardhat-deploy/` from this repository.

## Acceptance criteria

- [ ] `https://rocketh.dev/skills/rocketh-deploy/SKILL.md` and `https://rocketh.dev/skills/rocketh-safe-owned-changes/SKILL.md` return the files raw, with their `references/`.
- [ ] In this repository, `.github/workflows/deploy.yml` moves its pinned `ROCKETH_WEBSITE_REF` to the website commit that serves the files, and its `pull_request.paths` gains `skills/**` so a skill change rebuilds the site.

## Blocked by

- `rocketh-deploy-skill-core`
- `rocketh-safe-owned-changes-skill`
- `rocketh-deploy-skill-references`

## Prompt

`humanOnly` because the work is in another repository, which the runner does not operate on. Done means the URLs above serve the current files from `main`; then promote `point-skill-links-at-rocketh-dev`.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.

## Decisions

- **Built by an agent on the maintainer's explicit instruction** (the task is `humanOnly` because it spans the rocketh-website repository and the deploy workflow). The site change is rocketh-website PR #6, merged as `704441d3abace364df3a0e380b8af15428371e52`, which this change pins.
- **The skills are client-build assets, not pages.** A site-specific Vite plugin (`rocketh-skills` in `web/vite.plugins.ts`) emits every `skills/<name>/SKILL.md` and `skills/<name>/references/*.md` of the rocketh checkout into the build unchanged, so any skill added later is served with no site change. GitHub Pages serves `.md` as `text/markdown; charset=utf-8`. The alternative, a generic "extra raw folder" option in the docs engine, would have had to go to the template first.
- **The pin also brings in the website commits since the previous pin** (the draft-article change), and a fix to the site's e2e suite, whose `::: containers` test named a page that no longer has a `::: danger` container.
