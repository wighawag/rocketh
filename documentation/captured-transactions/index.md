# Captured transactions

Every rocketh run remembers what it sent. The list is on the environment the run returns, in the true order the transactions were broadcast, and one flag writes it to a file.

Two people arrive here, wanting different halves of the same list.

- You rehearsed a Safe-owned upgrade against a [fork](../fork-runs/) of mainnet. The run executed the privileged steps by impersonating the Safe, so you now have the transactions your Safe actually has to send, and you need to turn them into the right proposals.
- You deploy with rocketh's TypeScript scripts and test in Solidity, and you want your real deployment sequence as a test fixture, replayed in `setUp()` so the test sees the same contracts at the same addresses.

Neither of them wants a counterfactual, which is why this is one feature rather than two.

## What the list is

Every transaction **this run broadcast**, in the order it broadcast them, each carrying who sent it and what was sent. The entry type is `CapturedTransaction`, exported from `@rocketh/core/types`:

```typescript
type CapturedTransaction = {from: `0x${string}`} & (
	| {
			type: 'intent';
			to?: `0x${string}`;
			value?: `0x${string}`;
			data?: `0x${string}`;
			signability: Signability;
	  }
	| {type: 'raw'; raw: `0x${string}`}
);
```

Two arms, because a run genuinely broadcasts two shapes. An **intent** is a transaction rocketh composed: a deployment, an `execute`, a proxy or diamond upgrade, a value transfer. A **raw** entry is a pre-signed payload rocketh merely relayed, which in practice is the Nick's-method deterministic-deployment factory transaction, broadcast on any chain where that factory is not already there.

A field the transaction did not carry is **absent**, never `null` and never `'0x'`. A contract creation has no `to`. The factory funding transfer genuinely has no `data`, and `'0x'` there would turn a replay of a plain transfer into an empty call. `value` is the 0x quantity the broadcast choke point saw, never a bigint, so the list survives a plain `JSON.stringify`. `from` is kept exactly as the transaction carried it, which may be checksummed, so compare addresses lowercased.

`signability` is on the intent arm **only**. It answers "could rocketh get this signed, and how", and a relayed pre-signed transaction has no such question to answer: rocketh holds no signer for that relayer and never asked for one. Labelling it would say `unsignable` (see below for what that means to a consumer) about the one entry that must be replayed on every fresh chain.

### What an entry does not carry, deliberately

No gas, no fees, no nonce, no transaction hash, no receipt, and no account name.

The fee fields are left out because recording them invites a consumer to replay them, and nobody wants the fee market of the moment a fork rehearsal happened to run. The nonce is left out for the same reason and a stronger one: it is what makes a signed transaction replayable by exactly one sender at exactly one moment, and the whole point of capturing the intent is that a replay may choose its own. The account NAME is left out because `from` is the whole answer: it is what a Safe consumer proposes to and what a replay pranks, and it is unambiguous where a name is not, since several named accounts commonly resolve to one address. The rule behind all of it: capture what cannot be recomputed, omit what can.

## Getting the list, in process

`env.capturedTransactions`, on the environment the run returns. No file, no path to agree on:

```typescript
import {loadAndExecuteDeploymentsFromFiles} from '@rocketh/node';

const env = await loadAndExecuteDeploymentsFromFiles({environment: {fork: 'mainnet'}});

for (const entry of env.capturedTransactions) {
	if (entry.type === 'intent' && entry.signability === 'impersonated') {
		console.log(`${entry.from} must execute ${entry.data ?? '(no calldata)'} on ${entry.to}`);
	}
}
```

Capture is unconditional and needs no flag: a memory run captures exactly as a fork run does. It costs nothing when you ignore it, and a run that asks for nothing writes nothing new anywhere.

## Getting the list, as a file

One flag on the `rocketh` CLI, which takes the output path:

```
--write-transactions <file>  write the transactions this run broadcast, in order, as JSON to <file> (only when the run succeeds)
```

```bash
# in one terminal
anvil --fork-url https://my-mainnet-endpoint.example/rpc

# in another
rocketh -e mainnet --is-fork --write-transactions ./batch.json
```

The flag is on the `rocketh` CLI only: `hardhat deploy` does not take it today. The same option is available when you drive `@rocketh/node` yourself, since it is where the filesystem is allowed:

