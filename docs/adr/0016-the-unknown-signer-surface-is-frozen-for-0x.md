# The unknown-signer surface is a published API, frozen for the whole 0.x line

`catchUnknownSigner` and the rest of the unknown-signer handling are what a project with a Safe, a multisig or a governance contract as owner builds its deploy scripts, wrappers and batch proposers on. So they are released as a documented, versioned feature with a stability promise, while every rocketh package stays on 0.x (maintainer decision, 2026-10-27). The release tooling keeps the packages on 0.x (a guard refuses graduating to 1.x), so "no breaking change without a major version" would promise nothing. Instead, as ADR 0015 does for the deployment record, the surface listed below is FROZEN for the whole 0.x line: **nothing in it is removed, renamed, or given a different meaning in any 0.x release.** Such a change can only come with 1.0 or a later major.

This is the strict choice, taken knowing it may prove hard to keep. The alternative was the 0.x convention (a breaking change may ship as a 0.x minor, flagged in the changelog), which would make every minor a possible break for exactly the scripts that can least afford one: those whose mistakes cost a duplicated governance action. If the promise ever has to give, it changes through a new ADR that supersedes this one, published before the release that relies on it, with the migration spelled out. A release never weakens it silently.

## What is promised

The promise binds the package that exports each item.

`@rocketh/unknown-signer`, root export (`packages/rocketh-unknown-signer/src/index.ts`):

- `catchUnknownSigner(env)(action, options?)`: `action` is a THUNK (a function returning the call to wrap; a promise is refused, the one deliberate divergence from hardhat-deploy v1). It resolves to `null` when the action ran to completion, otherwise to `CaughtUnknownSignerTransaction`, `{from, to, value, data}`: hardhat-deploy v1's shape exactly, every key present even when `undefined`, `value` a string. The FIRST unsignable transaction inside the action is the one returned. Nothing is persisted. `options.log` (default `true`) prints the transaction. These are pinned by `packages/rocketh-unknown-signer/test/v1-parity.integration.test.ts` and `catchUnknownSigner.integration.test.ts`.
- `withUnknownSignerPolicy(env)(policy, action)`: runs a thunk under one `UnknownSignerPolicy` for every transaction inside it, resolving to the action's own result.
- The exported types `CaughtUnknownSignerTransaction`, `CatchUnknownSignerOptions`, `UnknownSignerAction`, `CatchUnknownSignerFunction` and `WithUnknownSignerPolicyFunction`, as far as they describe the above.

`@rocketh/unknown-signer/errors` and `@rocketh/core` (`packages/rocketh-core/src/errors.ts`):

- `UnknownSignerError`, recognisable by `instanceof` and by `name === 'UnknownSignerError'`, carrying `data: UnknownSignerErrorData`.
- `UnknownSignerErrorData`: `from`, and when the transaction had them `to`, `data`, `value`, plus `contract` (`UnknownSignerContractCall`: `method`, `args`, and the optional `name`) when the transaction came from a contract call.

`rocketh` and `@rocketh/core` (the policy):

- `UnknownSignerPolicy`, the values `'throw'`, `'ask'` and `'auto'`, with their meaning: `throw` defers (the error above); `ask` pauses the run and accepts the hash of the transaction executed out of band, and where the run cannot ask a human for text it degrades to `throw`; `auto` is `ask` where the run can ask and `throw` otherwise. An unattended run never waits.
- Where the policy is set and in what order, most specific first: per call (`withUnknownSignerPolicy`, and `catchUnknownSigner`, which forces `throw`), the run (`ExecutionParams.onUnknownSigner`), the chain (`chains[id].onUnknownSigner`, `overrides`, `whenForked`), the config (`UserConfig.onUnknownSigner`), then the default `'auto'`.
- The pause under `ask`: it accepts a pasted transaction hash, refuses to record anything until that transaction is found on the network and succeeded, accepts the answer `cannot sign` to defer instead, and continues the same run.

The CLIs (`@rocketh/node`'s `rocketh`, `hardhat-deploy`'s `deploy` task):

- `--on-unknown-signer throw|ask|auto`, and `--skip-prompts` forcing `throw`.

## What is not promised

- The WORDING of every message: the deferral block, the pause, the acceptance line. They are for humans and keep improving. A tool must read `UnknownSignerError.data` and the returned value, never parse text.
- How strongly a pasted hash has to match before it is accepted without asking (the evidence tiers in `packages/rocketh/src/environment/pastedTransactionIntent.ts`), and how many times the pause re-asks. These may only get stricter in what they accept silently.
- Fields ADDED later. Adding an optional field to `UnknownSignerErrorData` or `UnknownSignerContractCall` is not breaking; the optional `abi` on `UnknownSignerContractCall` was added that way. `CaughtUnknownSignerTransaction` is the exception: it stays exactly v1's four keys, since a script may compare or forward it whole.
- Internal names, and anything not exported from the entry points above.
