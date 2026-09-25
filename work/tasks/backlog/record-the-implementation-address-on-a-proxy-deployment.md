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
