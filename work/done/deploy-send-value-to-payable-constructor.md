---
title: Wire up `value` on the deployment transaction so payable constructors receive `msg.value`
slug: deploy-send-value-to-payable-constructor
issue: 40
covers: []
blockedBy: []
---

## What to build

In `packages/rocketh-deploy/src/index.ts`, the `deploy()` flow reads `value` from its args into `viemArgs.value` but the `value` field is commented out when building `transactionData` (the EIP-1193 deployment transaction), so it is silently dropped. Any contract with a payable constructor that depends on `msg.value` deploys with `msg.value = 0` — constructors that `require(msg.value > 0)` revert, and ones that don't deploy in a broken/unfunded state (funding after deploy is not a workaround because the constructor has already run).

Wire up the `value` field on the deployment `transactionData`, guarding for `undefined` so the field is omitted (not sent as `0x0`/`0xNaN`) when no value is passed.

Replace the commented-out line at `transactionData`:

```ts
// value: `0x${viemArgs.value?.toString(16)}` as `0x${string}`,
```

with a guarded spread:

```ts
...(viemArgs.value !== undefined && {
  value: `0x${viemArgs.value.toString(16)}` as `0x${string}`,
}),
```

Keep the change minimal and scoped to wiring `value`. Do NOT also uncomment the unrelated `gasPrice`/`nonce` lines — that is out of scope for this slice.

## Acceptance criteria

- When `value` is passed to `deploy()`, the dispatched deployment transaction (the params sent to `eth_sendTransaction` / `eth_sendRawTransaction`) includes a `value` field equal to the passed value, hex-encoded as `0x{value.toString(16)}`.
- When NO `value` is passed, the deployment transaction has NO `value` field (the guard omits it; it must not be sent as `0xundefined`/`0xNaN`).
- An integration test in `packages/rocketh-deploy/test/` deploys a contract with `value` set and asserts the dispatched transaction carries the correct hex `value`; a companion assertion confirms a normal (no-`value`) deploy omits the field. Use `createMockEnvironment`/`createMockArtifact` from `@rocketh/test-utils`, capturing the transaction params via the mock provider.
- `pnpm --filter @rocketh/deploy typecheck`, `pnpm --filter @rocketh/deploy test`, and `pnpm format:check` pass.

## Prompt

Fix the dropped `value` on contract deployments in `@rocketh/deploy`.

In `packages/rocketh-deploy/src/index.ts`, locate the `transactionData` object construction (around the EIP-1193 `EIP1193TransactionData` literal with `type: '0x2'`). The `value` field is currently commented out:

```ts
// value: `0x${viemArgs.value?.toString(16)}` as `0x${string}`,
```

Replace it with a guarded spread so the field is only included when a value is actually passed:

```ts
...(viemArgs.value !== undefined && {
  value: `0x${viemArgs.value.toString(16)}` as `0x${string}`,
}),
```

Do not touch the adjacent commented-out `gasPrice`/`nonce` lines.

Then add an integration test under `packages/rocketh-deploy/test/` (follow the existing `*.integration.test.ts` patterns and JSDoc-as-documentation style). Use `createMockEnvironment` and `createMockArtifact` from `@rocketh/test-utils`, configure the mock provider so you can capture the params passed to `eth_sendTransaction`/`eth_sendRawTransaction`, and assert: (1) deploying with `value` set includes `value: 0x...` on the dispatched transaction matching the passed bigint, and (2) deploying without `value` omits the field entirely.

Verify with `pnpm --filter @rocketh/deploy typecheck`, `pnpm --filter @rocketh/deploy test`, and `pnpm format:check`.
