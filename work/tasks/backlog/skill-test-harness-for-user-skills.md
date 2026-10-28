---
title: 'A test harness that keeps every agent skill true to the code'
slug: skill-test-harness-for-user-skills
spec: agent-skill-for-rocketh-users
blockedBy: []
covers: [8]
---

## What to build

Generalise `packages/hardhat-deploy/test/migration-pairs/skill.test.ts` (which keeps `skills/hardhat-deploy-migration/SKILL.md` equal to its migration pairs) into a harness that runs over every folder under `skills/`, discovered from the file system, plus an empty fixture project for the user skills at `packages/hardhat-deploy/test/skill-fixtures/` (a miniature rocketh project like `migration-pairs/`: `rocketh/config.ts`, `rocketh/deploy.ts`, a mock-artifacts file, a harness on `createTestEnvironment`), compiled by `pnpm typecheck` and run by `pnpm test`. The two user skills it is built for (`rocketh-deploy`, `rocketh-safe-owned-changes`) do not exist yet; prove the harness on the migration skill and on a throwaway skill in a test fixture directory.

## Acceptance criteria

- [ ] Fixture markers: in a user skill, every `<!-- fixture: <path> -->` is followed by a fenced block equal to that file under `skill-fixtures/`; every TypeScript block in `SKILL.md` or `references/*.md` of a user skill is marked (an unmarked one fails); every file under `skill-fixtures/` that is a sample is included or named by some skill. The migration skill keeps its `<!-- migration-pair: -->` marker and its allowance for unmarked blocks, and its existing checks still pass unchanged.
- [ ] "User skill" is defined in one place in the harness: every folder under `skills/` except `hardhat-deploy-migration`.
- [ ] Links: every `https://rocketh.dev/<path>/` or `/<path>/#<anchor>` in any skill resolves to `<path>/index.md` in this repository, and the anchor to an explicit `{#id}` or a heading slug on that page. Links to `rocketh.dev/skills/` and to raw GitHub files are exempt.
- [ ] Flags: every `--flag` in a skill shell block is checked against the command on its own line: `rocketh` against `packages/rocketh-node/src/cli-options.ts`, `hardhat deploy` against the task options in `packages/hardhat-deploy/src/index.ts` (camelCase, kebab-cased before comparing), `rocketh-export` / `rocketh-verify` / `rocketh-doc` against their `src/cli.ts`. `npx`, `pnpm`, `anvil` and other commands rocketh does not own are exempt. A test shows `hardhat deploy --write-transactions` fails it.
- [ ] Frontmatter, checked statically (no CLI is run, no network, no new dependency): it parses, `name` equals the folder, `description` is 1 to 1024 characters; for user skills, the `SKILL.md` body is under 500 lines and `metadata.rocketh` is a `>=` semver range whose version is not above `packages/rocketh/package.json`.
- [ ] Export names: a user skill may declare, in a small table kept in the test, identifiers it attributes to a package (for example `deployViaProxy` from `@rocketh/proxy`); the test checks each is exported by that package's root. The table starts empty.
- [ ] The fixture project typechecks and an example fixture test runs; the harness reports a clear message naming the file and the rule for each failure.
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm format:check` pass.

## Blocked by

- None, can start immediately.

## Prompt

Goal: the mechanism that makes a skill fail the build when it stops being true. Start from `skill.test.ts` and the README in `packages/hardhat-deploy/test/migration-pairs/`; keep that test's behaviour for the migration skill. The fixtures cannot live in `rocketh`'s own tests (the nx cycle described under _test environment_ in `CONTEXT.md`); `packages/hardhat-deploy` already has `@rocketh/test-utils` and the extensions as dev dependencies, which is why the fixture project goes there. Exclude nothing from typecheck that a user skill will include. Done means the checks above exist, are discovered per folder, and are proven on the migration skill plus a throwaway skill used only by the harness's own tests.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. A change to a published package needs a changeset (`CONTEXT.md`, Conventions); a docs-only or skills-only change needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.
