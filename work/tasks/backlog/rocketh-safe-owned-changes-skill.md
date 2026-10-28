---
title: 'The rocketh-safe-owned-changes skill: steps rocketh cannot sign for'
slug: rocketh-safe-owned-changes-skill
spec: agent-skill-for-rocketh-users
blockedBy: [skill-test-harness-for-user-skills]
covers: [2, 3, 6]
---

## What to build

Write `skills/rocketh-safe-owned-changes/SKILL.md`, loaded on _unsignable_: a step's `from` is an account rocketh cannot sign for, the run paused with `Unknown signer for account` or threw `UnknownSignerError`, or a privileged change is to be rehearsed on a fork. It teaches rocketh's native path only: under the default policy `auto`, the pause when a terminal is attached and `throw` when unattended; a `guard` so the re-run converges; a fork rehearsal with captured transactions for the whole batch. `catchUnknownSigner` is not taught: a script that already calls it is sent to `https://rocketh.dev/hardhat-deploy/migration/#catch-unknown-signer`.

## Acceptance criteria

- [ ] The description leads with _unsignable_, one trigger per branch, no "Not for" clause.
- [ ] Rule: a deferred step did not happen; under `throw` the run aborts at that step and records nothing (`documentation/unknown-signers/`, "A run that threw will hand you the same transaction again"); the agent reports the printed transaction to the user verbatim as outstanding, and the deployment as unfinished. A fixture asserts a deferred step leaves no deployment record and no run-once entry.
- [ ] Rule: the hash at a pause, and the answer to the "different call" question, come from the user who executed the transaction (`unknown-signers/`, accepted residual risk), with or without a terminal.
- [ ] Rule: finishing after a deferral is a re-run, from a terminal with the hash the user already has ("A hash from an earlier run is still good"), or unattended once a `guard` lets the re-run see the effect. A fixture asserts a re-run after the Safe acted sends nothing.
- [ ] Rule: a privileged `execute` carries a `guard` (`execute-guard/`); when the owner is a governance contract, the printed `{to, data}` is a proposal's action; for a `TimelockController`, an account with the proposer role sends `schedule(...)` and later `execute(...)` with it, outside rocketh (`unknown-signers/`, "When the owner is governance, not a multisig").
- [ ] Rule: a stop is resolved by the account that holds the authority; `autoImpersonate` and `onUnknownSigner` stay as the project configured them for a live network; when the admin must stay external, the script asserts it with `env.addressSignability` (`production-hardening/`, `unknown-signers/`).
- [ ] The rehearsal: `--is-fork` or `HARDHAT_FORK`, `environments.<name>.chain` for a hardhat fork that reports 31337, records read and not written, `--write-transactions` on the `rocketh` command only, `fundImpersonatedAccounts` (`fork-runs/`, step 4 of `safe-owned-project/`).
- [ ] Every identifier the skill attributes to a package (for example `withUnknownSignerPolicy` from `@rocketh/unknown-signer`, if it is taught) is listed in `skill-fixtures/rocketh-safe-owned-changes/exports.json`.
- [ ] Baseline prompts, one per branch, are written next to the fixtures.
- [ ] The harness passes on the new skill.
- [ ] An empty changeset is added: this task changes only `packages/hardhat-deploy/test/` inside `packages/` (plus `skills/`, which needs none).
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm format:check` pass.

## Blocked by

- `skill-test-harness-for-user-skills`

## Prompt

Goal: the skill for the expensive half of deploying, where a wrong move spends money or hands a governance action to the wrong place.

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

Put fixtures only under `skill-fixtures/rocketh-safe-owned-changes/`, using the harness's shared executor driver and signability helpers (if one is missing, add it under `_shared/` in the smallest change and say so in the Decisions block). Build fixtures with an unsignable named account (`documentation/extending/testing/`, "Constructing each signability"), so the deferral and convergence claims are executed, not asserted. Done means the skill and its fixtures pass the harness and the checks above.

Read `AGENTS.md`, `CONTEXT.md` and ADR 0017 (`docs/adr/0017-agent-skills-for-users-are-installed-by-the-user-from-one-source.md`) first. The background is spec `agent-skill-for-rocketh-users` (`work/specs/tasked/`) and the research finding `work/notes/findings/ethskills-structure-coverage-and-reuse.md`. The documentation in `documentation/` and `hardhat-deploy/` (published as rocketh.dev) is the source of truth a skill must agree with: when a skill would say something no page says, the page changes first. The repository is public: no names of people, employers or funders. Never write em dashes; write Markdown paragraphs as single lines. Changesets (`CONTEXT.md`, Conventions): a change to what a published package ships needs a real one; a change that touches only a package's tests still counts as a changed package for the `verify` gate (`changeset status --since=main`), so it needs an EMPTY changeset; a change outside `packages/` (docs, `skills/`, `work/`) needs none.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): does it still match the code in `work/tasks/done/`, the relevant ADRs, and the tasks it depends on? If a dependency landed differently than this task assumes, do NOT build on the stale premise: route the task to needs-attention with the discrepancy as the reason (WORK-CONTRACT.md "Drift is a needs-attention signal").

RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT (the one sanctioned channel; the runner transcribes it into the done record). Do not write the done record, commit message or PR body yourself, and do not open a decisions note. A decision that meets the ADR gate (`work/protocol/ADR-FORMAT.md`) also gets an ADR in `docs/adr/`, named in the block.
