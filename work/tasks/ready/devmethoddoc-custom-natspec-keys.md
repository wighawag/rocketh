---
title: Allow @custom:* natspec keys on DevMethodDoc
slug: devmethoddoc-custom-natspec-keys
issue: 44
origin: issue
originTrust: trusted
covers: []
blockedBy: []
---

## What to build

Extend the `DevMethodDoc` type in `@rocketh/core` so that natspec objects with `@custom:*` keys (e.g. `@custom:oz-upgrades-unsafe-allow`, required by OpenZeppelin for upgradeable contracts) type-check without casting.

Today `DevMethodDoc` only permits `details`, `params`, and `returns`, so passing an artifact whose devdoc includes an OZ custom natspec entry produces a TS2322 error and forces users to cast the artifact.

## Acceptance criteria

- `DevMethodDoc` in `packages/rocketh-core/src/types.ts` accepts arbitrary `@custom:<name>` string-valued keys via an index signature, in addition to the existing `details` / `params` / `returns` fields.
- An artifact whose devdoc method entry contains `'@custom:oz-upgrades-unsafe-allow': 'external-library-linking'` type-checks when passed through `deployViaProxy` (and other consumers of `Artifact` / `DevDoc`) with no `as` cast.
- `pnpm typecheck` passes across the workspace.
- A test (unit or type-level) in `@rocketh/core` demonstrates that a `DevMethodDoc` with a `@custom:*` key is assignable, and that non-`@custom:` unknown keys still behave as before.
- No behavioural change to runtime code — this is a types-only change.

## Prompt

In `packages/rocketh-core/src/types.ts`, update `DevMethodDoc` to include an index signature for `@custom:${string}` keys mapping to `string`, matching the proposal in issue #44:

```ts
export type DevMethodDoc = {
	readonly details?: string;
	readonly params?: {readonly [name: string]: string};
	readonly returns?: {readonly [key: string | `_${number}`]: string};
	readonly [key: `@custom:${string}`]: string;
};
```

Verify the change flows through to consumers (artifacts passed to `deployViaProxy` in `@rocketh/proxy`, `deploy` in `@rocketh/deploy`, and any devdoc-consuming code in `@rocketh/doc`). Add a small test in `packages/rocketh-core/test` (or a `.test-d.ts` style assignability check) proving a devdoc with `@custom:oz-upgrades-unsafe-allow` is accepted without casting. Run `pnpm typecheck`, `pnpm test`, and `pnpm format` before finishing.
