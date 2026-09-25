---
title: 'ADR: the deployment record is a published format, with a listed schema and a stability promise'
slug: deployment-record-schema-adr
blockedBy: []
covers: []
---

## What to build

An ADR in `docs/adr/` (format in `work/protocol/ADR-FORMAT.md`, next free number) that makes the deployment record, the `deployments/<environment>/<Name>.json` file `deploy` writes and everything else reads back, a PUBLISHED format. The maintainer decided this on 2026-09-24: one ADR listing the fields, what each means, and a promise that no field is removed or renamed without a major version. Two tasks are to be built against it and are blocked on this one: `work/tasks/ready/record-script-tags-and-dependencies-on-deployments.md` and `work/tasks/backlog/record-the-implementation-address-on-a-proxy-deployment.md`.

Why it is needed, established by reading the code at b1ec7468: `Deployment` ends in `& Record<string, unknown>` (`packages/rocketh-core/src/types.ts:555-585`), so any package can write any field and nothing states which ones a consumer may rely on. Concretely, `@rocketh/diamond` writes `facets` and `execute` onto records (`packages/rocketh-diamond/src/index.ts:469-470, 524-525, 562-563`), and NEITHER is declared on the `Deployment` type: a consumer reading them today relies on an undeclared field.

The ADR must settle, for every field:

1. **The list.** Every field rocketh writes today, found by reading the WRITE sites (`env.save` and `broadcastDeployment` in `packages/rocketh/src/environment/index.ts`, and every `env.save(` call in `packages/*/src`), not only the type. Include `facets` and `execute`, and the two planned additions (`tags` / `dependencies`, and `implementation`), marked as such.
2. **What each asserts**, under ADR 0012 (a record asserts only what rocketh OBSERVED). For `implementation` in particular: the address the record describes as of the run that wrote it, not a promise about the chain at read time.
3. **Presence.** Which fields are always present and which are optional, and the rule already set by the tags task that ABSENT means absent (no empty placeholder arrays).
4. **The stability promise**, stated for users: which fields are covered, and that a field is not removed or renamed without a major version of the packages that write it.
5. **The open tail.** Whether `& Record<string, unknown>` stays (so extensions can add fields), and if so what an extension-written field is promised (nothing, unless the ADR lists it).
6. **The v1 fields deliberately NOT carried**, so the question does not come back: `history`, the full `receipt`, decoded `args`, `solcInputHash`, `methodIdentifiers`, `factoryDeps`. Their reasons are in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section H.

Consumers to check the list against, because the promise is only worth what they need: `@rocketh/export` (`packages/rocketh-export/src/index.ts:446-453` and the mapping below it), `@rocketh/verifier` (`packages/rocketh-verifier/src/etherscan.ts:149, 259-278, 289-290`, and its sourcify and blockscout siblings), `@rocketh/proxy` (`numDeployments`, `deployedBytecode`, `abi`, `packages/rocketh-proxy/src/utils.ts:34-59, 112-130`) and `@rocketh/diamond`'s own read-back of `facets`.

If the ADR concludes a declared type change is needed (declaring `facets` / `execute` on `Deployment`, say), that change is a SEPARATE follow-up: this task produces the decision, not the code. Modifying `@rocketh/core` types is ask-first under AGENTS.md.

## Acceptance criteria

- [ ] A new ADR in `docs/adr/` lists every field rocketh writes, with its meaning and presence, the two planned additions, and the v1 fields not carried.
- [ ] Every listed field is traced to a write site, cited by file:line.
- [ ] The stability promise is stated in words a user can hold the project to.
- [ ] The open-tail question (point 5) is answered.
- [ ] The report lists any follow-up the ADR implies (a type change, a doc page), as proposals, not built.
- [ ] `pnpm format:check` passes; an empty changeset if the gate requires one.

## Blocked by

- None.

## Prompt

> Write the ADR that makes rocketh's deployment record a published format. The decision to publish it and promise stability is the maintainer's and is taken; your job is to write down exactly WHAT is promised, grounded in the code.
>
> Enumerate the fields from the WRITE sites, not from the type: the type is open (`& Record<string, unknown>`) and already hides at least two fields the diamond package writes. Grep `env.save(` and `broadcastDeployment` over `packages/*/src`, bounding every command with `timeout`, and NEVER grep the `hardhat-deploy-v1-artifacts` folders without a bounded window, since they hold multi-megabyte generated files.
>
> Read ADR 0012 (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`) first; it governs what a field may assert, and this ADR governs whether its presence is promised. Keep the two distinct.
>
> Keep an ADR short (`work/protocol/ADR-FORMAT.md`): a field table is appropriate here, long prose is not.
>
> RECORD non-obvious decisions in `## Decisions` at the end of your FINAL REPORT, above all the open-tail answer. Do not write the done record or the commit message yourself.
