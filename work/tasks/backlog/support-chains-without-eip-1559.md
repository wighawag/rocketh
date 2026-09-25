---
title: 'Deploy and execute on chains without EIP-1559'
slug: support-chains-without-eip-1559
blockedBy: []
covers: []
---

## What to build

rocketh can only send EIP-1559 transactions. There are exactly five places that build a transaction and all five hardcode `type: '0x2'` (`packages/rocketh-deploy/src/index.ts:239, 320, 619`, `packages/rocketh-read-execute/src/index.ts:317, 390`); the `gasPrice` line in the deploy path is commented out (`packages/rocketh-deploy/src/index.ts:626`). On a chain whose node rejects type-2 transactions, a run fails at its first broadcast, possibly after earlier steps of the same script already landed. The maintainer decided on 2026-09-24 that such chains are supported.

hardhat-deploy v1, for reference (tag v1.0.4): `setupGasPrice` fills an unset `gasPrice` from the node, and `cleanupOverrides` removes whichever fee fields are undefined, so the transaction type follows from which fields are present (`src/helpers.ts:308-343`). It also forces type 1 for hardware wallets (`src/helpers.ts:585-590`), which is out of scope here: hardware-wallet protocols were dropped.

What the behaviour must be:

- A caller can pass `gasPrice` on `deploy`, `execute` and `tx`, and the transaction goes out as a legacy (type-0) transaction carrying it.
- Passing `gasPrice` together with `maxFeePerGas` or `maxPriorityFeePerGas` is refused with a clear message, never resolved silently one way or the other.
- A chain can be declared legacy in rocketh's chain configuration, so that a script written without any fee options runs unchanged on it. Whether rocketh should ALSO detect a legacy chain by itself (the latest block has no `baseFeePerGas`) is the builder's call to propose; if proposed, it must not add a network round-trip to runs on 1559 chains that did not need one.
- The three rocketh-built "helper" transactions (the create2 factory funding and deployment, the create3 factory deployment, `packages/rocketh-deploy/src/index.ts:239, 320`) follow the same rule, or a legacy chain still cannot bootstrap deterministic deployment. Note the canonical create2 factory deployment is itself a pre-signed LEGACY transaction relayed raw, so that part already works; check it rather than assume it.

Everything goes through one broadcast choke point in `packages/rocketh/src/environment/index.ts`, which inspects fee fields for display (`isEIP1559Transaction`, `hasGasPrice`, `:302-313`) and prepares local signing (`prepareForLocalSigning`, `:161`). Read how that path treats a transaction that is not type 2 before changing the builders: a `signerOnly` signer signs locally, so a legacy transaction must be signable there, not only sendable through `eth_sendTransaction`.

Coordination: `work/tasks/backlog/honour-or-refuse-dropped-deploy-transaction-options.md` covers the OTHER dropped deploy options and deliberately leaves `gasPrice` to this task.

## Acceptance criteria

- [ ] `deploy`, `execute` and `tx` with `gasPrice` send a legacy transaction carrying it, through both a node-held (`remote`) signer and a local (`signerOnly`) signer.
- [ ] `gasPrice` plus a 1559 fee field is refused with a message naming both.
- [ ] A chain configured as legacy runs a fee-option-free script as legacy transactions end to end, including deterministic deployment bootstrapping.
- [ ] Runs on 1559 chains send exactly what they sent before (assert on the provider requests).
- [ ] The configuration key and its default are documented in the user docs.
- [ ] Tests use `createTestEnvironment`; `pnpm typecheck`, `pnpm test`, `pnpm format:check` pass; a changeset is added (minor for the packages gaining a feature).

## Blocked by

- None.

## Prompt

> Make rocketh able to deploy to and execute on chains that reject EIP-1559 transactions. The gap is in `work/notes/findings/hardhat-deploy-v1-feature-surface.md`, section B; the decision to support these chains was taken by the maintainer.
>
> Enumerate the construction sites yourself before designing: grep for `type: '0x` over `packages/*/src`, excluding `hardhat-deploy-v1-artifacts` (those folders hold multi-megabyte generated files; bound every command with `timeout` and cap output). The finding says there are five; confirm it.
>
> Read the broadcast choke point in `packages/rocketh/src/environment/index.ts` and `CONTEXT.md`'s `signer` entry before touching anything: the three `Signer` variants route differently (`signerOnly` signs locally then sends raw; `remote` and `wallet` go through `eth_sendTransaction`), and a legacy transaction must work on both routes.
>
> A new chain-config field changes `@rocketh/core` types, which AGENTS.md says to do with impact on all packages in mind; name the field and its default in `## Decisions`.
>
> FIRST, check this task against current reality; if the code has moved, route to needs-attention (WORK-CONTRACT.md, "Drift is a needs-attention signal"). Do not write the done record or the commit message yourself.
