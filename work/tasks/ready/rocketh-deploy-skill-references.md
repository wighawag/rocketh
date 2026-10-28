---
title: 'rocketh-deploy references: hardhat-deploy, the rocketh CLI, proxies and diamonds'
slug: rocketh-deploy-skill-references
spec: agent-skill-for-rocketh-users
blockedBy: [rocketh-deploy-skill-core]
covers: [1, 9]
---

## What to build

Add the `references/` files the core skill points to, each loaded only for the setup or pattern the project uses: `references/hardhat-deploy.md` (the `hardhat deploy` task and its flags, `hardhat-deploy/helpers` networks from the environment, `HARDHAT_FORK`, tests with `loadFixture`, typed artifacts, `hardhat-deploy init`), `references/rocketh-cli.md` (the `rocketh` command, `-e`, `--is-fork`, `--write-transactions`, a config without Hardhat), and `references/proxies.md` and `references/diamonds.md` (the decision rules for an upgrade: `upgradeIndex`, `execute` on upgrade, the diamond cut plan and its removals). Decision rules and links, not a copy of the pages.

## Acceptance criteria

- [ ] Each reference is linked from `skills/rocketh-deploy/SKILL.md` at the branch that needs it, one level deep.
- [ ] The differences between the two setups are stated once, in the reference for each, and the core skill carries none of them.
- [ ] Every TypeScript block is a fixture; every flag passes the harness against the right command (`--write-transactions` appears only with `rocketh`).
- [ ] The proxies reference states the storage-layout rule from the core skill by pointing to it, not repeating it; the diamonds reference tells the agent to read the printed cut plan, removals first, before an upgrade is approved (`documentation/production-hardening/`).
- [ ] Every identifier the references attribute to a package (for example `deployViaProxy` from `@rocketh/proxy`, `diamond` from `@rocketh/diamond`) is listed in `skill-fixtures/rocketh-deploy/exports.json`.
- [ ] Baseline prompts for each new branch are added next to the fixtures.
- [ ] An empty changeset is added: this task changes only `packages/hardhat-deploy/test/` inside `packages/` (plus `skills/`, which needs none).
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm format:check` pass.

## Blocked by

- `rocketh-deploy-skill-core`

## Prompt

Goal: the setup-specific and pattern-specific depth of rocketh-deploy, behind pointers so the core stays small. The frontmatter, description and baseline-loading rules below apply to `SKILL.md`; a `references/*.md` file has no frontmatter and is reached only through its link. Fixtures go under `skill-fixtures/rocketh-deploy/`.

How to write the skill (the maintainer's rules for anything an agent reads):

- The `description` is the always-loaded pointer: front-load the leading word, one trigger per distinct branch, nothing the body already says, no "Not for" clause. Routing to a sibling skill lives in the BODY, at the point the branch is reached.
- Use the repository's own leading words consistently: _deferred_, _unsignable_, _converge_, _rehearse_, _run-once_.
- State the target behaviour. A prohibition stays only as a hard guardrail (secrets, the hash at a pause), paired with the positive target.
- Steps end on a checkable completion criterion. On a live network a deployment is finished when a fork re-run of the same scripts sends nothing (it needs a node that can fork the network, and holds only when every privileged `execute` has a `guard`); on hardhat's in-memory network, which saves no records, it is the run succeeding.
- Link what the environment answers (`--help`, a docs page, the config); the body carries the judgement no page or command states. Put what only some branches need in `references/*.md` (one level deep). Keep `SKILL.md` under 500 lines.
- Every rule is tied to the docs page or code that makes it true (cite the page in the skill, link it as `https://rocketh.dev/<path>/#<anchor>`).
- Frontmatter: `name` equal to the folder, `description` (at most 1024 characters), and `metadata: {rocketh: '>=<version>'}` set to the version in `packages/rocketh/package.json`. The body tells the agent to compare that with the project's installed `rocketh` and, on an older install, to say so and read the repository at the tag `rocketh@<installed version>` instead of rocketh.dev.
- Every TypeScript block is preceded by `<!-- fixture: <path> -->` and is that file under `packages/hardhat-deploy/test/skill-fixtures/`, verbatim; each fixture is compiled and run, asserting the outcome the skill claims.
- Write one baseline prompt per branch of the skill (a realistic task a user would give an agent in a rocketh project, not a question about the rule), as Markdown files next to the fixtures. The maintainer runs them against a stock agent to prune lines it already gets right; running them is not part of this task.

Sources: `hardhat-deploy/` (deploy-task, networks, tests, typed-artifacts, getting-started), `documentation/reference/cli/`, `documentation/fork-runs/`, `documentation/proxies/`, `documentation/diamonds/`. Done means the four references exist, are reached from the core skill, and pass the harness.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.
