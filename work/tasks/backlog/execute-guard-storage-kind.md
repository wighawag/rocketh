---
title: 'The storage guard kind: read a slot, because the commonest upgrade topology exposes no getter'
slug: execute-guard-storage-kind
spec: execute-state-guard
blockedBy: [execute-guard-seam-and-call-kind, execute-guard-equals-and-output-selection]
covers: [4, 8]
---

## What to build

The second guard kind: read a STORAGE SLOT on a contract instead of calling a function on it.

This is not an optimisation and it is not an OpenZeppelin quirk. An OZ transparent proxy exposes NO public getter for its implementation, so the effect of the single commonest privileged call there is (upgrade a proxy through its ProxyAdmin, from an owner that is usually a Safe) is observable only in the EIP-1967 implementation slot. `@rocketh/proxy` already reads exactly that slot with `eth_getStorageAt`, and says why in a comment. A call-only guard could not express the most common upgrade topology in existence, which is what the spec's paper validation found and why the guard's union was discriminated from the first commit.

**The kind.** A storage guard names a target (the same target shape the call kind takes, defaulting to the contract being executed, and it must be able to read a DIFFERENT contract, which is the normal case here) and a slot.

**It states its own type, because a slot has none.** A slot read returns a raw 32-byte word with no ABI to key the comparison rule off, so the guard declares how to interpret it, from a CLOSED set: `address`, `bytes32`, `uint256`, `bool`. That declaration does two jobs: it decodes the word, and it supplies the type that the comparison rule keys off, so an address in a slot folds case exactly as an address returned from a getter does. Adding a fifth member later is additive; do not accept an open string.

Decoding an address out of a word means taking its low 20 bytes; the existing proxy code shows the shape, though it does that inline with a string slice rather than through anything reusable, so do not assume there is a helper to call.

**Both verdict forms work here**, `equals` and `satisfied`, and the evaluation record reports the slot, the raw word, and the decoded value, so a skip is legible.

## Acceptance criteria

- [ ] A guard can read a storage slot on the contract being executed, and on a DIFFERENT contract
- [ ] The interpretation of the word is declared from a closed set of `address`, `bytes32`, `uint256` and `bool`, and an unknown value is a compile error
- [ ] The declared interpretation drives the comparison rule, so an `address` read from a slot folds case the same way an `address` returned from a getter does. Tested with a checksummed expected value against a lowercase word
- [ ] The evaluation record carries the slot, the raw word and the decoded value
- [ ] The ProxyAdmin topology exists as a test: the call goes to one contract and the EIP-1967 implementation slot is read on ANOTHER, the proxy. This is the case a call-only implementation fails
- [ ] The registry topology exists as a test: the call goes to a registry whose own getter does not change, and the slot is read on the proxy behind it. Same shape, different contract design, which is the point
- [ ] A satisfied storage guard still sends no transaction, asserted from the recorded provider requests
- [ ] A changeset accompanies the change
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass

## Blocked by

- `execute-guard-seam-and-call-kind`: the union, the evaluator and the evaluation record come from there.
- `execute-guard-equals-and-output-selection`: the comparison rule this kind plugs its declared type into comes from there, and both tasks edit the same module, so the ordering also serialises the edits.

## Prompt

> Goal: let a guard observe an effect that no getter exposes, by reading the storage slot where it actually lands.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the guard union, the evaluation record and the comparison rule landed with the shapes assumed here, and that the comparison rule can be driven by a type supplied from outside an ABI. If it cannot, that is a real discrepancy: route to needs-attention rather than duplicating the rule.
>
> READ FIRST: `docs/adr/0013-the-execute-guard-is-a-declared-read.md` for why this kind is required rather than convenient, and `work/notes/findings/governance-upgrade-topologies-in-the-wild.md` for the topologies themselves.
>
> Where to look. `@rocketh/proxy` reads both the EIP-1967 implementation slot and the EIP-1967 admin slot through the environment's provider, and takes the address out of the returned word by slicing its last 40 hex characters. Read that code before writing yours: it is the prior art, it documents the slot constants and their derivation, and it is the exact behaviour your `address` interpretation has to match. It is inline in a much larger function, so expect to write the reusable version rather than to import one.
>
> Domain vocabulary: the guard TARGET is still a `MinimalDeployment`, which is `{address, abi}`, and the abi is simply unused by this kind. The SLOT is a `bytes32`. The declared interpretation exists because a slot carries no ABI, so it is not a convenience option and must not be optional.
>
> On the two required topology tests: the first is a ProxyAdmin, where you call `upgradeAndCall` on the admin and observe the implementation slot on the PROXY. The second is Aave's `PoolAddressesProvider`, where you call `setPoolImpl` on the registry, whose own `getPool()` returns the same proxy address before and after and therefore observes nothing, so the guard again reads a slot on the proxy. They matter because they are the same shape reached from two completely different contract designs, which is the evidence that the storage kind is not an OZ quirk.
>
> Test harness notes. `createTestEnvironment` gives you a real environment against a mock provider that is NOT an EVM, so it has no `eth_getStorageAt` default at all and you must can it yourself, keyed off the address and slot in the params. Moving a slot by hand between two runs is exactly how the existing unknown-signer scenario tests simulate "the Safe executed the upgrade", and that suite is the style to follow.
>
> Done means: a slot-reading guard works on any contract, decodes from a closed set of interpretations, compares under the same rule as a getter would, and both real topologies are demonstrated as tests that read as documentation.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, in particular the spelling of the interpretation option and how you handled a word that does not fit the declared interpretation. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks. The runner transcribes the block verbatim into the done record, `pnpm format:check` covers `work/` and is the FIRST link of the acceptance gate, and prettier normalises asterisk emphasis. `execute-guard-seam-and-call-kind` lost a whole cycle to exactly that: the build was green and the gate red before build, typecheck or test ever ran (`work/notes/observations/decisions-block-formatting-reds-the-gate-after-a-green-build.md`).
