---
title: 'Know a deterministic address before deploying it'
slug: deterministic-address-before-deploying
blockedBy: []
covers: []
---

## Answers (maintainer, 2026-10-26)

1. **API: a standalone function**, `computeDeterministicAddress(env)(artifact, args, options)` in `@rocketh/deploy`, exported next to `deploy` as a curried `(env) => …` extension entry. Not v1's `{address, deploy()}` shape and not a `dryRun` flag on `deploy`: it is the smallest surface, and it leaves the meaning of `deploy` unchanged. The migration map (`documentation/migration/index.md`, the `deterministic(name, options)` row) documents it as the replacement for v1's `deterministic`.
2. **create2 AND create3.** create2 needs no network. For create3, the preview also reports whether the address is already occupied, which costs one read (`eth_getCode`) and never a send. What the result promises about an occupied address is documented with the function.

## What to build

A way for a deploy script to learn the address a deterministic deployment WILL land on, without deploying it. hardhat-deploy v1 exposed this as `deployments.deterministic(name, options)`, which returned `{address, implementationAddress?, deploy()}` and broadcast nothing until `deploy()` was called (v1 `src/helpers.ts:663-818`). rocketh has no equivalent: the address is computed inside `deploy` and the same call broadcasts (`packages/rocketh-deploy/src/index.ts:634-700`).

The pattern it serves is the one that has no workaround: two contracts that must each know the other's address, where the usual answer is to deploy A deterministically, hand its computed address to B's constructor, and only then deploy A. Today a rocketh script has to deploy A first, which is exactly what deterministic deployment exists to avoid having to sequence.

The machinery already exists and must be REUSED rather than reimplemented, because a second copy of an address derivation is a second chance to get it wrong: `getCreate2Factory` and `getCreate3Factory` both return a `getExpectedAddress` (`packages/rocketh-deploy/src/index.ts:185-355`). The care needed is that `getCreate2Factory` may BROADCAST (it funds and deploys the factory when absent) and `getCreate3Factory` may deploy the create3 factory, so a preview cannot simply call them. Note the create3 path already demonstrates the split: `resolveCreate2Info` exists precisely so a pure config lookup does not reach the network (`packages/rocketh-deploy/src/index.ts:136-145`).

## Acceptance criteria

- [ ] A deploy script can obtain the deterministic address of a contract without any transaction being broadcast (assert on the mock provider: no `eth_sendTransaction`, no `eth_sendRawTransaction`).
- [ ] The address returned is byte-identical to the address the subsequent real deploy lands on, asserted by doing both in one test.
- [ ] The salt normalisation matches `deploy`'s exactly (`true` means the zero salt, a hex string is left-padded to 32 bytes).
- [ ] Both create2 and create3 are covered (answer 2), and the create3 preview reports whether the address is occupied; what a preview does and does not promise about an occupied address is documented.
- [ ] Tests mirror the existing `@rocketh/deploy` integration-test style and read as documentation of the two-contracts-that-know-each-other pattern.
- [ ] The migration map row for v1 `deterministic(name, options)` says what replaces it.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass, plus a minor changeset.

## Blocked by

- None. The two questions this task opened with are answered above.

## Prompt

> Give deploy scripts a way to compute a deterministic address without broadcasting, the rocketh analogue of hardhat-deploy v1's `deployments.deterministic`. The gap is recorded in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section A.
>
> The API surface is decided in `## Answers` at the top of this task; build that, not an alternative.
>
> Reuse the existing derivations in `packages/rocketh-deploy/src/index.ts` rather than writing new ones, and respect the reason they are shaped as they are: `getCreate2Factory` can BROADCAST (it funds and deploys the canonical factory when the chain does not have it) and `resolveCreate2Info` exists so a pure lookup does not reach the network. A preview that deploys a factory is not a preview.
>
> Tests use `createTestEnvironment` from `@rocketh/test-utils` (a REAL environment over a mock provider, see `CONTEXT.md`); assert the absence of send calls, not just the presence of the right address.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT. Do not write the done record or the commit message yourself.
