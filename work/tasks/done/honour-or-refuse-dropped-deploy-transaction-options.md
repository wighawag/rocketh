---
title: 'A deploy option the type accepts must be honoured or refused, never dropped'
slug: honour-or-refuse-dropped-deploy-transaction-options
blockedBy: []
covers: []
---

## What to build

`@rocketh/deploy` builds its transaction from a construction typed as viem's `DeployContractParameters` (minus bytecode, account, abi and chain: `packages/rocketh-core/src/types.ts:969-972`). That type carries `nonce`. The deploy path does not put it on the wire: the line that would is commented out (`packages/rocketh-deploy/src/index.ts:630`), while the sibling `execute` path DOES honour it (`packages/rocketh-read-execute/src/index.ts:334`). So a script that pins a nonce on a deploy compiles, runs, and silently gets a different nonce, and the two primitives disagree with each other.

Establish the full set first, then fix it as a set. Walk every field the construction type accepts and check whether the deploy path uses it: `nonce` and `gasPrice` are the two known to be commented out (this task handles `nonce`) at `packages/rocketh-deploy/src/index.ts:626, 630`; confirm the rest (`gas`, `value`, `maxFeePerGas`, `maxPriorityFeePerGas`, `accessList`, and anything else the viem type carries) by reading, not by assuming. Enumerate what you found in your report.

For each dropped field, exactly one of two outcomes, chosen per field and justified:

- HONOUR it, matching what `execute` already does, including the `!== undefined` guard rather than a truthiness guard (a nonce of 0 is the first transaction of a fresh account, and the comment at `packages/rocketh-read-execute/src/index.ts:322-326` explains why this spelling is load-bearing).
- REFUSE it loudly at the call, with a message that says what to do instead.

`gasPrice` is OUT of scope here: the maintainer decided to support chains without EIP-1559, and `work/tasks/backlog/support-chains-without-eip-1559.md` owns `gasPrice` end to end. Leave its commented-out line for that task.

## Acceptance criteria

- [ ] Every field the deploy construction type accepts is either used or explicitly refused; the enumeration is in the final report.
- [ ] A deploy with an explicit `nonce` puts that nonce on the wire, including `nonce: 0`.
- [ ] Tests cover both, in the style of the existing `@rocketh/deploy` integration tests, using `createTestEnvironment` and asserting on the transaction the mock provider received.
- [ ] The dead commented-out lines for the fields handled here are gone (the `gasPrice` line stays for its own task).
- [ ] `pnpm typecheck`, `pnpm test` and `pnpm format:check` pass, and a changeset is added (`.changeset/<slug>.md`, patch for `@rocketh/deploy`).

## Blocked by

- None.

## Prompt

> Fix the class of defect where `@rocketh/deploy` accepts a transaction-shaping option in its TYPE and then drops it when building the transaction. Start by enumerating the closed set: open the construction type (`DeploymentConstruction` in `packages/rocketh-core/src/types.ts`, which is viem's `DeployContractParameters` minus four keys) and check each field against the transaction literal in `packages/rocketh-deploy/src/index.ts`. Do not infer the set from a grep.
>
> The reference implementation for how a field should be read is the `execute` path (`packages/rocketh-read-execute/src/index.ts:315-341`), including its `!== undefined` guards and the comment saying why truthiness guards are wrong here. Match it.
>
> `gasPrice` is NOT yours: `work/tasks/backlog/support-chains-without-eip-1559.md` owns it. Do not refuse it and do not implement it.
>
> Tests: `@rocketh/test-utils`'s `createTestEnvironment` builds a REAL environment over a mock provider, so assert on what the provider was asked to send. See `CONTEXT.md` on _test environment_ vs _mock environment_, and do not hand-build an environment literal.
>
> FIRST, check this task against current reality; if the code has moved, route to needs-attention rather than building on a stale premise (WORK-CONTRACT.md, "Drift is a needs-attention signal").
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, above all any field where you chose refuse over honour or the reverse. Do not write the done record or the commit message yourself.

## Decisions

- **`nonce`: honoured, not refused.** This matches `execute` and is what the task asked for. Side effect: if a deterministic deploy first has to create the create2/create3 factory from the same account, that setup transaction takes the pinned nonce, and the deploy transaction then fails at the node with "nonce too low". That failure is loud, not silent, so I did not add a special refusal for `nonce` plus `deterministic`. Alternative considered: refuse that combination. Touches nothing else.
- **`dataSuffix`: refused rather than honoured.** viem would add it to the end of the deployment code. In rocketh that would also change the create2/create3 address, get recorded in `argsData` as if it were constructor arguments (which the verifier then submits), and a later change to it would not trigger a redeploy. Refusing is easy to reverse later; honouring would bake those effects in. The message tells the user to pass the data as a constructor argument instead.
- **`type`: `'eip1559'` accepted, everything else refused, including `'legacy'` and `'eip2930'`.** Before, those were silently sent as type 2. This touches `support-chains-without-eip-1559`: that task can relax the refusal for `'legacy'` when it adds legacy transactions. `gasPrice` itself is neither refused nor implemented, as instructed.
- **`assertChainId`: accepted as a no-op, not refused.** It only affects a client-side check, not the transaction itself. Rocketh takes the chain id from the connected node (`packages/rocketh/src/executor/index.ts`, `getChainIdForEnvironment`), so the check can never fail. Both `true` and `false` produce the same, correct transaction, and refusing `true` (viem's default) would just be hostile. Alternative considered: refuse `false`.
- **Refusals happen before the reuse check.** A refused option throws even when the deployment already exists and would be reused. Otherwise the same script would pass on one run and fail on another depending on what is already deployed.
