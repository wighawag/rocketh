# @rocketh/unknown-signer

`catchUnknownSigner` for rocketh: wrap a privileged call whose `from` is an account rocketh cannot sign for (a Safe multisig, a hardware wallet left unplugged, an air-gapped or governance key) and get back the exact transaction to execute out-of-band instead of halting the run. This is hardhat-deploy v1's helper, with one deliberate call-shape divergence.

```typescript
import {catchUnknownSigner} from '@rocketh/unknown-signer';

const deferred = await catchUnknownSigner(env)(() =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo'}, [newImplementation.address]),
);

if (deferred) {
	// {from, to, value, data} — execute this on the Safe, then re-run the script.
}
```

## The one divergence from v1: the action is a thunk

v1 accepted `Promise | (() => Promise)`. Here it is a **function only**:

```typescript
// v1
await catchUnknownSigner(execute(...));

// rocketh
await catchUnknownSigner(env)(() => execute(...));
```

A promise argument has already started executing before the wrapper is called, so there is no moment at which to establish the unknown-signer policy for it; accepting one would give you a wrapper that silently does not do its job. The v1 form therefore fails to compile, and a JavaScript caller gets a runtime error naming the fix. The RETURN value is unchanged, so migrating a v1 script is the import plus this one mechanical change.

## What you get back

`null` when the action ran to completion, otherwise `{from, to, value, data}` — v1's shape exactly: every key present even when `undefined`, `value` as a string, and no `contract` (that exists only to enrich the printed message).

Pass `{log: false}` to suppress the printed block and only take the returned value.

## One wrapper captures one transaction

The error unwinds the wrapped action, so the FIRST unsignable transaction inside it is the one you get back and everything after it in that action is skipped. Deferring several steps means one `catchUnknownSigner` per step.

## Nothing is persisted

There is no unsigned-transactions file and no other side effect, exactly as in v1. Idempotency comes from on-chain state alone: execute the deferred transaction on your Safe, re-run your idempotent script, and its on-chain state check skips the completed step.

## It does not defeat impersonation

The policy frame this wrapper pushes forces the `throw` path over the interactive `ask` path that ships later. It never overrides impersonation: an account the node can sign for, including one `autoImpersonate` took on, is signable and still broadcasts inside the wrapper. To exercise the unknown-signer path on a fork, set `autoImpersonate: false` for the run. See `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`.

For full documentation, visit [rocketh.dev](https://rocketh.dev).
