---
title: 'The storage guard kind: read a slot, because the commonest upgrade topology exposes no getter'
slug: execute-guard-storage-kind
spec: execute-state-guard
blockedBy: [execute-guard-seam-and-call-kind, execute-guard-equals-and-output-selection]
covers: [4, 8]
needsAnswers: true
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

## Decisions

- **The interpretation option is spelled `as` (`as: 'address'`), and it is REQUIRED.** It reads as the sentence the guard is making: _on this proxy, slot 0x3608…, as an address, equals next_. Alternatives considered: `type`, rejected on the coherence check because `kind` is already the discriminant in the same object and `type`/`kind` are near-synonyms, so two sibling keys would mean two different things (and `type` is the ABI's own word for the thing inside an `AbiParameter`); `interpretation`, accurate but long for a key used on every storage guard; `decodeAs`, which names only half of what it does (it also supplies the comparison type). It is NOT optional, per the task: a slot carries no ABI, so there is nothing to fall back to. Touches `execute-guard-evaluation-is-legible` (the record carries `as` under the same name) and `document-execute-state-guard`.
- **The four members are spelled with ABI TYPE names (`address`, `bytes32`, `uint256`, `bool`) so the declared interpretation can be handed straight to `abi-comparison.ts` as `{type: guard.as}`.** That is what makes "an address in a slot folds case exactly as an address from a getter" true by CONSTRUCTION rather than by a second implementation of the same rule. Alternative considered: a rocketh-flavoured vocabulary (`addr`, `word`, `number`, `flag`), rejected because it would need a translation table into ABI types and would invite the second comparison vocabulary the equals task explicitly avoided.
- **A word that does not FIT its declared interpretation throws; `address` is the deliberate exception.** `bool` accepts exactly the zero word and the one word, and anything else fails the run naming the slot, the word and the declaration (the usual cause is a PACKED slot, which no whole-word interpretation can read). Alternative considered: `word !== 0 -> true`, rejected because it silently makes a packed slot look readable and answers a question we cannot actually answer, which is the guess ADR 0013 forbids. `address` instead ignores whatever sits above the low 20 bytes, because the task pins it to `@rocketh/proxy`'s existing behaviour and every EIP-1967 reader in the ecosystem does the same. `uint256` cannot fail (every word is one) and `bytes32` is the word itself. This is a NEW refusal, which is why it is recorded.
- **A decoded `address` is CHECKSUMMED (viem's `getAddress`), not the raw lowercase slice.** `@rocketh/proxy` keeps the lowercase slice, but it immediately lowercases both sides and compares; here the value is user-visible (it reaches `satisfied` raw and lands in the evaluation record), so it is spelled the way viem spells an `address` decoded from a getter. That keeps ADR 0013's documented `satisfied` trap ONE trap with one shape across both kinds instead of two subtly different ones. Comparison is unaffected either way, since `address` folds case. Touches `execute-guard-evaluation-is-legible`, which renders the decoded value.
- **The evaluation's `word` is left-padded to a full 32 bytes rather than passed through verbatim.** Nodes disagree about an empty slot (`0x0` versus 64 zeros), and a record whose evidence field changes shape with the RPC provider is not evidence. The value is still undecoded, so nothing is lost.
- **`GuardedExecutionResult` / `SkippedExecution` / `SentExecution` are now parametrised by the EVALUATION type, not by `<TGuardAbi, TGuardFunctionName>`.** A storage guard has no function name at all, so there is nothing shared to parametrise over; the result simply carries whatever evaluation that guard produced. This is a breaking change to three EXPORTED type aliases (nothing outside the package uses them, hence `minor`, not `major`). Alternative considered: keeping the two parameters and adding a third, with the result computed conditionally, which is unreadable and would still not discriminate reliably.
- **`execute` and `evaluateGuard` gained a per-kind call SIGNATURE rather than one wider signature.** One signature taking the guard union would return the evaluation union, forcing every caller to discriminate on `kind` to reach a field their own guard already determined, and it would break the existing pin that a call guard's `evaluation.value` is typed from the ABI. Inferring the whole guard into one generic was also rejected: it destroys the contextual typing of `satisfied`, whose parameter type is the call kind's main type-level guarantee. Consequence, and the reason it is recorded: TypeScript reports an overload-resolution failure at a DIFFERENT node once a signature is added, so four existing `@ts-expect-error` directives (two in `execute-guard.integration.test.ts`, two in `execute-guard-equals.integration.test.ts`) moved by a few lines. The claims they pin are unchanged, and the gate itself catches a misplaced directive (`TS2578: Unused '@ts-expect-error'`), so this cannot rot silently.
- **The EIP-1967 slot constants are NOT exported from the package.** The root surface may hold only curried `(env) => …` functions, so exporting a constant would need a new subpath export, which is a user-visible surface decision nobody asked for; the tests define the constant locally with the EIP citation, exactly as `@rocketh/proxy` does. If `document-execute-state-guard` wants users to write `EIP1967_IMPLEMENTATION_SLOT` rather than paste a hex literal, that subpath is an additive follow-up.
