# Handling unknown signers (Safe / multisig owners)

Sooner or later a deploy script has to make a call that it is not allowed to make itself: a proxy upgrade, a diamond cut, an ownership transfer, a treasury change. The `from` is a Safe, a timelock, a governance contract or a hardware wallet, and rocketh has no way to produce a signature for it. That address is **unsignable**.

You do not need to install anything or restructure your script to handle this. It is built into rocketh, and by default it pauses and asks you.

## The default: rocketh asks, you execute, the run continues

With the default policy (`onUnknownSigner: 'auto'`) and a terminal attached, rocketh does not fail on an unsignable `from`. It **pauses**: it prints the exact transaction that has to happen, and waits.

You go and execute that transaction wherever its authority lives (your Safe, a hardware wallet, an air-gapped machine, a governance proposal), then paste the resulting transaction hash back. rocketh waits for it to be mined, checks it, saves the deployment state, and **carries on with the same run**.

That is the whole workflow. There is no re-run dance, nothing to install, and an upgrade with several privileged steps pauses at each one and finishes them all in a single run.

### At the pause you have two answers

- **Paste the transaction hash.** rocketh looks the transaction up on the network, waits for it to be mined, requires the receipt to report a SUCCESSFUL status, saves state through the same pending-transaction path a normal broadcast uses, records the hash for gas reporting, and returns the receipt to your script. It never sends a transaction of its own. A hash this node has never heard of (from the wrong network, or a typo that is still the right shape) is given a short grace period to show up and then reported as not found, with the transaction you still have to execute printed again, so the run stops rather than waiting for ever.
- **`cannot sign`** (or just press enter). rocketh prints the full transaction and raises `UnknownSignerError`, which is the [defer workflow](#deferring-instead-of-asking-catchunknownsigner) below. Aborting the prompt (Ctrl-C) does the same. A paste that is not a transaction hash is re-asked a couple of times and then also defers.

### In CI it does not hang, it throws

"Can the run ask a human for text?" is a CAPABILITY of the runtime, not a preference: it is true only when the run carries a `PromptExecutor` that implements `promptText`. `@rocketh/node` (the `rocketh` CLI and the hardhat-deploy path) supplies one **only when stdin is a terminal**; `@rocketh/web` deliberately never does, because a browser cannot sensibly ask you to paste a transaction hash.

So a CI job, whose stdin is not a terminal, has no text capability at all and takes the `throw` path. It never blocks on a prompt, even under `'auto'` and even if a script hardcodes `'ask'`. Capability is a CEILING, not a default.

(The TTY check is not politeness: the underlying prompt library, asked a question with no terminal behind it, never answers and never fails, so the only safe move is not to ask.)

## What rocketh checks before recording anything

You pasted a hash. rocketh does not simply believe it.

### A deployment is anchored to an address

A DEPLOYMENT from an unsignable `from` is held to a stricter standard than an execution, because it has an address to check against:

- **an ordinary deployment** is recorded at the address the pasted transaction's OWN receipt reports as created;
- **a deterministic (or factory) deployment**, whose address was computed from bytecode and salt before broadcast, is recorded at that expected address only once rocketh has seen CODE at it on-chain. It confirms by looking for the code, never by parsing the transaction, so it does not matter what wrapper your multisig executed it inside.

Anything else FAILS, saving nothing: a receipt that reports no created contract (or the zero address), an expected address with no code at it, a transaction that did not succeed, or a node that cannot answer the code lookup at all (unable to confirm is not the same as confirmed, so the run fails rather than recording a deployment nobody verified). The error names the deployment, the hash you pasted and the transaction that still needs executing, so a wrong hash cannot quietly leave you with a deployment record pointing at an address holding nothing.

This applies to the interactive path only. A deployment rocketh broadcast itself is unaffected and gains no new check: it sent that transaction, so there is nothing to distrust.

### An execution is weighed on evidence

For an EXECUTION there is no address to anchor on, so rocketh weighs whether the transaction you pasted looks like the one it asked for. It cannot simply compare `to` and `data`: a governed execution is routinely wrapped by the multisig into a different shape, so a mismatch is not evidence of a mistake. It ranks the evidence instead:

| what it finds                                                 | what that is                                    |
| ------------------------------------------------------------- | ----------------------------------------------- |
| same `to`, `data` and `value`                                 | the transaction itself                          |
| sent TO the account rocketh needed to act as                  | what every Safe execution looks like            |
| your calldata appears verbatim inside the transaction's input | a Safe `execTransaction`, MultiSend, a timelock |
| none of the above                                             | nothing linking the two                         |

The first three are accepted, and the run says which one matched. The last one PAUSES and asks you to confirm before recording anything, because it is genuinely ambiguous: governance executed by proposal id (the payload was queued in an earlier transaction) carries no trace of your calldata, and so does an unrelated transaction you pasted by mistake. Anything but an explicit `yes` defers the transaction exactly as `cannot sign` does, saving nothing.

ACCEPTED RESIDUAL RISK, stated rather than engineered around: no wallet ABI is decoded, so the evidence is structural rather than semantic, and a user who deliberately confirms the wrong transaction is believed. What is no longer possible is recording an unrelated transaction SILENTLY.

## Choosing the behaviour (`onUnknownSigner`)

| value     | what happens when a `from` is unsignable                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `'auto'`  | **the default**: `ask` when the run can ask a human for text, `throw` when it cannot |
| `'ask'`   | pause and ask, when the run can ask a human for text; otherwise behave as `throw`    |
| `'throw'` | raise `UnknownSignerError` immediately, without ever asking                          |

It is resolved as CLI flag / execution parameter > chain config > top-level config > the default `'auto'`.

Set it for a whole chain in `rocketh/config.ts`:

```typescript
export const config = {
	accounts: {/* ... */},
	chains: {
		11155111: {onUnknownSigner: 'ask'},
	},
	data: {},
} as const satisfies UserConfig;
```

Set it once for EVERY chain with the top-level key, so "never prompt me anywhere" does not have to be repeated per chain entry (a `chains[id]` entry still overrides it):

```typescript
export const config = {
	accounts: {/* ... */},
	onUnknownSigner: 'throw',
	data: {},
} as const satisfies UserConfig;
```

or for one run, which wins over both:

```typescript
await loadAndExecuteDeploymentsFromFiles({environment: 'sepolia', onUnknownSigner: 'ask'});
```

or for one INVOCATION from your shell, which is the same run-level lever:

```bash
rocketh -e sepolia --on-unknown-signer throw
pnpm hardhat deploy --network sepolia --on-unknown-signer throw
```

`--skip-prompts` (on both CLIs) forces `throw`, because the interactive resolver IS a prompt. It wins over an explicit `--on-unknown-signer ask`: asking to be prompted and not prompted at once is a contradiction, and not prompting is the safe half.

## On a fork or in the browser: impersonation instead

`@rocketh/web` implements no text prompt today, so a browser run cannot ask you to paste a transaction hash: `'ask'` (and `'auto'`) take the `throw` path there, exactly as in CI. That is a deliberate absence rather than an oversight: asking in a browser means a real UI integration point (a modal, a form, somewhere for the answer to come from), which is a different kind of thing from reading a line of stdin, and nothing forces that decision yet.

It is also not a dead end. On a FORK or a dev node there is a better answer than interactivity anyway: let the account be IMPERSONATED, which resolves it BEFORE the unknown-signer seam so no policy is ever consulted and nothing has to be executed out-of-band.

Rehearsing your Safe-owned steps on a fork of the network you are about to upgrade is the main reason to do this, and it needs no switch: impersonation is ON by default for a fork run. [Rehearsing a deployment on a fork](../fork-runs/) covers how to start one, what it inherits from the network it simulates, and the two chain ids involved.

```typescript
// rocketh/config.ts
export const config = {
	accounts: {
		deployer: {default: 0},
		// the Safe / timelock / owner you want the fork to sign for MUST be named here
		safeOwner: {default: '0x1111111111111111111111111111111111111111'},
	},
	data: {},
} as const satisfies UserConfig;
```

```typescript
// in the browser (@rocketh/web), against a fork or dev node
import {setupEnvironment} from '@rocketh/web';

const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, {});
await loadAndExecuteDeploymentsFromModules(modules, {provider, autoImpersonate: true});
```

Three constraints make this work, and none of them is a formality:

- **Naming the addresses is MANDATORY, not merely convenient.** Only NAMED accounts are impersonation candidates. An address that appears nowhere in `accounts` (an unnamed account, or a bare `from` passed to a call) is never impersonated, however capable the node is, and still lands on the unknown-signer seam. Naming is necessary but not on its own sufficient: the candidates are the named accounts the NODE would otherwise have to sign for, so a named account that already resolves to its own signer (a private key, a wallet) signs directly and is never impersonated, which is what you want anyway.
- **It needs a node that implements the impersonation RPC**, meaning a fork or a dev node (anvil, hardhat). Against a real chain the account simply stays unsignable and the run takes the throw-and-defer path, which is the CORRECT outcome: nothing should be able to fake a signature on mainnet.
- **`autoImpersonate` is RUN-level, not per-transaction.** It is set for the whole run (execution parameter or chain config), like every other node capability. There is no per-call impersonation knob; a per-call variant is a separate, out-of-scope idea.

If you enable it against a node that does NOT implement the RPC, the attempt is swallowed (that is what lets the switch be harmless on an ordinary provider), but the unknown-signer error you eventually get SAYS SO: it tells you auto-impersonation was enabled and `hardhat_impersonateAccount` was refused, or that this account was never a candidate at all (it is not one of the named accounts the node would have to sign for). With auto-impersonation off, the error says nothing about it at all.

Note that this is a NODE CAPABILITY and `onUnknownSigner` is a POLICY: they are orthogonal, and there is no `'impersonate'` policy value. Impersonation runs first and, when it works, the policy is never reached.

## Deferring instead of asking (`catchUnknownSigner`)

Everything above needs no extra package. `catchUnknownSigner` is the **other** workflow: instead of pausing to ask, the run captures the transaction, hands it back to your script as a value, and stops that branch of work.

You want it in two situations:

- **You are migrating a hardhat-deploy v1 script that already uses it.** This is its main reason to exist, and the migration is nearly mechanical (see the call-shape note below).
- **You deliberately want the non-interactive flow**: a run that must never block, that collects the transaction to execute out-of-band, and that you will re-run afterwards.

If neither applies, prefer the default interactive flow: it finishes the job in one run instead of two.

It lives in its own package:

```bash
npm install -D @rocketh/unknown-signer
```

Register it as an extension in `rocketh/config.ts`, exactly like `@rocketh/deploy` and `@rocketh/read-execute`:

```typescript
import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';
import * as unknownSignerExtension from '@rocketh/unknown-signer';

const extensions = {...deployExtension, ...readExecuteExtension, ...unknownSignerExtension};
export {extensions};
```

and then it arrives on the environment your deploy script is handed, with no `env` to thread:

```typescript
export default deployScript(
	async ({deploy, execute, catchUnknownSigner, namedAccounts, artifacts}) => {
		// NOTE the call shape: the action is a FUNCTION, not an already-started promise.
		//  This is the one mechanical change from a hardhat-deploy v1 script
		//  (v1: `catchUnknownSigner(execute(...))`), because a promise has already begun
		//  executing before the wrapper can establish its policy scope. The v1 form is a
		//  compile error, and a JavaScript caller gets a runtime error naming the fix.
		const deferred = await catchUnknownSigner(() =>
			execute(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
		);

		if (deferred) {
			// {from, to, value, data}: execute this on the Safe, then re-run the script.
		}
	},
	{tags: ['Upgrade']},
);
```

Outside a deploy script (a test, a standalone script) you have an `Environment` in hand rather than an enhanced one, so call the same functions curried:

```typescript
import {catchUnknownSigner} from '@rocketh/unknown-signer';
import {execute} from '@rocketh/read-execute';

const deferred = await catchUnknownSigner(env)(() =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
);
```

Both forms are the same function: an extension package's root exports only curried `(env) => …` functions, which is precisely what lets the spread above turn them into methods on the environment.

It returns `null` when the action succeeded, and otherwise hardhat-deploy v1's exact shape: every key present even when `undefined`, `value` as a string. Pass `{log: false}` to suppress the printed block. Nothing is persisted: idempotency comes from on-chain state, so you execute the transaction on your Safe and re-run the idempotent script. One wrapper captures one transaction (the first unsignable one inside it), so deferring several steps means one `catchUnknownSigner` per step.

### What closes the loop on the re-run

"Re-run the idempotent script" is doing a lot of work in that sentence, so be precise about what makes the second run converge. rocketh did not send the deferred transaction and never saw one land, so it may not record that the step happened: the only thing that can tell run 2 the work is done is the CHAIN.

That is automatic for some of the steps rocketh guards itself, and it is worth knowing which. `deployViaProxy` compares the proxy's current implementation, read from its EIP-1967 slot, so a re-run after the Safe acted skips the upgrade with nothing declared by you. A DETERMINISTIC `deploy` (create2 or create3) does the same, because it can compute the address it would use and ask the chain whether code is already there. A plain `deploy` cannot: its address depends on the sender's nonce, so it has nothing to ask about and instead compares against the saved deployment RECORD, which a deferred run never wrote. Expect a deferred plain deploy to be offered to you again on the next run. It is NOT automatic for an `execute`, which sends whatever it is handed: without a chain check, run 2 prints the identical privileged transaction and executing it a second time is a real loss for a mint, a transfer, an increment or a governance action carrying its own nonce.

[Guarding execute calls](../execute-guard/) is how you state that check: one `guard` option declaring what to read on chain, so the deferred step is SKIPPED once its effect has landed, and the same transaction is never handed to you twice.

```typescript
const deferred = await catchUnknownSigner(() =>
	execute(proxyAdmin, {
		account: 'safeOwner',
		functionName: 'upgradeAndCall',
		args: [proxy.address, newImplementation.address, '0x'],
		// run 1 defers this; run 2, after the Safe executed it, reads the proxy's
		// EIP-1967 implementation slot, is satisfied, and skips the step entirely
		guard: {
			kind: 'storage',
			on: proxy,
			slot: EIP1967_IMPLEMENTATION_SLOT,
			as: 'address',
			equals: newImplementation.address,
		},
	}),
);
```

The same applies to the `throw` path above, which is what a CI run takes: the guard is what a re-run needs, whichever way the transaction was deferred.

A wrapped action never pops a prompt at you, whatever the ambient policy is, because you already said you would handle the transaction yourself. The one thing that overrides that is an EXPLICIT override written inside the wrapper, because policy frames nest and the innermost one wins, so `catchUnknownSigner(env)(() => withUnknownSignerPolicy(env)('ask', ...))` does prompt. That is deliberate: the guarantee is about the policy you did not state, not about silencing one you wrote yourself a line later.

### `catchUnknownSigner` is not a "never send" switch

It catches the case where rocketh CANNOT sign. It does not make a signable account unsignable: if the run holds a key for that account, or the node signs for it, or auto-impersonation took it on, the transaction is signable and it BROADCASTS inside the wrapper. That is what keeps a mixed run working, where most steps are yours to send and one belongs to a Safe.

So a production run that unexpectedly has the admin key in its environment sends the admin transaction rather than deferring it. If that matters to you, assert it, rather than inferring it from the wrapper:

```typescript
const admin = env.resolveAccount('admin');
if (env.addressSignability[admin.toLowerCase() as `0x${string}`] !== 'unsignable') {
	throw new Error(`refusing to run: rocketh can sign for ${admin}, which must stay external`);
}
```

`addressSignability` is computed after auto-impersonation runs, keyed by lowercase address, and answers `'local'`, `'node'`, `'impersonated'` or `'unsignable'` (an address never seen during setup answers `'unsignable'` rather than `undefined`, so there is no third case to handle). Rehearsing the whole flow on a fork remains the stronger check, since it proves the transaction works rather than only proving who could have sent it.

For the same reason, neither `catchUnknownSigner` nor `withUnknownSignerPolicy` defeats impersonation: to exercise the unknown-signer path on a fork, set `autoImpersonate: false` for the run ([Impersonation is on by default](../fork-runs/#impersonation-is-on-by-default)).

## Overriding the policy for one call (`withUnknownSignerPolicy`)

The policy applies to the whole run. `withUnknownSignerPolicy` overrides it for a single action, typically to REHEARSE the interactive flow on a fork before doing it on mainnet:

```typescript
import {withUnknownSignerPolicy} from '@rocketh/unknown-signer';

// this one call pauses and asks, even though the run's policy is 'throw'
const receipt = await withUnknownSignerPolicy(env)('ask', () =>
	execute(env)(proxy, {account: 'safeOwner', functionName: 'upgradeTo', args: [newImplementation.address]}),
);
```

It takes a function for the same reason `catchUnknownSigner` does, returns whatever the action returned, and propagates whatever it threw (so wrapping it in `catchUnknownSigner` still defers). Precedence is one rule: the innermost override wins, then the run parameter, then the chain config, then the default `'auto'`.

It accepts the whole policy vocabulary, `'auto'` included, not just `'ask'` and `'throw'`. Per call, `'auto'` means "use this run's capability-aware default for this one action", which is the only way to opt a single call back OUT of a run-level `'throw'` without deciding for it what to do instead.

The override chooses among what the run can do; it cannot exceed it. Asking for `'ask'` where the run cannot ask a human for text still takes the `throw` path and never prompts, so a script that hardcodes the override is still safe in CI.
