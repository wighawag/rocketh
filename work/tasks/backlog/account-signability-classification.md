---
title: Explicit account signability classification on the environment
slug: account-signability-classification
spec: unknown-signer-core
blockedBy: []
covers: []
---

## What to build

Make "can rocketh actually sign for this address?" an explicit, readable property of the environment, instead of something no caller can determine.

Today the environment collapses three genuinely different realities into one `{type: 'remote', signer: provider}` entry in `addressSigners`:

1. the node genuinely holds the key (the address is in `eth_accounts`),
2. the node impersonates it (auto-impersonation succeeded),
3. nobody can sign it at all (impersonation was off, or the node does not support it, or it failed).

Two properties of the current code cause this. A named account declared as a plain address resolves to a `remote` signer whether or not the node knows it, so `addressSigners[address]` is always truthy for a named account. And auto-impersonation is best-effort: it swallows failures and its returned list of successfully-impersonated addresses is logged and then discarded, so its outcome is unobservable afterwards.

Build:

Note this task is ADDITIVE except for one deliberate behaviour change (the candidate-filter fix below), which is called out explicitly rather than smuggled in.

- A signability value per address, computed during environment setup, with four states. **Derive them from the `Signer` union, which has THREE variants — open `@rocketh/core/types` and read it before you start, and see `CONTEXT.md` under `signer`:**
  - `local` — the resolved signer is `signerOnly` OR `wallet`; we can produce a signature without the node's help. `signerOnly` is what the `privateKey` protocol and hardware/remote signer protocols return, and it is the LOCAL-signing variant; `wallet` is an external wallet provider and is currently never constructed in this repo. Do NOT name this state after a single union member: an earlier draft called it `wallet`, which would have classified every privateKey deployer as unsignable and made the seam throw on ordinary deploys.
  - `node` — the resolved signer is `remote` and the address is present in `eth_accounts`.
  - `impersonated` — the resolved signer is `remote`, the address is absent from `eth_accounts`, and impersonation succeeded.
  - `unsignable` — an address never seen during setup, or a named account that is none of the above. Be precise here: the node's OWN unnamed accounts are in `eth_accounts` and DO receive `remote` entries in the leftover-accounts loop, so they are `node`, NOT `unsignable`. Classifying `env.unnamedAccounts` as unsignable would make the later seam throw on perfectly ordinary sends.
- **Precedence is `local` > `node` > `impersonated` > `unsignable`.** Keep it and test it as a defensive invariant, so the classification stays correct even if the candidate filter below later regresses.
- **Fix the impersonation candidate filter, which contradicts its own documentation.** `impersonateAccounts` is documented as being for "named accounts that don't have private keys available", but the candidate set is computed purely as "named accounts absent from `eth_accounts`", which also sweeps in `signerOnly` accounts (privateKey, hardware, remote protocols). So rocketh currently sends `hardhat_impersonateAccount` for accounts it can already sign for. It is behaviourally harmless today (broadcast routes on the signer variant, so a `signerOnly` account signs locally regardless of what the node thinks) but it is wasted RPC per run, and it is the ONLY reason the precedence rule above is needed rather than merely defensive. Narrow the candidates to named accounts absent from `eth_accounts` whose resolved signer is `remote`, which is what the doc comment always said.

  Phrase that filter as "no USABLE signer for this run" rather than "no signer", and keep the decision in one named place. A likely follow-on feature (letting a user deliberately simulate a high-friction signer such as a hardware wallet on a fork) works by making an account with a real signer a candidate again, and it should not have to unpick a hard-coded assumption to do so.

  This is the one behaviour change in an otherwise additive task. It is dev/fork-only, since `autoImpersonate` is enabled for hardhat simulated networks or by explicit chain config. Accepted risk: a script that calls `eth_sendTransaction` directly from a privateKey-derived named account on a dev node works today by accident and will stop.

