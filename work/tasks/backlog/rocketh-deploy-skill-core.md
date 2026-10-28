---
title: 'The rocketh-deploy skill: deciding, running and re-running deploy scripts'
slug: rocketh-deploy-skill-core
spec: agent-skill-for-rocketh-users
blockedBy: [document-proxy-upgrades-do-not-check-storage-layout, skill-test-harness-for-user-skills]
covers: [1, 4, 5, 6, 9, 11]
---

## What to build

Write `skills/rocketh-deploy/SKILL.md`, the skill an agent loads when a project uses hardhat-deploy v2 or rocketh (a `rocketh/config.ts`, `deployScript` files, `hardhat-deploy` ^2 or `rocketh` in `package.json`, which includes the Hardhat flavor of Scaffold-ETH 2) and the task is to write, run, re-run or upgrade a deploy script, or to verify or export afterwards. It encodes decision rules, not API reference (the docs are linked, not restated), with its samples as fixtures in `packages/hardhat-deploy/test/skill-fixtures/`. Its `references/` are a separate task, which also adds the links to them; this task writes no link to a file that does not exist yet.

## Acceptance criteria

- [ ] The description names both hardhat-deploy v2 and rocketh and front-loads the leading word; it has one trigger per branch and no "Not for" clause.
- [ ] Rule: re-running is how a deployment finishes and how an upgrade happens; a re-run redeploys only what changed (`documentation/deploy-contracts/`, "When does a re-run redeploy?"; `deploy-scripts/`, "A script must be safe to re-run"). A fixture shows a second run sends nothing.
- [ ] Rule: addresses come from deployment records (`env.get`, `deployments/<environment>/`) and named accounts (`deployment-records/`, `named-accounts/`).
- [ ] Rule: the user gives the yes on the environment and chain, whether at rocketh's confirmation or before the agent adds `--skip-prompts`, with or without a terminal (rocketh prints them and asks before a run, `packages/rocketh/src/executor/index.ts`; without a terminal it throws and names `--skip-prompts`, `packages/rocketh-node/src/environment/prompt.ts`; on hardhat's in-memory network the deploy task skips it, `packages/hardhat-deploy/src/tasks/deploy.ts`). `--reset` runs only when the user asked for it.
- [ ] Rule: keys and RPC URLs come from the environment (`MNEMONIC_<network>`, `ETH_NODE_URI_<network>`, the `SECRET` form, `hardhat-deploy/networks/`), and the agent never handles them; `linkedData` is public (`exporting-and-verifying/`).
- [ ] Rule: a script with an `id` that returns `true` is recorded and never run again, as a whole; it returns `true` only when everything in it has happened, and a script stays safe to re-run up to that point (`documentation/script-lifecycle/`).
- [ ] What rocketh does not do: no built-in `live` tag (`environments/`, "Tags"); no storage-layout check on an upgrade (the page added by the blocking task); `rocketh-export` does not touch the chain without `--verify`.
- [ ] On an unsignable `from` (a pause, `UnknownSignerError`), and for a deployment to a live network that should be rehearsed on a fork first, the body routes to `rocketh-safe-owned-changes` by name AND by its raw URL (`https://raw.githubusercontent.com/wighawag/rocketh/main/skills/rocketh-safe-owned-changes/SKILL.md`), so an agent that loaded this skill through the one-line prompt can follow it.
- [ ] Every identifier the skill attributes to a package (for example `deploy` from `@rocketh/deploy`) is listed in the harness's export table.
- [ ] Baseline prompts, one per branch, are written next to the fixtures.
- [ ] The harness passes on the new skill: markers, links, flags, frontmatter, `metadata.rocketh`.
- [ ] An empty changeset is added: this task changes only `packages/hardhat-deploy/test/` inside `packages/` (plus `skills/`, which needs none).
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm format:check` pass.

## Blocked by

- `document-proxy-upgrades-do-not-check-storage-layout`
- `skill-test-harness-for-user-skills`

## Prompt

Goal: the core rocketh-deploy skill, small and judgement-dense, true by construction.

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

Read the cited docs pages before writing each rule and cite them. Put fixtures only under `skill-fixtures/rocketh-deploy/` (the shared helpers belong to the harness task; if one is missing, add it under `_shared/` in the smallest change and say so in the Decisions block). Write fixtures that exercise the rule, not just compile (a re-run sends nothing; an address comes from `get`). Done means the skill and its fixtures pass the harness and the checks above.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.
