# Guarding execute calls (is this call still needed?)

Every other rocketh primitive asks whether the work is already done. `deploy` compares the deployed bytecode, `deployViaProxy` compares the proxy's current implementation. `execute` asks nothing: it sends whatever you hand it, on every run.

For an idempotent setter that is a wasted transaction. For a privileged call it is worse, and worst exactly where it matters most. When the `from` is a Safe or a governance contract, rocketh cannot sign, so it hands the transaction to you and you execute it out of band ([Handling unknown signers](../unknown-signers/)). rocketh never saw that happen and is not allowed to pretend it did, so the next run surfaces the identical transaction again. Follow the instructions twice and a mint, a transfer, an increment or a nonce-bearing governance action has happened twice.

A `guard` closes that gap. It DECLARES the on-chain condition under which the call is still needed; rocketh performs the read itself, before it builds anything, and skips the call when the chain already satisfies it.

This is what a script does today, by hand, at every call site:

```typescript
const current = await read(registry, {functionName: 'getPoolImpl'});
if (current.toLowerCase() !== next.address.toLowerCase()) {
	await execute(registry, {account: 'governance', functionName: 'setPoolImpl', args: [next.address]});
}
```

and this is the same thing declared:

```typescript
await execute(registry, {
	account: 'governance',
	functionName: 'setPoolImpl',
	args: [next.address],
	guard: {kind: 'call', functionName: 'getPoolImpl', equals: next.address},
});
```

They are not merely two spellings. Because the read is DECLARED rather than hidden inside your `if`, rocketh can report exactly what it read when it skips a step, compare the value the way its ABI type says the value means (which the hand-written `if` above gets right only because it remembered to lowercase both sides), and evaluate the condition without executing anything.

`guard` is an option on `execute` and `executeByName`, from `@rocketh/read-execute`. Nothing else to install if you already call contracts.

## The worked example: an upgrade through a ProxyAdmin

This is the topology the feature was built for, and the one that needs every part of it.

