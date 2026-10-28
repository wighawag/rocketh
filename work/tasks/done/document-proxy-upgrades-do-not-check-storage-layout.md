---
title: 'Document that a proxy upgrade does not check storage-layout compatibility'
slug: document-proxy-upgrades-do-not-check-storage-layout
spec: agent-skill-for-rocketh-users
blockedBy: []
covers: [11]
---

## What to build

The proxies page says what `deployViaProxy` does on an upgrade but not what it does NOT do: it compares the implementation in the proxy's EIP-1967 slot with the one it resolved and upgrades when they differ, and it never checks that the new implementation's storage layout is compatible with the old one. A user (or an agent) can assume it does. Add that statement, with what to do instead (check the layout yourself, for example with a layout-diff tool, and rehearse the upgrade on a fork), to `documentation/proxies/`, in the "Upgrading" section. The `rocketh-deploy` skill will cite it.

## Acceptance criteria

- [ ] `documentation/proxies/index.md` states that an upgrade through `deployViaProxy` (and a diamond cut, if the same holds for `@rocketh/diamond`: check the code) performs no storage-layout compatibility check, and says what the user does instead.
- [ ] The statement is verified against `packages/rocketh-proxy/src/index.ts` (and `packages/rocketh-diamond/src/` for the diamond half), not inferred.
- [ ] `pnpm format:check` passes, and `pnpm docs:build` passes when a rocketh-website checkout is available (see `CONTRIBUTING.md`, "The documentation site").

## Blocked by

- None, can start immediately.

## Prompt

Goal: one short, precise addition to the proxies page so the documentation says that rocketh does not validate storage layout on an upgrade. Read the upgrade path in `@rocketh/proxy` (the comparison against the EIP-1967 implementation slot) and confirm nothing inspects `storageLayout`; do the same for diamonds before mentioning them. Keep it to what the code shows. Done means the page states it, in the "Upgrading" section, and the docs build is green.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.

## Decisions

- **Where the paragraph goes:** directly after the paragraph that states the append-only rule, so "rocketh does not check that rule for you" refers to the rule just stated. The alternative was a separate note further down the Upgrading section, where it would be read apart from the rule it qualifies. This touches only this page.
- **The diamond half is one sentence on the proxies page, linking to the diamonds page, rather than an edit to `documentation/diamonds/index.md`:** the acceptance criterion names only `documentation/proxies/index.md`. The diamonds page could get its own sentence later if the skill needs to cite it there.
