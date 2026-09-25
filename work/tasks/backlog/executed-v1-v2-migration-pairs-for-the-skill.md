---
title: 'Executed v1-to-v2 migration pairs, so the migration skill cannot teach an option that does not exist'
slug: executed-v1-v2-migration-pairs-for-the-skill
blockedBy: []
covers: []
---

## What to build

A set of PAIRED examples: a hardhat-deploy v1 deploy script, and its rocketh port, where the rocketh half is COMPILED AND RUN by the test suite. The migration skill (`skills/hardhat-deploy-migration/SKILL.md`) then teaches from those pairs instead of from prose it keeps by hand.

Why executed, and not just more prose: the skill already has eight inline v1/v2 patterns (`skills/hardhat-deploy-migration/SKILL.md:1057-1292`) and at least one is WRONG in the dangerous direction. Pattern 3 translates a v1 transparent proxy (`proxyContract: 'OpenZeppelinTransparentProxy'`, `viaAdminContract: 'DefaultProxyAdmin'`) into rocketh as `{proxyKind: 'Transparent'}` (`skills/hardhat-deploy-migration/SKILL.md:1131-1170`). There is no `proxyKind` anywhere in the packages (a grep over `packages/*/src` returns nothing; `ProxyDeployOptions` is `packages/rocketh-proxy/src/index.ts:56-116`). A TypeScript project gets an excess-property error; an agent that silences it gets the DEFAULT proxy, `ERC173Proxy` (`packages/rocketh-proxy/src/index.ts:226`), with no ProxyAdmin: a different contract on chain, deployed without complaint. The correct port is `proxyContract: 'SharedAdminOpenZeppelinTransparentProxy'`. An example that is compiled cannot drift into that state; one that is merely written can and did.

The pairs to cover are the translations a migrating script actually makes, chosen from `work/notes/findings/hardhat-deploy-v1-feature-surface.md`:

1. A plain deploy with constructor args and a named account.
2. A deploy with linked libraries.
3. A deterministic (create2) deploy.
4. Each of the five built-in proxy kinds, because three of the five names changed and each carries coupled side effects (`packages/rocketh-proxy/src/index.ts:237-276`).
5. A proxy with `execute: {init, onUpgrade}`, and a proxy upgrade with `upgradeIndex`.
6. A diamond deploy and a diamond cut.
7. `execute` and `read` by deployment name.
8. A run-once script (`id` plus `return true`), and the early-return replacement for v1's `skip`.
9. A per-network named-account map, including what replaces a `null` entry.
10. A tagged fixture in a test (v1 `deployments.fixture(['Tag'])`, the hardhat 3 `loadFixture` equivalent).

The v1 half of each pair is REFERENCE TEXT: it cannot run in this repo and must not be made to. It is kept next to the v2 half so the pair is readable as a unit, and it must be a real, valid v1 script: check each v1 option against the v1 source (hardhat-deploy tag v1.0.4, whose option types the finding cites line by line), not against memory.

Where they live is part of the task. The precedent is `work/tasks/ready/ported-v1-proxy-upgrade-script-test.md`, which lifts one mechanically ported v1 script into a package test suite; the governance demo under `demoes/` is the other available shape. Pick one home for all pairs and say why.

Then rewrite the skill's patterns section to draw from the pairs (by inclusion or by reference, your call), fixing Pattern 3 and checking the other seven against the code as you go.

Relation to other staged work: `v1-to-v2-capability-map-in-the-migration-docs` is the WHAT-IS-MISSING document; this is the HOW-TO-TRANSLATE evidence. They share no files except the skill, and whichever lands second rebases on the first.

## Acceptance criteria

- [ ] Every pair above exists, with a v1 half and a v2 half side by side.
- [ ] Every v2 half is compiled by `pnpm typecheck` and executed by `pnpm test`, and asserts an observable outcome (the contract deployed, the proxy KIND on chain, the upgrade happened), not merely that it ran.
- [ ] For the proxy pairs, the test asserts WHICH proxy artifact was deployed, so a wrong option name fails the test rather than falling back to the default.
- [ ] Every v1 option used in a v1 half is checked against the v1 source; the report lists any the skill previously used that do not exist in v1.
- [ ] Pattern 3 in the skill is fixed, and the report lists every other pattern that was wrong and how.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass; a changeset is added if a published package changed (an empty one otherwise, see `CONTEXT.md`).

## Blocked by

- None.

## Prompt

> Build executed v1-to-v2 migration pairs and make the migration skill teach from them. The motivating defect is real and verified: the skill's proxy pattern (`skills/hardhat-deploy-migration/SKILL.md`, Pattern 3) uses an option, `proxyKind`, that does not exist, and the silent fallback is a DIFFERENT proxy. Confirm that yourself before starting (grep `proxyKind` over `packages/*/src`, then read `ProxyDeployOptions` in `packages/rocketh-proxy/src/index.ts`).
>
> Your inventory of what exists on both sides is `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, measured against hardhat-deploy v1 at tag v1.0.4 (commit 7530f4a). The closed set of built-in proxy names on each side is in section C: enumerate from the definition, not from the finding, in case the code moved.
>
> Tests: use `createTestEnvironment` from `@rocketh/test-utils` (a REAL environment over a mock provider; see `CONTEXT.md` on test environment vs mock environment, and never hand-build an environment literal). Assert outcomes a reader cares about, above all which proxy artifact landed.
>
> Public repository: describe any motivation by its PATTERN, never by who reported it, and keep funding, budget and delivery framing out of every file and every commit message (AGENTS.md).
>
> FIRST, check this task against current reality; if the code or the skill has moved, route to needs-attention rather than building on a stale premise (WORK-CONTRACT.md, "Drift is a needs-attention signal").
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, above all where the pairs live and why. Do not write the done record or the commit message yourself.
