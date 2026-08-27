# @rocketh/read-execute

Call and transact against your deployments from inside a deploy script. `read` performs a `view`/`pure` call, `execute` sends a transaction to a `nonpayable`/`payable` function, and `tx` sends a raw transaction. All of them are fully typed against the deployment's ABI, so function names and arguments are checked at compile time.

This is how a deploy script does the work that comes _after_ a deployment: wiring contracts together, transferring ownership, seeding state.

## Installation

```bash
# Using pnpm
pnpm add @rocketh/read-execute

# Using npm
npm install @rocketh/read-execute

# Using yarn
yarn add @rocketh/read-execute
```

## Wiring it up

`@rocketh/read-execute` is an **extension**: spread its namespace into `extensions` in `rocketh/config.ts`.

```typescript
// rocketh/config.ts
import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

const extensions = {
	...deployExtension,
	...readExecuteExtension,
};
export {extensions};
```

## Usage

```typescript
// deploy/deploy_Token.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, read, execute, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		const token = await deploy('Token', {
			account: deployer,
			artifact: artifacts.Token,
			args: ['Token', 'TKN'],
		});

		// a view call
		const owner = await read(token, {functionName: 'owner'});

		// a transaction, only when it would change something
		if (owner.toLowerCase() !== admin.toLowerCase()) {
			await execute(token, {
				account: deployer,
				functionName: 'transferOwnership',
				args: [admin],
			});
		}
	},
	{tags: ['Token', 'Token_deploy']},
);
```

Guarding an `execute` with a `read`, as above, is what keeps a deploy script idempotent: re-running it sends no transaction because the on-chain state already matches. `execute` can also do that for you: see [the state guard](#the-state-guard-is-this-call-still-needed) below.

## The functions

### `read(deployment, {functionName, args?})`

A `view`/`pure` call. Returns the decoded return value, typed from the ABI. Takes an optional `account` to use as `msg.sender` for the call.

### `execute(deployment, {account, functionName, args?, value?, message?})`

Sends a transaction and resolves to its **receipt**. `account` is a **named account** or an address, and is required. `value` sends wei to a `payable` function. `message` sets the text shown for this transaction when rocketh has to describe it to a human (for example when the account cannot be signed for).

Remaining fields come from viem's `WriteContractParameters` (minus `address`, `abi`, `account` and `chain`, which rocketh supplies).

### `tx(transactionData, {message?})`

Sends a raw transaction (`{to, data, value, ...}`) with no ABI involved. For the cases that are not a contract call, such as a plain ETH transfer. Like `execute`, it resolves to the transaction **receipt**.

### `evaluateGuard(guard, defaultTarget?)`

Evaluates an `execute` guard (below) on its own, without executing anything, and resolves to the evaluation record. For computing which privileged steps are still pending before doing anything about them.

### `readByName` / `executeByName`

The same as `read` and `execute`, but taking a deployment **name** instead of a deployment object:

```typescript
await executeByName('Token', {account: deployer, functionName: 'transferOwnership', args: [admin]});
```

Convenient when the contract was deployed by a different script. Note that the by-name variants look the deployment up at call time, so a typo surfaces at run time rather than at compile time.

## The state guard: is this call still needed?

`execute` takes an optional `guard`, which DECLARES the on-chain condition under which the call is still needed. rocketh performs the read itself before building any transaction, and skips the call when the chain already satisfies it.

```typescript
const result = await execute(registry, {
	account: 'governance',
	functionName: 'setPoolImpl',
	args: [nextImplementation.address],
	guard: {
		kind: 'call',
		// the effect is observable on ANOTHER contract, which is the common case.
		// omit `on` to read the contract being called.
		on: timelock,
		functionName: 'getOperationState',
		args: [operationId],
		// the value arrives decoded and RAW: compare addresses case-insensitively yourself
		satisfied: (state) => state === OperationState.Done,
	},
});

if (result.outcome === 'skipped') {
	console.log('already done, read', result.evaluation.value, 'from', result.evaluation.target);
} else {
	console.log('sent', result.receipt.transactionHash);
}
```

The guard's `functionName` and `args` are typed against the ABI of the contract it READS, so a renamed getter is a compile error. A guard that throws (a reverting getter, a target that is not deployed) fails the run: it is never treated as "not satisfied", because that would re-send a privileged call that may already have happened.

### `equals`, and selecting one output

The commonest guard is "the value on chain is already the value I want", and `equals` states it in one line instead of a predicate. It is not merely shorter: it compares the value the way its ABI type says the value MEANS, which `===` does not.

```typescript
guard: {
	kind: 'call',
	on: proxy,
	functionName: 'implementation',
	// matches whatever the casing, because a checksummed address and a lowercased
	// one are the same address
	equals: nextImplementation.address,
}
```

- `address` and `bytesN` fold case (checksum casing, and the casing of a role identifier or a salt, carry no meaning)
- `string` is case SENSITIVE (it is user data: two names differing in case are two names)
- a bigint never coerces against a number
- arrays and tuple returns compare elementwise, each position under the rule for its own type

A guard often cares about one component of what a getter returns. `output` selects one of the read function's declared outputs, by name or by position, and the verdict then applies to the selected value:

```typescript
guard: {
	kind: 'call',
	on: accessManager,
	// returns (bool isMember, uint32 executionDelay)
	functionName: 'hasRole',
	args: [operatorRole, operator],
	output: 'isMember',
	equals: true,
}
```

The selector is typed against the ABI outputs, so naming an output that does not exist is a compile error, and `equals` (or `satisfied`) is typed against the selected value. Reaching INSIDE a struct is deliberately not part of this: that is what `satisfied` is for. Note that viem unwraps a single output before the guard sees it, so selection is meaningful when a function declares SEVERAL; naming the only output of a single-output function is accepted and selects that same value.

The evaluation reports all three facts behind a verdict: `value` (the whole return), `selected` (present only when an output was selected) and `expected` (present only when the verdict was an `equals`).

Nothing is persisted. The verdict is derived from the chain on every run, which is what makes a deferred call (below) converge on the re-run instead of being handed to you a second time.

Without a `guard`, `execute` returns the transaction receipt exactly as it always has.

## Calls from an account you cannot sign for

If `account` resolves to an address rocketh has no way to sign for (a Safe, a governance key, an unplugged hardware wallet), the run does not silently continue and does not simply fail. By default it prints the exact transaction, waits while you execute it under that authority, takes back the transaction hash you paste and carries on with the same run. Nothing to install.

In CI, where there is no terminal to ask, the same situation raises `UnknownSignerError` instead of blocking.

If you want the call to hand you the transaction as a value rather than pause, wrap it with [`@rocketh/unknown-signer`](https://www.npmjs.com/package/@rocketh/unknown-signer):

```typescript
const deferred = await catchUnknownSigner(() =>
	execute(token, {account: 'safeOwner', functionName: 'transferOwnership', args: [newOwner]}),
);
```

## Related packages

- [`@rocketh/deploy`](https://www.npmjs.com/package/@rocketh/deploy) - deploy the contracts you then call
- [`@rocketh/viem`](https://www.npmjs.com/package/@rocketh/viem) - viem clients and contract objects, when you want viem's own API
- [`@rocketh/unknown-signer`](https://www.npmjs.com/package/@rocketh/unknown-signer) - defer calls made from a Safe or multisig
- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
