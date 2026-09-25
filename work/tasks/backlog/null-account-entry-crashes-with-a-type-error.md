---
title: 'A null entry in a per-network account map crashes with a raw TypeError'
slug: null-account-entry-crashes-with-a-type-error
blockedBy: []
covers: []
---


## What to build

Measured on 2026-09-24 against the built packages at b1ec7468, through `createTestEnvironment`, environment `localhost`:

- `accounts: {admin: {default: 1, localhost: null}}` crashes environment construction with `TypeError: Cannot use 'in' operator to search for 'localhost' in null`.
- `accounts: {admin: {mainnet: 1}}` (no entry, no `default`) fails with the readable `cannot get account for admin = ...` (`packages/rocketh/src/environment/index.ts:674-687`).

The cause: the per-network lookup accepts any value that is `!== undefined`, so `null` passes, and `getAccount` then treats `null` as another per-network map, because `typeof null === 'object'` (`packages/rocketh/src/environment/index.ts:652-666`). `UserConfig`'s `AccountType` does not admit `null` (`packages/rocketh-core/src/types.ts:603-609`), so a TypeScript config is refused at compile time, but a config migrated from v1 (whose type explicitly allows `null`, v1 `src/type-extensions.ts:16`) or written in JavaScript reaches the crash.

In v1 (tag v1.0.4), `null` makes the name simply absent (`src/utils.ts:379-395`), and scripts branch on `undefined`. The translation that works in rocketh today for an address-only value is `data`, where a missing network resolves to `undefined` without throwing (measured the same way). There is none for an optional account the run must SIGN as.

The maintainer decided on 2026-09-24 that `null` means what it meant in v1: the account is ABSENT on that network, and the run starts. Concretely: the account type admits `null` as a per-network value; a name that resolves to `null` has no entry in `namedAccounts`, `namedSigners`, `addressSigners` or `addressSignability`; and `namedAccounts` is typed so that a script must handle `undefined` for such a name. A name with no entry for the network and no `default` keeps its current readable refusal: only an EXPLICIT `null` means absent, so a typo'd network name still fails loudly.

## Acceptance criteria

- [ ] The raw TypeError is gone; a test reproduces the config above.
- [ ] A name that is `null` on the current network is absent from `namedAccounts` and the run starts; the same name set on another network resolves there.
- [ ] A name with no entry and no `default` still fails with the readable message.
- [ ] The migration docs state the behaviour and the v1 translation.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass; a changeset; the account type in `@rocketh/core` gains `null`, which AGENTS.md makes ask-first, so say in the report which public types changed.

## Blocked by

- None.

## Prompt

> Fix the crash a `null` per-network account entry causes, in the named-account resolution of `packages/rocketh/src/environment/index.ts`. The measurement and the v1 semantics are in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section E.
>
> Reproduce first, with `createTestEnvironment` from `@rocketh/test-utils`, before changing anything. rocketh's own tests build a real environment locally rather than through `@rocketh/test-utils` (see `CONTEXT.md`, "test environment vs mock environment", for the dependency-edge reason); put the test where the resolution code's tests already live.
>
> Read `CONTEXT.md`'s `signer` and `signability` entries: an absent account must not leave a signer map entry or a signability entry keyed by something that is not an address.
>
> FIRST, check this task against current reality (WORK-CONTRACT.md, "Drift is a needs-attention signal"). RECORD non-obvious decisions in `## Decisions` at the end of your FINAL REPORT. Do not write the done record or the commit message yourself.
