---
title: Route deploy's own signer guard to the unknown-signer seam
slug: deploy-unsignable-deployer-reaches-seam
spec: unknown-signer-core
blockedBy: [unknown-signer-broadcast-seam, test-env-harness]
covers: []
---

## What to build

`@rocketh/deploy` performs its OWN `env.addressSigners[address]` lookup and throws an opaque `cannot get signer for ...` BEFORE it builds the transaction. So a deploy from an unsignable account dies there and never reaches the single `broadcastTransaction` choke point that `unknown-signer-broadcast-seam` instruments. Story 5 promises the mechanism fires for a deploy, and today it would not.

Make that path raise the same `UnknownSignerError`, under the same effective policy, as any other unsignable transaction.

Split out of the seam task deliberately, for a reason worth stating: the seam's tests live in `packages/rocketh/test/`, which cannot import `@rocketh/deploy` (that edge would close the `rocketh` to `@rocketh/test-utils` project-graph cycle, see `CONTEXT.md` under _test environment_). This change therefore could not be tested inside the seam's fence. Here it can: `@rocketh/deploy` already devDepends on `@rocketh/test-utils`, so its tests use `createTestEnvironment` freely.

One thing to check rather than assume: the looked-up `signer` is passed on to the create2/create3 factory helpers, but at time of writing it is not actually READ inside either of them. Verify that, then either keep the lookup to satisfy those signatures or drop the now-unused parameter deliberately. Do not assume the guard is load-bearing, and do not assume it is dead.

## Acceptance criteria

- [ ] A deploy whose deployer is unsignable raises `UnknownSignerError` with the tx payload, not the opaque `cannot get signer` error, and honours the effective `onUnknownSigner` policy exactly as the seam does.
- [ ] A deploy from a signable account is completely unaffected, including the deterministic create2/create3 factory paths.
- [ ] The fate of the `signer` argument passed to the factory helpers is decided deliberately and recorded in the done record (kept for the signature, or removed as unused).
- [ ] Tests live in `packages/rocketh-deploy/test/` and use `createTestEnvironment`; they cover both the unsignable and the still-working signable case.
- [ ] A changeset accompanies the change.
- [ ] `pnpm typecheck`, `pnpm build` and `pnpm test` pass.

## Blocked by

- `unknown-signer-broadcast-seam` — the error type, the policy resolution and the seam behaviour this path must match.
- `test-env-harness` — provides `createTestEnvironment`, which is how this is testable at all.

## Prompt

> Make `@rocketh/deploy` stop short-circuiting an unsignable deployer with an opaque error, so a deploy reaches the unknown-signer seam like every other transaction.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm `packages/rocketh-deploy/src/index.ts` still resolves the deployer via `env.resolveAccount` and then looks up `env.addressSigners[address]`, throwing `cannot get signer for ...` before building the transaction. Confirm too that `unknown-signer-broadcast-seam` landed and how it resolves the effective policy, since you must match it rather than invent a second policy path.
>
> Why this is a separate task: the seam's own tests live in `packages/rocketh/test/` and cannot import `@rocketh/deploy`, because `rocketh` must not depend on `@rocketh/test-utils` (that closes an nx project-graph cycle, and `pnpm build` fails). `@rocketh/deploy` already devDepends on test-utils, so this is the package where the behaviour is testable.
>
> Where to look: the deployer-resolution and guard region of `packages/rocketh-deploy/src/index.ts`, the create2/create3 factory helpers it passes `signer` to, and the seam's policy resolution in `packages/rocketh/src/environment/`. Read `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md` for the model: `autoImpersonate` is a node capability resolved before the seam, `onUnknownSigner` is the policy afterwards, and they stay orthogonal.
>
> Judgement to exercise and record: the `signer` value this guard produces is handed to the factory helpers but appears unread inside them. Verify that yourself. If it is genuinely unused, removing the parameter is cleaner than preserving a lookup purely to feed it, but say what you found either way.
>
> Done means: a deploy from an unsignable account surfaces the same `UnknownSignerError` a raw transaction would, a normal deploy is untouched, and both are proven by tests in `packages/rocketh-deploy/test/`.