You call `upgradeAndCall` on the ProxyAdmin, because that is the contract holding the upgrade right. The thing that changes is on the PROXY, one level away. And a transparent proxy routes every non-admin call to its implementation, so it deliberately exposes no `implementation()` getter: there is nothing to call. The only observable evidence that the upgrade landed is the [EIP-1967](https://eips.ethereum.org/EIPS/eip-1967) implementation slot.

```typescript
import {deployScript, artifacts} from '../rocketh/deploy.js';

/** bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1) */
const EIP1967_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

export default deployScript(
	async ({deploy, execute, get, namedAccounts}) => {
		const {deployer} = namedAccounts;

		// signable: we ship the new implementation ourselves
		const next = await deploy('Vault_Implementation', {
			account: deployer,
			artifact: artifacts.Vault,
			args: [],
		});

		const proxy = get('Vault_Proxy');
		const proxyAdmin = get('Vault_ProxyAdmin');

		// NOT signable: the ProxyAdmin is owned by the Safe
		await execute(proxyAdmin, {
			account: 'safe',
			functionName: 'upgradeAndCall',
			args: [proxy.address, next.address, '0x'],
			guard: {
				kind: 'storage',
				// the call goes to the ADMIN, the effect lands on the PROXY
				on: proxy,
				slot: EIP1967_IMPLEMENTATION_SLOT,
				// a slot carries no ABI, so the guard says how to read the word
				as: 'address',
				equals: next.address,
			},
		});
	},
	{tags: ['Vault_upgrade']},
);
```

Run it before the Safe has acted and the upgrade transaction is surfaced for you to execute. Run it again afterwards and the step is skipped, because the slot now holds `next.address`. Nothing in the script changed between the two runs.

## The two kinds, and the contract each one reads

| kind              | what it does                                              | what it declares                                |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------- |
| `kind: 'call'`    | an `eth_call` on a view function, decoded through its ABI | `on?`, `functionName`, `args?`, and the verdict |
| `kind: 'storage'` | an `eth_getStorageAt` on one slot                         | `on?`, `slot`, `as`, and the verdict            |

`on` is the contract to READ, and it defaults to the contract being executed. Reading a DIFFERENT contract is the common case rather than the exception: you call a ProxyAdmin and read the proxy, you call a registry and read the proxy behind it, you call a registry and read `owner()` on the contract you just registered. Aave V3's `PoolAddressesProvider` is the sharpest version of this, because it owns its proxies directly with no ProxyAdmin anywhere and its own `getPool()` returns the same proxy address before and after an upgrade: a guard reading the registry would be satisfied on a run where the work is still needed, and would skip an upgrade that has to happen. The observable effect is one level down, on the proxy, exactly as above.

`on` takes what `read` takes: a deployment, or anything with an `address` and an `abi`. For a slot read the ABI is not used at all, so a contract rocketh does not hold a record for can be named inline:

```typescript
guard: {
	kind: 'storage',
	on: {address: '0x...', abi: []},
	slot: EIP1967_IMPLEMENTATION_SLOT,
	as: 'address',
	equals: next.address,
}
```

`as` is REQUIRED for a storage guard and closed to four values: `address`, `bytes32`, `uint256`, `bool`. It is not a convenience. A slot carries no ABI, so without it there is neither a decoded value to judge nor a type for the comparison to key off, and both would have to be guessed. An `address` is the low 20 bytes of the word, checksummed on the way out, which is what every EIP-1967 reader does. A word that cannot BE what you declared (a `bool` slot holding neither 0 nor 1, which usually means the slot is PACKED and holds several variables) fails the run rather than being guessed at.

A `call` guard's `functionName` and `args` are typed against the ABI of the contract it READS, not of the one being executed, so a renamed getter is a compile error.

## What a run does with it

A guarded call returns the outcome rather than a bare receipt, because on the skipped path there is no transaction and no receipt to return:

```typescript
const result = await execute(registry, {
	account: 'governance',
	functionName: 'setPoolImpl',
	args: [next.address],
	guard: {kind: 'call', functionName: 'getPoolImpl', equals: next.address},
});

if (result.outcome === 'skipped') {
	console.log('nothing to do; the chain already says', result.evaluation.value);
} else {
	console.log('sent', result.receipt.transactionHash);
}
```

An UNGUARDED `execute` is untouched: it still returns the receipt exactly as before, so no existing call site changes. What is refused is a guard that may or may not be there (`guard: condition ? myGuard : undefined`), because the return type cannot then be decided at compile time. Write the branch instead, with the whole call on each side.

A skipped step says so, on one line, through the same user-message channel the deferred-transaction block prints through (so it respects `--log-level`):

```text
skipped upgradeAndCall: the guard on slot 0x360894a1...382bbc of 0x1111...1111 read the address 0x5FbD...0aa3, expected 0x5FbD...0aa3
skipped setPoolImpl: the guard on "getPoolImpl" of 0xaaaa...aaaa read 0x5FbD...0aa3, expected 0x5FbD...0aa3
skipped setPoolImpl: the guard on "hasRole" of 0xbbbb...bbbb with args (42, 0xffff...ffff) read [true,3600], output "isMember" is true, expected true
skipped setPoolImpl: the guard on "getPoolImpl" of 0xaaaa...aaaa read 0x5FbD...0aa3, accepted by its satisfied() predicate
```

(Addresses and slots are abbreviated above to fit the page. A run prints them whole, on purpose: a truncated address cannot be grepped or compared against your script.)

That line is worth reading rather than scrolling past, because a skip is the one outcome that leaves nothing else behind. A guard pointed at the wrong contract or the wrong slot produces a run that looks exactly like a run where the work was genuinely already done. The line names the contract that was READ, which for the proxy example above is the proxy and never the admin.

The path that SENDS stays silent: it leaves a transaction behind, which is its own evidence, and a script with dozens of guarded steps cannot afford two lines each.

## Stating the verdict: `equals` or `satisfied`

A guard states its verdict once, either way.

`equals` is the commonest guard there is, "the value on chain is already the value I want", and it is the form to reach for. `satisfied` is a predicate over the DECODED value, for the conditions no equality can state, most often a negation:

```typescript
/** enum OperationState {Unset, Waiting, Ready, Done} */
const DONE = 3;

guard: {
	kind: 'call',
	on: timelock,
	functionName: 'getOperationState',
	args: [operationId],
	// needed UNLESS the operation reached its terminal state: Unset, Waiting and
	// Ready are all "not yet", so there is no single value to equal
	satisfied: (state) => state === DONE,
}
```

### Selecting one output

A guard often cares about one component of what a getter returns. `output` selects one of the read function's declared outputs, by name or by position, and the verdict applies to the selected value:

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

Without this you would have to assert the execution delay too, a value you neither know nor care about. The selector is typed against the ABI outputs, so an output that does not exist is a compile error, and the verdict is typed against the selected value. Selection feeds `satisfied` as well, not only `equals`. Reaching INSIDE a struct is deliberately not part of it: that is what `satisfied` is for.

## The comparison rule, and why it is not `===`

`equals` compares the value the way its ABI type says the value MEANS. That is possible only because the read is declared: an `address`, a `bytes32` and a Solidity `string` all arrive as a JavaScript string, so a comparison keyed off `typeof` cannot tell them apart and is guaranteed to be wrong for one of them.

| ABI type          | rule                    | why                                                                                |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `address`         | case-insensitive        | a checksummed address and a lowercased one are the SAME address                    |
| `bytes`, `bytesN` | case-insensitive        | the casing of a role identifier, a salt or a merkle root carries no meaning        |
| `string`          | case-SENSITIVE          | user data: a symbol `Rocketh` and a symbol `rocketh` are two different symbols     |
| integers          | strict, no coercion     | a `uint256` decodes to `42n` and a `uint32` to `42`; neither is silently the other |
| arrays, tuples    | elementwise, same rules | each position is judged by ITS own declared type                                   |

So an `address[]` you wrote in lowercase matches the checksummed list the decoder produced, while a struct's `label` field still has to match exactly. A `storage` guard goes through the same rule, keyed off the `as` you declared, which is why a slot holding a lowercased address matches a checksummed constant in your script.

## Trap 1: `satisfied` hands you the value RAW

This is the trap to know, because it is invisible in review and expensive in production.

`equals` applies the rule above. `satisfied` does not: it hands you the decoded value untouched and every comparison inside it is yours. Write `===` on an address and you have silently opted out of the case folding, and the comparison is wrong in a way that LOOKS right, because both sides are the same address spelled two ways. viem returns a decoded address CHECKSUMMED whatever the node sent, and rocketh checksums an address decoded from a slot too, while the value you hold it against comes from wherever you got it: a literal pasted from a block explorer, a config file, an environment variable, an address in a JSON record.

```typescript
// WRONG: the read comes back checksummed, `next.address` may be lowercase, and this
// says "not satisfied" for ever
guard: {kind: 'call', functionName: 'getPoolImpl', satisfied: (current) => current === next.address}
```

A guard that is wrong in this direction never skips. On a Safe-governed call that means the privileged transaction is surfaced again on every re-run, for an upgrade that already happened, which is precisely the double execution the guard exists to prevent.

Two correct forms. Prefer the first, which is the reason `equals` exists:

```typescript
// RIGHT: let equals compare it, keyed off the ABI type
guard: {kind: 'call', functionName: 'getPoolImpl', equals: next.address}

// RIGHT when the condition genuinely needs a predicate: fold BOTH sides yourself
guard: {
	kind: 'call',
	functionName: 'getPoolImpl',
	satisfied: (current) => current.toLowerCase() === next.address.toLowerCase(),
}
```

The same applies to a `bytes32` role identifier or salt compared inside a predicate. If your condition can be stated as an equality, state it as one.

## Trap 2: a guard that cannot answer FAILS the run

A guard that throws is never treated as "not satisfied". It aborts the run, before the transaction is built, and nothing is broadcast.

This is deliberate, and it is the asymmetry that makes a guard safe to rely on. An error while evaluating is not evidence that the call is still needed: the guard told you nothing at all. Falling through to executing would hand the operator a privileged transaction they may already have executed out of band, and rocketh cannot see that they did. Failing loudly costs a re-run and a fixed script; failing open costs a duplicated governance action.

In practice, what aborts:

- a getter that reverts (a timelock asked about an unknown operation, an accessor that requires initialisation)
- a `call` guard against an address that holds no code, typically **a contract that has not been deployed yet**: a guard cannot read something a later step in the same script creates, and reading nothing is an abort rather than a "not yet"
- a node that refuses `eth_getStorageAt`, or a word that does not fit its declared `as`
- your own `satisfied` predicate throwing (a `.toLowerCase()` on an undefined component, say)
- a guard with no target (no `on`, and no contract being executed to default to) or with neither `equals` nor `satisfied`

The failure arrives as a `GuardEvaluationError` naming the guard, the function or slot it reads and the contract it reads it on, with the underlying failure kept whole on `cause`:

```text
the guard on "getOperationState" of 0xbbbb...bbbb could not be evaluated, so nothing was executed: execution reverted: TimelockController: unknown operation
```

```typescript
import {GuardEvaluationError} from '@rocketh/read-execute/errors';
```

A guard against a KNOWN deployment that momentarily returns no data is retried first, the same retry `read` performs; it is the exhausted read that is fatal.

## Trap 3: the guard is what makes a deferred run converge, and not a substitute for care

A guard does not make a privileged call safe. It answers one question, "has the effect landed", and it answers it from the chain. Whether the transaction you are about to approve in your Safe does what you believe is a different question, answered by reading the transaction and by rehearsing the upgrade on a fork ([Production hardening](../production-hardening/)).

What it does do is close the loop. Here is the whole story for a Safe-owned ProxyAdmin, using the script at the top of this page unedited:

1. **Run 1.** The proxy still points at the old implementation, so the guard is not satisfied and the call is still needed. rocketh builds the transaction, cannot sign for the Safe, and defers it: you get `{from, to, value, data}` printed, or returned to you if you wrapped the call in [`catchUnknownSigner`](../unknown-signers/#deferring-instead-of-asking-catchunknownsigner).
2. **Out of band.** You execute that transaction on your Safe. rocketh is not involved and observes nothing.
3. **Run 2.** The guard reads the implementation slot, finds the new implementation, and skips the step. No transaction is built, the unknown-signer path is never reached, `catchUnknownSigner` returns `null` because there was nothing left to catch, and the run completes instead of aborting.

Run 2 with the Safe still not having acted defers the identical transaction again, which is the point: the skip is earned from chain state, never remembered. That is also the answer to "why not just record that I did it": under a deferral rocketh observed nothing, so it may assert nothing (see the reasoning below).

The two questions stay separate, in this order. The guard asks "is this needed", and only then does the signer question, "can we sign it", arise at all. A satisfied guard reaches neither, and an unsatisfied guard on an unsignable account defers exactly as it did before guards existed.

## What the guard is not

**It persists nothing.** No marker, no "already executed" file, no state of any kind is written, and no later run consults anything but the chain. Idempotency here is chain-derived, exactly as it is for `deploy` and `deployViaProxy`. A reader who assumes the guard remembers its verdict will build on a guarantee that does not exist.

**It is optional, and there is no way to require it.** There is no mandatory mode and no project-level switch to demand a guard on every call. The ABSENCE of a guard is how a call says it has no observable on-chain effect worth checking, or that you accept it re-running. Guard the calls that would hurt if they happened twice.

**It is not a batch planner.** It answers whether one call is still needed. You can also evaluate a guard on its own, without executing anything, which is how you compute what is still outstanding before you go and do something about it. Shown curried below, since this is typically done outside a deploy script; inside one, `evaluateGuard` arrives on the environment like `execute` does, with no `env` to thread:

```typescript
import {evaluateGuard} from '@rocketh/read-execute';

const evaluation = await evaluateGuard(env)({
	kind: 'storage',
	on: proxy,
	slot: EIP1967_IMPLEMENTATION_SLOT,
	as: 'address',
	equals: next.address,
});

if (!evaluation.satisfied) {
	console.log(`still pending: the proxy points at ${evaluation.value}`);
}
```

The evaluation record is the same one a guarded `execute` returns: for a call, the `target`, `functionName`, `args`, the whole `value` read, the `selected` output where one was selected and the `expected` value where one was given; for a slot, the `target`, `slot`, the raw 32-byte `word`, the `as` it was read under, and the decoded `value`.

## Why it is shaped this way

The obvious shape, `guard: async () => boolean`, is the one deliberately not built: it is the hand-written read-then-`if` relocated inside the call, and it teaches rocketh nothing, so there would be nothing to report on a skip and nothing to evaluate without running it. Why the guard is a declared read, and why the comparison is keyed off the ABI type, is in [ADR 0013](https://github.com/wighawag/rocketh/blob/main/docs/adr/0013-the-execute-guard-is-a-declared-read.md). Why a chain-derived guard is the correctness mechanism rather than an optimisation, and why a persisted "I already did this" record cannot replace it, is in [ADR 0012](https://github.com/wighawag/rocketh/blob/main/docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md).
