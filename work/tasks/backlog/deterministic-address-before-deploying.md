---
title: 'Know a deterministic address before deploying it'
slug: deterministic-address-before-deploying
needsAnswers: true
blockedBy: []
covers: []
---

<!-- open-questions -->

## Open questions

1. What is the API? Three candidate shapes: a standalone `computeDeterministicAddress(env)(artifact, args, options)` in `@rocketh/deploy`; v1's shape, where one call returns `{address, deploy()}` and the caller decides (v1 `types.ts:217-226`); or a `dryRun` flag on `deploy` that returns the address and broadcasts nothing. The first is the smallest, the second is the one a migrating script already expects, the third quietly doubles the meaning of `deploy`.
2. Does it cover create3 as well as create2? create2 is a pure function of the factory address, the salt and the creation bytecode, so it needs no network at all. create3 derives from the deployer and the salt (`packages/rocketh-deploy/src/index.ts:334-352`), and the factory address itself comes from chain config, so a preview is computable but a HONEST one must also say whether that address is already occupied, which needs an RPC call.

<!-- /open-questions -->

## What to build

A way for a deploy script to learn the address a deterministic deployment WILL land on, without deploying it. hardhat-deploy v1 exposed this as `deployments.deterministic(name, options)`, which returned `{address, implementationAddress?, deploy()}` and broadcast nothing until `deploy()` was called (v1 `src/helpers.ts:663-818`). rocketh has no equivalent: the address is computed inside `deploy` and the same call broadcasts (`packages/rocketh-deploy/src/index.ts:634-700`).

The pattern it serves is the one that has no workaround: two contracts that must each know the other's address, where the usual answer is to deploy A deterministically, hand its computed address to B's constructor, and only then deploy A. Today a rocketh script has to deploy A first, which is exactly what deterministic deployment exists to avoid having to sequence.

The machinery already exists and must be REUSED rather than reimplemented, because a second copy of an address derivation is a second chance to get it wrong: `getCreate2Factory` and `getCreate3Factory` both return a `getExpectedAddress` (`packages/rocketh-deploy/src/index.ts:185-355`). The care needed is that `getCreate2Factory` may BROADCAST (it funds and deploys the factory when absent) and `getCreate3Factory` may deploy the create3 factory, so a preview cannot simply call them. Note the create3 path already demonstrates the split: `resolveCreate2Info` exists precisely so a pure config lookup does not reach the network (`packages/rocketh-deploy/src/index.ts:136-145`).

## Acceptance criteria

- [ ] A deploy script can obtain the deterministic address of a contract without any transaction being broadcast (assert on the mock provider: no `eth_sendTransaction`, no `eth_sendRawTransaction`).
- [ ] The address returned is byte-identical to the address the subsequent real deploy lands on, asserted by doing both in one test.
- [ ] The salt normalisation matches `deploy`'s exactly (`true` means the zero salt, a hex string is left-padded to 32 bytes).
- [ ] Whatever is decided for question 2 is implemented and documented, including what a preview does and does not promise about an occupied address.
- [ ] Tests mirror the existing `@rocketh/deploy` integration-test style and read as documentation of the two-contracts-that-know-each-other pattern.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass, plus a minor changeset.

## Blocked by

- None mechanically; the two open questions above must be answered before an agent builds it.

## Prompt

> Give deploy scripts a way to compute a deterministic address without broadcasting, the rocketh analogue of hardhat-deploy v1's `deployments.deterministic`. The gap is recorded in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section A.
>
> Do not start until the two open questions at the top of this task are answered; they decide the API surface and are not yours to pick.
>
> Reuse the existing derivations in `packages/rocketh-deploy/src/index.ts` rather than writing new ones, and respect the reason they are shaped as they are: `getCreate2Factory` can BROADCAST (it funds and deploys the canonical factory when the chain does not have it) and `resolveCreate2Info` exists so a pure lookup does not reach the network. A preview that deploys a factory is not a preview.
>
> Tests use `createTestEnvironment` from `@rocketh/test-utils` (a REAL environment over a mock provider, see `CONTEXT.md`); assert the absence of send calls, not just the presence of the right address.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT. Do not write the done record or the commit message yourself.