- **Address-key normalisation is ALREADY DONE — do not redo it.** It landed as its own bug fix in commit `09ea46d`, because it turned out to be a live defect breaking every privateKey and signer-protocol account, not a corner case. `addressSigners` keys are now lowercased at both write sites and at the leftover-account filter lookup, `resolveAccountOrUndefined` was brought in line with `resolveAccount`, and `packages/rocketh/test/addressSigners-casing.test.ts` covers it. The address VALUES in `namedAccounts` and `unnamedAccounts` are deliberately still un-normalised, because they are user-visible and reach deployment records and frontend exports where EIP-55 checksums are a real integrity feature. Preserve that fence.

  One consequence in your favour: a differently-cased named account can no longer be silently re-listed as unnamed and have its `signerOnly` entry overwritten by a `remote` one (the quieter of that bug's two modes). So an account's resolved signer is now a trustworthy input to classification.

- Expose it additively on the environment as `addressSignability`, keyed by lowercased address, alongside the existing `addressSigners`. Two files carry the field: the `Environment` interface in `packages/rocketh-core/src/types.ts` (an additive core-type change, PRE-AUTHORISED by this task so you neither stall on the ask-first rule nor reach for a cast) and its mirrored copy in `hardhat-deploy/documentation/environment.md`, which commit `09ea46d` updated the same way. Keep them in step.
- **Normalise the impersonation outcome before recording it.** `unknownAccounts` is built from `Object.values(namedAccounts)`, whose values are deliberately NOT normalised, and the impersonation helper pushes each address verbatim. So the successful-impersonation list arrives un-normalised, and keying anything from it without lowercasing would recreate exactly the bug class `09ea46d` fixed. **Do not change `addressSigners`, and do not add a variant to the `Signer` union** — an unsignable account keeps the entry it has today so nothing downstream breaks. This is an additive read-only view, not a refactor of account resolution.
- Stop discarding the result of auto-impersonation: its successful addresses are what distinguish `impersonated` from `unsignable`. Keep the existing swallow-and-continue behaviour for nodes that do not support impersonation; only the RECORDING of the outcome changes.
- Querying an address that was never seen returns `unsignable` rather than `undefined`, so callers never have to handle a third case.

Nothing consumes this yet — `unknown-signer-broadcast-seam` is the first consumer. This task delivers the classification and its tests, and no behaviour change to any existing path.

## Acceptance criteria

- [ ] Environment exposes `addressSignability` with the four documented states, keyed by lowercased address, and returns `unsignable` for an unknown address.
- [ ] `local` / `node` / `impersonated` / `unsignable` are each produced by a test that sets up the corresponding condition.
- [ ] **Every member of the `Signer` union is enumerated in the implementation and named in the PR/done record**, with a test that a `signerOnly` account (what `privateKey` returns) classifies as `local`. This criterion exists because a partial read of that union already produced one wrong design.
- [ ] Precedence `local` > `node` > `impersonated` > `unsignable` is implemented and tested as a defensive invariant.
- [ ] The impersonation candidate set excludes accounts whose resolved signer is not `remote`, matching the function's documented intent; a test asserts no `hardhat_impersonateAccount` is sent for a `signerOnly` account.
- [ ] The "usable signer" decision lives in one named place, so a later feature can extend it without unpicking a hard-coded assumption.
- [ ] `namedAccounts` and `unnamedAccounts` values remain un-normalised (the key normalisation landed in `09ea46d`; the user-visible addresses were deliberately left alone, and this task must not "tidy" them).
- [ ] A named account whose auto-impersonation FAILED (or whose node does not support impersonation) classifies as `unsignable`, not `impersonated` — this is the case that is currently silently indistinguishable.
- [ ] `addressSigners` keys are already normalised (`09ea46d`); do not otherwise change `addressSigners`, and do not add a variant to the `Signer` union. No transaction routing changes in this task.
- [ ] A changeset accompanies the change (this task modifies published packages and the verify gate runs `changeset status`).
- [ ] `autoImpersonate` semantics are unchanged: still a node-capability switch, still resolved with the existing precedence, still best-effort with failures swallowed.
- [ ] Tests live in `packages/rocketh/test/` and build a real environment with a small local mock provider, following `addressSigners-casing.test.ts`. They must NOT use `@rocketh/test-utils`: `rocketh` deliberately does not depend on it, and adding that devDependency would close a `rocketh` to `test-utils` project-graph cycle against `nx`'s `dependsOn: ["^build"]`. A small shared helper local to `packages/rocketh/test/` is fine and expected; it must not be published or promoted into `@rocketh/test-utils`.
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Blocked by

- None — can start immediately. Its tests build a real environment locally inside `packages/rocketh/test/` rather than depending on the shared harness, so it does not wait on `test-env-harness`.

(`unknown-signer-broadcast-seam` is `blockedBy` this task, partly to serialize edits to the same module and avoid a merge conflict.)

## Prompt

> Make account signability explicit on the rocketh environment. Right now nothing downstream can tell whether an address is signable, because a named account declared as a plain address always gets a `{type:'remote', signer: provider}` entry in `addressSigners` whether or not the node can actually sign for it, and because auto-impersonation's outcome is logged and then thrown away.
>
> FIRST, check this task against current reality (launch snapshot may have DRIFTED): confirm that account resolution still produces a `remote` signer for a plain-address named account, and that the auto-impersonation helper still returns its list of successfully-impersonated addresses to a caller that discards it. If either has changed, route to needs-attention rather than building on the stale premise.
>
> Domain vocabulary (`CONTEXT.md` under `signer` / `signability`, and ADR 0006): `autoImpersonate` is a NODE CAPABILITY switch (impersonate named unsignable accounts if the node supports it). It is ORTHOGONAL to the unknown-signer POLICY a later task adds, it runs BEFORE that seam, and this task must not change its behaviour — only record its outcome.
>
> READ THE `Signer` UNION BEFORE DESIGNING. It has three variants, not two: `signerOnly` (local signing material — what `privateKey` and hardware protocols return), `wallet` (external wallet provider, currently never constructed here), `remote` (the node signs). Broadcast routes `wallet` and `remote` to `eth_sendTransaction` and `signerOnly` to sign-then-send-raw. The four signability states are `local` (`signerOnly` or `wallet`), `node` (`remote` and in `eth_accounts`), `impersonated` (`remote`, not in `eth_accounts`, impersonation succeeded), `unsignable` (the rest). An earlier draft of this task named the first state `wallet` after one union member, which would have classified every privateKey deployer as unsignable — that is the mistake this paragraph exists to prevent.
>
> Where to look: the environment setup module in `packages/rocketh` — the account resolution loop that fills `addressSigners`, the `eth_accounts` fetch that produces the remote-account list, and the impersonation helper invoked for named accounts absent from it. The classification must be computed AFTER impersonation runs, since impersonation is what moves an address from `unsignable` to `impersonated`.
>
> Seams to test at: a REAL environment built inside `packages/rocketh/test/`, following the pattern `addressSigners-casing.test.ts` established (`resolveConfig`, `getChainIdForEnvironment`, `resolveExecutionParams`, `createEnvironment`, against a small local mock provider, with a tiny polling interval). Do NOT reach for `@rocketh/test-utils`: `rocketh` must not depend on it, or the project graph closes a cycle. `@rocketh/signer` is already a devDependency of `rocketh`, so a `signerOnly` account is available to you. Drive a provider that lists some accounts, accepts `hardhat_impersonateAccount` in one test and rejects it in another. The failed-impersonation case is the important one — it is currently indistinguishable from a real node account, and that is the defect this task closes.
>
> Key invariant to preserve: apart from the one declared candidate-filter fix, this is ADDITIVE. Do not change `addressSigners`, do not add a variant to the `Signer` union, do not reroute any transaction, and do not change how a transaction is signed. The next task (`unknown-signer-broadcast-seam`) is the first consumer.
>
> The candidate-filter fix is in scope and deliberate: `impersonateAccounts` says it exists for accounts without private keys, but its candidate set is every named account missing from `eth_accounts`, so privateKey and protocol accounts get impersonated too. Bring the code in line with its own doc comment. Treat it as a real behaviour change: it needs its own test and, per the repo's standing conventions, a changeset.
>
> Done means: given an environment, a caller can ask for any address's signability and get one of four honest answers, and no existing behaviour changed.
