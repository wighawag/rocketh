# @rocketh/unknown-signer

`catchUnknownSigner` for rocketh: wrap a privileged call whose `from` is an account rocketh cannot sign for (a Safe multisig, a hardware wallet left unplugged, an air-gapped or governance key) and get back the exact transaction to execute out-of-band instead of halting the run. This is hardhat-deploy v1's helper, with one deliberate call-shape divergence.

The package also exports `withUnknownSignerPolicy`, which chooses the unknown-signer policy for ONE call (see below).

## You may not need this package

Handling an unsignable `from` is built into rocketh. By default (`onUnknownSigner: 'auto'`), a run at a terminal PAUSES: it prints the transaction, waits while you execute it on your Safe, takes back the hash you paste, and continues the same run. One run, no wrapper, nothing to install.

Reach for `catchUnknownSigner` when you specifically want the DEFER workflow instead:

- you are migrating a hardhat-deploy v1 script that already uses it (its main reason to exist), or
- you want the transaction handed back as a value in a run that must never block, and you will re-run afterwards.

Otherwise the built-in interactive flow finishes the job in one run rather than two.

```typescript
import {catchUnknownSigner} from '@rocketh/unknown-signer';
import {execute} from '@rocketh/read-execute';

const deferred = await catchUnknownSigner(env)(() =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
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

## Choosing the policy for one call

The run-level policy (`onUnknownSigner`, resolved as run parameter > chain config > the default `'auto'`) decides what happens when a `from` is unsignable. `withUnknownSignerPolicy` overrides it for a single action:

```typescript
import {withUnknownSignerPolicy} from '@rocketh/unknown-signer';

// on a fork whose run-level policy is 'throw': rehearse the interactive flow, once
const receipt = await withUnknownSignerPolicy(env)('ask', () =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
);
```

It returns whatever the action returned and propagates whatever it threw, so wrapping it in `catchUnknownSigner` still defers as usual. The action is a thunk for the same reason as above. It is the SAME policy frame `catchUnknownSigner` pushes, so the rule is one rule: the innermost override wins, and with none the run's policy applies.

**Capability is a ceiling, not a default.** Asking for `'ask'` here only chooses among what the run can already do: where the run cannot ask a human for text (CI, a non-TTY shell, the browser) it degrades to `'throw'` and nobody is prompted, so a script that hardcodes the override still runs, un-hangable, in CI.

## Getting at the error type

`UnknownSignerError` is re-exported from a SUBPATH, not from the package root:

```typescript
import {UnknownSignerError} from '@rocketh/unknown-signer/errors';
```

The root is deliberately function-only. Its exports are meant to be spread into `extensions` in `rocketh/config.ts`, and every entry there is called as `value(env)` — so a class sitting on the root would be invoked without `new` and refused by name at deploy-script run time. Anything that is not a curried `(env) => …` function therefore lives on a subpath.

## It does not defeat impersonation

The policy frame these wrappers push forces the `throw` path over the interactive `ask` path. It never overrides impersonation: an account the node can sign for, including one `autoImpersonate` took on, is signable and still broadcasts inside the wrapper. To exercise the unknown-signer path on a fork, set `autoImpersonate: false` for the run. See `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`.

## Worked examples

[`test/scenarios.integration.test.ts`](https://github.com/wighawag/rocketh/blob/main/packages/rocketh-unknown-signer/test/scenarios.integration.test.ts) is written as documentation (linked rather than referenced by path, because the published npm tarball ships `dist` and `src` only): a Safe-governed proxy upgrade, the same mechanism firing for a plain `tx`, a deploy, an `execute` and a value transfer, a run that mixes signable and Safe-only steps, and the full execute-on-the-Safe-then-re-run loop. Each test body reads as a deploy script.

For full documentation, visit [rocketh.dev](https://rocketh.dev).
