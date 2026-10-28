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

## Decisions

- **New contracts in the shared artifacts file.** I added five mock contracts to `_shared/artifacts.ts` (`Vault`, `CounterV1`, `CounterV2`, `CounterFacet`, `AdminFacet`), appended without touching the existing two. This file is outside `skill-fixtures/rocketh-deploy/`. The README says a missing shared helper goes in `_shared/` in the smallest change. The alternative was artifacts inside the fixture folder, but the harness would require any non-test TypeScript file there to be shown or named by a skill.
- **A separate mini project for the upgrade fixtures.** The proxy and diamond fixtures live in `rocketh-deploy/upgrades/` with their own `rocketh/config.ts` and `rocketh/deploy.ts`, which add the proxy and diamond extensions. Changing the core fixture config would have changed the config block shown verbatim in `SKILL.md`. The two files are named in an HTML comment at the end of `proxies.md`, as the core does for its own `deploy.ts`, and the fixtures README now describes subfolders like this one.
- **How the mock chain is modelled.** The proxy test answers the EIP-1967 implementation slot from the `implementation` in the proxy's latest record. The diamond test answers `facets()` from the diamond's latest record. Both read a thin wrapper around the in-memory store. In other words, the chain holds what the last completed run set up, with nothing deferred. The other option was to decode proxy constructor data or rely on the mock's address counter, which is more fragile.
- **The diamond test calls the script directly.** It calls `03_game.ts` with the node's environment instead of going through `executeScripts`, so it can capture the printed plan and check it came before the cut. The shared executor gives no access to the environment's messages.
- **No TypeScript in the two setup references.** The things they would show (hardhat config, a test fixture, a config using `privateKey`) need Hardhat at runtime or `@rocketh/signer`, which is not a dependency of hardhat-deploy, and adding it needs approval. They link the pages instead. The sibling skill's fixture already tests the fork chain-id declaration.
- **Statements that go one step past the docs.** Two follow from documented behaviour without a page saying them outright, and the third is a recommendation:
  - `onUpgrade` (in both proxies and diamonds) is made on every later upgrade, so a migration step must be safe to repeat or be replaced with the next version.
  - A live endpoint under the `rocketh` command should be read from `process.env`. The core skill already claimed this.
  - When the endpoint is a Hardhat `SECRET`, ask the user to start the fork node.

  No docs page was changed. A reviewer may want a docs line for each of these first.
