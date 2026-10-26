---
title: 'Record the implementation address on a proxied deployment again'
slug: record-the-implementation-address-on-a-proxy-deployment
blockedBy: [deployment-record-schema-adr]
covers: []
---

## What to build

In hardhat-deploy v1 the `<name>` record of a proxied contract carries `implementation: <address>` alongside the merged ABI (v1 `src/helpers.ts:1546-1573`), and frontends, scripts and block-explorer tooling read it. `@rocketh/proxy` writes no such field: the saved record is the proxy deployment plus the implementation artifact and the merged ABI (`packages/rocketh-proxy/src/index.ts:457-462, 598-603`). The `<name>_Implementation` record still exists, so the information is not lost, but every consumer that used to read one field now has to know rocketh's naming convention and do a second lookup, and `@rocketh/export` ships neither.

Add the field, and make it mean one precise thing: the implementation address THIS RECORD DESCRIBES, as established by the run that wrote the record. That is the only reading ADR 0012 allows, and it is satisfiable, because the deploy path already reads the live EIP-1967 implementation slot on the upgrade branch (`packages/rocketh-proxy/src/index.ts:471-475`) and knows the freshly deployed implementation address on the other. It must NOT be a promise about the current chain state at read time, and the doc comment must say so.

Both save sites must set it: the fresh-deploy save and the upgrade or reconciliation save. Note the second one is guarded by `recordDescribesImplementation` (`packages/rocketh-proxy/src/utils.ts:112-130`), which compares the stored ABI and deployed bytecode; a record that is missing the new field should be treated as not describing the implementation, so existing records pick the field up on the next run rather than never.

Build against the deployment-record ADR (`deployment-record-schema-adr`): the maintainer decided on 2026-09-24 that the record is a published format settled by one ADR, and this field is one it lists. Use the meaning that ADR gives the field; if it differs from the one above, the ADR wins.

## Acceptance criteria

- [ ] A proxied deployment record carries the implementation address after a fresh deploy and after an upgrade.
- [ ] A record written before this change gains the field on the next run that touches it (verify the `recordDescribesImplementation` guard does not freeze it out).
- [ ] The field's meaning is documented at the type, including what it does NOT promise.
- [ ] `@rocketh/export` behaviour is stated in the report: either it carries the field or it deliberately does not, with the reason.
- [ ] Tests cover fresh deploy, upgrade, and the pick-up-on-next-run case, using `createTestEnvironment`.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass, plus a changeset.

## Blocked by

- `deployment-record-schema-adr`.

## Prompt

> Give a proxied deployment record its implementation address back, with a meaning that survives ADR 0012 (`docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md`): the record asserts what rocketh OBSERVED when it wrote the record, never what is true on chain now. Read that ADR first; it is the constraint that decides how the field is documented and where it is written.
>
> The gap and its citations are in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section C. Verify them against the code before building: the save sites in `packages/rocketh-proxy/src/index.ts` and the guard in `packages/rocketh-proxy/src/utils.ts` are what this turns on.
>
> Read the deployment-record ADR (the one written by `deployment-record-schema-adr`, in `docs/adr/`) before you write code; the field's name and meaning come from it.
>
> Tests use `createTestEnvironment` from `@rocketh/test-utils` (a REAL environment over a mock provider, see `CONTEXT.md`), and the deployment store is reusable across two environments, which is how the pick-up-on-next-run case is expressed.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, above all the export decision. Do not write the done record or the commit message yourself.

## Decisions

- **Meaning, from ADR 0015 (which wins over this task's wording):** `implementation` is the address of the implementation the `<name>` record describes (the one whose code and merged ABI it carries), as established by the run that wrote it: the implementation the proxy was deployed with, the one this run upgraded it to, or the one read from the EIP-1967 slot when the record was brought in line with the chain. Documented at the type (`Deployment.implementation` in `packages/rocketh-core/src/types.ts`) with what it does NOT promise: it is not a live reading of the chain, and it is not the `<name>_Implementation` record's address, which is the most recently DEPLOYED implementation and differs from it while an upgrade is pending. The ADR 0015 row now states this instead of "PLANNED", and the ADR's line references that this change shifted (and the stale `@rocketh/proxy` ones) were re-derived.
- **Value written:** `implementationDeployment.address` at both save sites. On the reconciliation branch (no upgrade needed) the slot value equals it by construction (`upgradeNeeded` compares them case-insensitively), and writing the address as resolved follows the rule that user-facing values keep what was resolved rather than the lowercased slot form.
- **A deferred or thrown upgrade does not move the field.** Nothing new was needed: the upgrade/reconciliation save is only reached after the upgrade call returns, and an `UnknownSignerError` (caught by `catchUnknownSigner` around the step, or thrown under `throw`) unwinds `deployViaProxy` before it. Pinned by tests in `@rocketh/unknown-signer`, including the next run that reads the moved slot.
- **Guard change:** `recordDescribesImplementation` (`packages/rocketh-proxy/src/utils.ts`) now also requires the stored `implementation` to equal the target address (case-insensitively). A record with no field is therefore NOT described and is rewritten on the next run instead of never. This also catches an implementation redeployed with identical code at a new address, which the code comparison could not see.
- **The backfill does not move `numDeployments` (an addition beyond the approved scope; flagged for ratification).** `env.save` always incremented the count, and `upgradeIndex` reads the count as upgrade steps run, so a backfill counted as a change would make a never-upgraded proxy read as two steps and silently skip a later `upgradeIndex: 1` upgrade. Added an optional `keepNumDeployments` to `Environment.save` options (`@rocketh/core` type, implemented in `rocketh`), which carries the stored count over; combined with `considerItAsFreshDeployment` it is refused. `@rocketh/proxy` uses it only when the record's ONLY gap is a missing `implementation` (`recordOnlyLacksImplementationAddress`): code and merged ABI already match and nothing was upgraded. A different stored address is a real change and is counted. This is a second `@rocketh/core` type change on top of the approved `implementation` field. The fallback, if rejected, is to drop the option and accept the bump (documenting the `upgradeIndex` hazard).
- **Not backfilled when `upgradeIndex` short-circuits:** a call that `checkUpgradeIndex` answers from the stored record returns it untouched without reading the chain, so such a record gains the field only on a call that reaches the slot read. Stated at the type and in the ADR row.
- **`@rocketh/export` does NOT carry the field.** v1's export shape was `{address, abi, linkedData}` with no `implementation` (`work/notes/findings/hardhat-deploy-v1-feature-surface.md` section I), so there is no parity gap; the export is a frontend's source of truth for addresses to TALK to, and a past observation of the implementation is the field most easily misread as live state there; and the implementation is already exported as its own `<name>_Implementation` entry, since export ships every record (this task's claim that export ships neither is inaccurate). Adding it later is non-breaking if users ask.
- **Docs:** `documentation/migration/index.md` (the Proxies paragraph and the deployment-files table row, now "same"), `documentation/deploying/index.md` and `packages/rocketh-proxy/README.md` say what the field means. `skills/hardhat-deploy-migration/SKILL.md` does not repeat the "missing" claim, so it is unchanged.
- **Ported-protocol assertion skipped:** `packages/rocketh-unknown-signer/test/ported-protocols/` does not exist on main at the time of building, so no ported script asserts the field yet.
- **Changeset:** minor for `@rocketh/proxy`, `@rocketh/core` and `rocketh`; `@rocketh/unknown-signer` changes only in tests and is not bumped.