```typescript
await loadAndExecuteDeploymentsFromFiles({
	environment: {fork: 'mainnet'},
	writeTransactions: './batch.json',
});
```

The file is a bare JSON array of the entries, in broadcast order, indented and newline-terminated so you can read it and diff it between rehearsals. No envelope, no version field, no run metadata: the whole of it is the ordered list, so a Safe batching tool or a Solidity `setUp()` can walk it without knowing anything about rocketh.

```json
[
	{
		"type": "intent",
		"from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
		"to": "0x3fab184622dc19b6109349b94811493bf2a45362",
		"value": "0x2386f26fc10000",
		"signability": "node"
	},
	{
		"type": "raw",
		"from": "0x3fab184622dc19b6109349b94811493bf2a45362",
		"raw": "0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fff..."
	},
	{
		"type": "intent",
		"from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
		"data": "0x60806040...",
		"signability": "node"
	}
]
```

That is a fresh-chain run: the deterministic-deployment factory is funded, then relayed pre-signed, then a contract is created (no `to`).

A few things about the write, all of them consequences of the lifecycle in [What the list does not owe you](#what-the-list-does-not-owe-you) below:

- It happens **once**, at the end, and **only if the run succeeded**. There is no truncate at start and no append as it goes.
- It is **atomic** (written to a temp file in the same directory, then renamed), so no consumer can read a half-written batch. It therefore REPLACES the path rather than writing into it, so pointing it at a FIFO is not a supported way to stream a run.
- A successful run that broadcast **nothing** writes `[]`, replacing whatever was at that path. rocketh is idempotent, so a repeat rehearsal that sends nothing is the common case, and leaving yesterday's batch in place would let you hand a Safe a plan this run did not produce.
- The parent directory is created if missing, so `--write-transactions out/batch.json` works without preparing anything.
- An empty value (`--write-transactions ''`) is refused before the run starts, rather than silently skipping the write and ending a completed rehearsal with no batch and nothing on screen to say why.

## Ordering is the only promise, and rocketh does not segment

The list is the true broadcast order of the run. That is the whole promise, and everything below is built on it.

**rocketh never decides what belongs in one proposal.** It does not group, it does not batch, and it will not guess where your Safe's work starts and ends. You segment the list yourself.

This is the shape of the feature, not a missing half. Segmentation is a judgement about your governance: which calls one proposal may carry, which must be voted separately, what your Safe's execution wrapper looks like, whether two of your Safes may be advanced in either order. rocketh has no way to be right about any of that, and a tool that guesses is worse than one that declines, because a wrong grouping is discovered when a proposal reverts. Refusing to segment keeps rocketh from ever having to be CORRECT about what belongs together, only honest about what happened in what order, which is a far smaller promise and one it can actually keep.

What rocketh does give you is everything you need to segment: the order, the sender, and how each sender was signed for.

## Segmenting it yourself: reading the split points

You segment on `signability`, which is the classification rocketh already computes per address once impersonation has resolved. The four values, and what each one means to a batch consumer:

| `signability`  | what happened                                                      | what a batch consumer does with it                          |
| -------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `local`        | rocketh held signing material and signed it itself                 | nothing: rocketh will send this on the real run too         |
| `node`         | the node held the key and signed it                                | nothing: same                                               |
| `impersonated` | the account could not have signed for itself and the node faked it | **this is the batch**: exactly what the Safe has to execute |
| `unsignable`   | rocketh did not send it at all, a human executed it out of band    | nothing: it has already happened, never propose it again    |

`impersonated` is precisely the set that could not have signed for itself, which on a fork rehearsal is precisely the set your Safe must execute. `unsignable` is its mirror image: the run reached the [unknown-signer](../unknown-signers/) seam, and under the `ask` policy a human executed the transaction and pasted the hash back, so the entry records something that has already happened. A batch consumer proposes the `impersonated` entries and never the `unsignable` ones, so it cannot re-propose work that is already done. A `raw` entry is neither: it is a pre-signed payload anybody may relay, and it is never a Safe proposal.

A segment boundary is a change in `signability` **or** in `from` between consecutive entries. The second half matters as much as the first: two consecutive `impersonated` entries from DIFFERENT Safe addresses are two proposals, not one, because they are executed by different bodies.

### A worked example

A fork rehearsal of a mainnet upgrade, where the proxy is owned by one Safe and the treasury parameters by another. The file that came out:

```json
[
	{
		"type": "intent",
		"from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
		"data": "0x60806040...",
		"signability": "node"
	},
	{
		"type": "intent",
		"from": "0x1111111111111111111111111111111111111111",
		"to": "0x4444444444444444444444444444444444444444",
		"data": "0x9623609d...",
		"signability": "impersonated"
	},
	{
		"type": "intent",
		"from": "0x2222222222222222222222222222222222222222",
		"to": "0x5555555555555555555555555555555555555555",
		"data": "0xa9059cbb...",
		"signability": "impersonated"
	},
	{
		"type": "intent",
		"from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
		"to": "0x4444444444444444444444444444444444444444",
		"data": "0x3659cfe6...",
		"signability": "node"
	}
]
```

That is four entries and four segments:

1. `node`, your deployer. The new implementation contract. rocketh sends this itself on the real run, so it is not part of any proposal.
2. `impersonated`, from the **proxy admin Safe** `0x1111...`. One proposal.
3. `impersonated`, from the **treasury Safe** `0x2222...`. A second proposal, even though it sits next to the first and shares its signability, because the `from` changed and a different set of signers has to execute it.
4. `node` again. Back to your deployer.

The order also tells you something no grouping could: entry 2 happened before entry 4, and the rehearsal proved that sequence works. If your real run has to wait for a Safe to execute before it can continue, the list is where you read that dependency.

Turning that into segments is a few lines, and the shape is the same whichever tool you feed:

```typescript
import type {CapturedTransaction} from '@rocketh/core/types';

/** What a segment is keyed on: the sender, and how it was signed for. */
const segmentKey = (entry: CapturedTransaction) =>
	`${entry.type === 'raw' ? 'raw' : entry.signability}:${entry.from.toLowerCase()}`;

function segment(transactions: readonly CapturedTransaction[]): CapturedTransaction[][] {
	const segments: CapturedTransaction[][] = [];
	let previous: string | undefined;
	for (const entry of transactions) {
		const key = segmentKey(entry);
		if (key !== previous) {
			segments.push([]);
		}
		segments[segments.length - 1].push(entry);
		previous = key;
	}
	return segments;
}

// what you take to your Safes, in the order the rehearsal proved
const proposals = segment(transactions).filter(
	(entries) => entries[0].type === 'intent' && entries[0].signability === 'impersonated',
);
```

Splitting FURTHER is always safe, and is sometimes what your governance requires. Merging two segments is the decision rocketh will not make for you.

::: tip A rehearsal that produced `unsignable` entries is telling you something
On a fork, impersonation is what makes the privileged steps execute, so a rehearsal should produce no `unsignable` entries at all. If it did, impersonation was off for that run and you got instructions instead of a batch. See [Impersonation is on by default](../fork-runs/#impersonation-is-on-by-default).
:::

## Why an intent, and not the signed transaction

A signed transaction commits to its nonce as part of the signature, so it can only ever be replayed by that sender, at exactly that nonce. An intent can be replayed at any nonce, under any prank, in any order. For every consumer on this page, an intent is therefore MORE replayable than a signed payload, not a lossy substitute for it.

And for the fork-rehearsal case there is nothing else to capture anyway: an impersonated sender never produces a signature. The node fabricates the sender, so no signed payload exists anywhere in the process to record.

The one place a signed payload IS captured is the `raw` arm, and only because rocketh did not compose that transaction. The canonical deterministic-deployment factory address derives from that exact sender at that exact nonce, so decoding it into an intent and replaying it from anybody else would land the factory somewhere else. It is designed to be replayed verbatim by anyone, so it is captured as itself.

## Replaying the list in a Solidity test

This is the fixture story: your deploy scripts run in TypeScript, your tests are in Solidity, and you want the tests to see the deployment your scripts really produce.

Capture the list on a run against a **memory node fresh from genesis**, write it out, and replay it in `setUp()`.

### The address guarantee, and its condition

**Replaying the captured transactions reproduces the same contract addresses, when four things hold.**

1. The **capture** run itself started from a chain fresh from genesis. A capture taken on a fork of mainnet was sent from accounts that already had a nonce history there, so replaying it on a fresh chain gives DIFFERENT addresses.
2. The replay is **in list order**.
3. The replay is **from the same senders**.
4. The replay is against a chain **fresh from genesis**.

The reason is nonces. A plain contract address is derived from the sender and that sender's nonce, so the addresses match exactly when each sender arrives at each creation with the nonce it had at capture, and that is what those four terms secure between them. A deterministic (create2 or create3) deployment does not depend on the sender's nonce, but it does need the factory to be there, which is what the `raw` entry puts there.

Drop any of the four and the guarantee is gone. A fork rehearsal's batch is not a fixture, and a fixture replayed onto a chain that has already done something else is not one either.

### Replaying an intent: `vm.prank`, whatever the signability

**Every INTENT entry is replayable in Solidity, whatever its `signability` says.** A Solidity test needs no key and no node capability to act as another address: `vm.prank` sets `msg.sender` directly, and it is unconditional. So an `impersonated` entry replays exactly like a `local` one, and there is no "allow impersonation" setting to go and find. What requires real impersonation is the CAPTURE side, where a node genuinely has to fake a sender; the replay side has a cheatcode.

An intent with a `to` is a call from the pranked sender. An intent with no `to` is a contract creation, so it has to be replayed as a CREATE from that sender, which is what makes its address derive from that sender's nonce.

### Replaying a raw entry: this differs by test runner

A `raw` entry is a pre-signed payload, so it is not pranked, it is submitted, and the two Solidity test runners do not agree on whether they can submit one.

- **Under `forge`**: `vm.broadcastRawTransaction(bytes)` submits it, so the entry replays verbatim, and the factory lands at its canonical address.
- **Under `hardhat test solidity`**: it does not work. EDR 0.15.0 declares `broadcastRawTransaction` in its `Vm` interface but routes it to `unsupported`, alongside `getWallets`, `startBroadcast`, `stopBroadcast` and `getFoundryVersion`, while `prank`, `etch` and `loadAllocs` are all supported. Calling it there fails as an unsupported cheatcode, on the first entry of a fresh-chain list.

Under hardhat, place the factory another way instead of relaying it. `vm.etch` at its canonical address is supported, and so is `vm.loadAllocs`:

```solidity
// the default create2 factory rocketh uses, and its runtime code
vm.etch(
	0x4e59b44847b379578588920ca78fbf26c0b4956c,
	hex"7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3"
);
```

The funding transfer that precedes the raw entry in the list exists to pay for that relay, so when you `vm.etch` the factory instead, it has nothing left to do and can be skipped too. And if your fixture deploys nothing deterministically, there is no factory in your list at all and none of this applies.

### A `setUp()`, under forge

```solidity
// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

contract DeploymentFixture is Test {
	address constant DEPLOYER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
	address constant FACTORY_RELAYER = 0x3fab184622dc19b6109349b94811493bf2a45362;

	function setUp() public {
		// entry 1: an intent with no `data`, funding the factory relayer
		vm.deal(DEPLOYER, 100 ether);
		vm.prank(DEPLOYER);
		(bool funded, ) = FACTORY_RELAYER.call{value: 0x2386f26fc10000}("");
		require(funded, "funding the factory relayer");

		// entry 2: a raw entry, replayed verbatim (forge only)
		vm.broadcastRawTransaction(hex"f8a58085174876e800830186a08080b8536045...");

		// entry 3: an intent with no `to`, so a CREATE from the recorded sender
		bytes memory initcode = hex"60806040...";
		vm.prank(DEPLOYER);
		address deployed;
		assembly {
			deployed := create(0, add(initcode, 0x20), mload(initcode))
		}
		require(deployed != address(0), "creation reverted");

		// entry 4: an ordinary intent, from whoever the entry says
		vm.prank(DEPLOYER);
		(bool ok, ) = address(0x4444444444444444444444444444444444444444).call(hex"3659cfe6...");
		require(ok, "replay reverted");
	}
}
```

Assert the addresses you expect rather than assuming them: the four conditions above are easy to break by accident, and an address that has quietly moved is the failure this fixture exists to catch early.

### What a fixture run has to turn ON

A Solidity-fixture run is a **memory** run, not a [fork run](../fork-runs/), and `autoImpersonate` defaults to on **only for a fork**. So a governance-owned step in a fixture run is not impersonated by default: the account classifies `unsignable`, reaches the unknown-signer seam, and throws (or asks) instead of executing. Turn it on explicitly for the run:

```typescript
await loadAndExecuteDeploymentsFromFiles({
	environment: 'memory',
	autoImpersonate: true,
	writeTransactions: './fixture-transactions.json',
});
```

or for the chain your fixture runs against:

```typescript
export const config = {
	accounts: {
		deployer: {default: 0},
		safeOwner: {default: '0x1111111111111111111111111111111111111111'},
	},
	chains: {
		31337: {autoImpersonate: true},
	},
	data: {},
} as const satisfies UserConfig;
```

Remember that only NAMED accounts are impersonation candidates, so the Safe has to appear in `accounts`.

**Why the default is not simply flipped for memory runs.** The unknown-signer scenarios deliberately build an unsignable account on a memory-shaped environment, which is how the deferral path is exercised at all. Defaulting impersonation on there would silently disable exactly the path those runs exist to test. On a fork the default is right because a rehearsal that stops at the first privileged call has not rehearsed anything.

**An `unsignable` entry in a fixture run is a SIGNAL, not something to replay around.** It means the run reached the seam rather than executing the step, so the list records what rocketh ASKED for and a human answered out of band. Two things follow. The captured intent is the REQUEST, and the transaction that actually landed may have been wrapped (a Safe execution goes TO the Safe, carrying the call inside it), so the intent is the cleaner thing to replay anyway. And its presence in a fixture run almost always means impersonation was off, which is the paragraph above. The remedy is to fix the run, not to filter the list.

## What the list does not owe you

**A failed run writes nothing.** A run that throws leaves no file at all, and leaves an existing file at that path byte for byte as it found it. There is no partial batch, and no half-written file for a consumer to catch mid-write.

That is deliberate, and the reasoning is about the run modes this output is designed for. On a fork or a memory node **nothing real happened**, so a run that halted halfway has not produced a smaller truth, it has produced a misleading one: an operator who executes a partial batch sends a subset of the work believing it is the whole, which is worse than executing none of it. A throw is a real error, and the fix is to fix it, not to publish half a plan.

The flag is not gated on the run mode, so it is worth knowing where that reasoning stops. On a run against a **real network** a mid-run failure means transactions really were sent, and no file is written even so. Recovering from that is what rocketh's pending-transaction records are for, not this file.

**But a successful run is not automatically a complete plan.** There is a second way for the list to be incomplete, and it does not involve a failure at all. A transaction DEFERRED under the `throw` policy never happened, so it produces no entry, and `catchUnknownSigner` swallows that error so the script keeps going and the run SUCCEEDS. The file is then written, missing exactly the privileged calls you still have to execute.

So read the list as **what the run DID, and not what it still owes**. If your run defers its privileged steps (through `catchUnknownSigner`, or by turning impersonation off on a fork to exercise the deferral path), the transactions you have to execute are the ones `catchUnknownSigner` handed back to your script, and they are not in this list by design. That boundary is what keeps this feature from turning back into a collector of transactions that never happened.

One smaller gap, for completeness: transactions a PREVIOUS run broadcast and this one merely adopted through pending-transaction recovery never passed this run's broadcast point, so they are not in this run's list either.

**And nothing here is a source of truth.** Nothing in rocketh ever reads this list or this file back to decide anything: it is not consulted for idempotency, it does not make a step "done", and deleting it changes no future run. That is what keeps it clear of [ADR 0012](https://github.com/wighawag/rocketh/blob/main/docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md)'s warning about a record acquiring authority. Idempotency stays where it always was, in on-chain state ([ADR 0006](https://github.com/wighawag/rocketh/blob/main/docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md), and [Guarding execute calls](../execute-guard/)).

## See also

- [Rehearsing a deployment on a fork](../fork-runs/) for starting the run that produces a batch, what it inherits from the network it simulates, and the two chain ids involved ([ADR 0014](https://github.com/wighawag/rocketh/blob/main/docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md)).
- [Handling unknown signers](../unknown-signers/) for the privileged calls a rehearsal exists to exercise, and for what `signability` means outside this page.
- [Guarding execute calls](../execute-guard/) for making a deferred privileged step converge on the re-run.
- [Testing your deploy scripts](../testing/) for the TypeScript-side harness, which is a different thing from a Solidity fixture.
