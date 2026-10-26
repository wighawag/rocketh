---
title: 'ADR: the deployment record is a published format, with a listed schema and a stability promise'
slug: deployment-record-schema-adr
blockedBy: []
covers: []
---

## What to build

> **FORWARD-POINTER (added 2026-10-26, READ FIRST).** `record-script-tags-and-dependencies-on-deployments` and its sibling were CANCELLED (`work/tasks/cancelled/`), so `tags` / `dependencies` are NO LONGER a planned addition. Do not list them as planned; list them among the fields deliberately not written, with a one-line pointer to `work/notes/ideas/tag-recording-and-selective-reset.md`. The one planned addition left is `implementation` (`work/tasks/backlog/record-the-implementation-address-on-a-proxy-deployment.md`). The "ABSENT means absent, no empty placeholder arrays" rule in point 3 came from the cancelled task: keep it as a general rule if you agree with it, and say so in `## Decisions`. Line numbers below were taken at b1ec7468; re-locate them by reading.

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

## Decisions

- **The open tail stays, and fields written outside the ADR's list are promised nothing, not even that they survive a rewrite.** `& Record<string, unknown>` is how extensions and user `env.save` calls add data. I did not promise preservation because rocketh's own rewrites already drop such fields: the proxy upgrade save rebuilds `<name>` from the `_Proxy` record (`rocketh-proxy/src/index.ts:706`). I also did not reserve a name prefix. A future rocketh field may take any unlisted name, and extensions are advised to namespace their keys. The alternatives were closing the type (that breaks extensions, so it would need a major version) or promising preservation (that is false today). This affects the follow-up type-change proposal and any extension package.
- **"Absent means absent" is kept as a general rule.** It came from the cancelled tags task. I kept it because the existing behaviour already follows it (`numDeployments` is left out at 1), and because it gives readers one rule: a missing field takes its documented default. The alternative, explicit `null` or empty placeholders, would add a line to every committed file and give readers two encodings of "nothing". This binds the `implementation` task.
- **The promise also covers meaning, and the change rules go one step further than "removed or renamed".** Changing a field's meaning is breaking. Turning an always-present field into an optional one is breaking. Reading older records within a major is promised. The maintainer's wording said only "removed or renamed", but a field whose meaning changes silently breaks consumers just as hard. This affects the release discipline of `rocketh`, `@rocketh/diamond` and `@rocketh/proxy`.
- **`execute` is promised, but only as an echo of the input.** It asserts the `execute` option the writing call was given, not that the init ran in that run: the converged branch at `rocketh-diamond/src/index.ts:556-564` writes it without executing anything. I considered leaving it out of the promise, because no consumer reads it back and it can embed a whole artifact. I promised it anyway, because the maintainer's decision covers every listed field, and pinning it to the input-echo meaning keeps it consistent with ADR 0012.
- **Artifact fields are promised by name; their presence depends on the artifact.** These are `contractName`, `sourceName`, `devdoc`, `userdoc`, `storageLayout`, `linkReferences`, `deployedLinkReferences` and `evm.gasEstimates`. Inside `evm`, only `gasEstimates` is promised. Any other key that rides through from the artifact (`solcInput`, `solcInputHash`, `_`-prefixed keys) is promised nothing.
- **`solcInputHash` stays on the "not carried" list even though it is written today.** It only arrives as a side effect of copying the vendored v1 artifacts, and the ADR says so plainly rather than promising it.
- **`implementation` is listed as planned with its owner package and meaning:** the address the record describes, as established by the run that wrote it, not the chain's state at read time. The intended write sites are proxy `:530-535` and `:705-710`. The backlog task says the ADR wins on meaning, and this matches what that task proposes.

## Maintainer changes before merge (2026-10-26)

- **The promise is a 0.x freeze**, not "without a major version": no listed field is removed, renamed or changes meaning in any 0.x release, and a change of policy comes through a superseding ADR.
- **The package each promise binds** is the one that writes the field; the fields `@rocketh/deploy` assembles are attributed to it.
- **`execute` is not promised, and is no longer written** (#189): the builder's decision above to promise it as an input echo is superseded.
