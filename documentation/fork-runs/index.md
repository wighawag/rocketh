# Rehearsing a deployment on a fork

A **fork run** is a run against a node that forked a real network: anvil started with `--fork-url`, or a `hardhat node` with forking configured. It is how you rehearse a mainnet deployment (above all a Safe-owned upgrade) against the state that actually exists, before doing it for real.

One sentence explains every behaviour on this page: **a fork run IS the forked network for the purposes of deployment RECORDS, and is NOT that network for the purposes of chain IDENTITY.** It reads `deployments/mainnet` and takes mainnet's settings, while the transactions it builds declare whatever chain id the node in front of it reports. The reasoning is in [ADR 0014](https://github.com/wighawag/rocketh/blob/main/docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md); everything below is what you need to get a rehearsal working.

## rocketh attaches to a fork, it does not create one

You start the node. rocketh is then TOLD that the node it is pointed at is simulating a given network.

```bash
# anvil, which is what most of this page assumes
anvil --fork-url https://my-mainnet-endpoint.example/rpc

# or, at a pinned block
anvil --fork-url https://my-mainnet-endpoint.example/rpc --fork-block-number 18500000
```

anvil listens on `http://127.0.0.1:8545`, which is also where `hardhat node` listens, and it is the endpoint a fork run dials when nothing says otherwise. Nothing has to be configured for the common case; a fork on another port is one line, in [`whenForked`](#saying-what-differs-whenforked) below.

## Telling rocketh the run is a fork

A run is a fork **because of how it was invoked**. There are three ways to invoke one.

### From the command line: `--is-fork`

The flag takes no argument. `-e` already names the environment, and a fork run's environment name IS the forked network's name, so the two together say everything:

```bash
# in one terminal
anvil --fork-url https://my-mainnet-endpoint.example/rpc

# in another
rocketh -e mainnet --is-fork
```

That is the whole of it, with **no configuration file change at all**. The run reads `deployments/mainnet`, takes whatever you have configured for mainnet under `chains[1]`, impersonates so your Safe-owned steps execute, dials `http://127.0.0.1:8545` and writes nothing back. (If you have no `chains[1]` entry, there is nothing to inherit and the run uses the built-in defaults with no tags. That is still the point of the change: it is your mainnet configuration or nothing, never your local dev node's.)

How it works with nothing declared: you handed rocketh no `provider`, so it asks the node itself which chain it is, dialling the endpoint it is about to run against. anvil forking mainnet answers `1`, so `chains[1]` (mainnet's settings) is found on its own. A `hardhat node` answers `31337` and needs one line of configuration, in [the condition](#what-a-fork-run-inherits-and-the-one-condition) below.

**The flag is an assertion about the node you are pointing at, not an instruction to create a fork.** rocketh attaches to a fork somebody else started; it does not start one. That is why the name is `--is-fork` and why plain `--fork` does not exist: that word reads as an imperative, and it is reserved for the day an in-process engine can honour it (it would need somewhere to fork FROM and a block to fork AT). Without the flag, `rocketh -e mainnet` is a real mainnet run, which is exactly what it should be.

A fork on another port, or any other difference, is one line in [`whenForked`](#saying-what-differs-whenforked), and the flag composes with it:

```bash
rocketh -e mainnet --is-fork   # dials whenForked.rpcUrl when you named one
```

If the node is not up, the run stops and says which endpoint it tried, rather than guessing an id and signing for a chain nobody is running.

### Through hardhat-deploy: `HARDHAT_FORK`

Set `HARDHAT_FORK` to the network you are forking, and hardhat creates the fork in process: no node to start.

```bash
HARDHAT_FORK=mainnet npx hardhat deploy

# at a pinned block
HARDHAT_FORK=mainnet HARDHAT_FORK_NUMBER=18500000 npx hardhat deploy
```

The value is both the hardhat network to fork FROM and the rocketh environment whose deployment records are read, so `HARDHAT_FORK=mainnet` reads `deployments/mainnet`. The plugin creates the forking network, passes its provider to rocketh and builds the fork input for you. It needs the network's endpoint, which the network helpers read from `ETH_NODE_URI_mainnet` (`addForkConfiguration` in `hardhat.config.ts`, see [Forking with `HARDHAT_FORK`](/hardhat-deploy/networks/#forking-with-hardhat_fork)).

::: warning A hardhat fork reports chain 31337
The node hardhat creates keeps its own chain id while it simulates mainnet. Without `environments.mainnet.chain` in `rocketh/config.ts`, rocketh looks the settings up under 31337, your local dev chain, and the rehearsal runs with your dev node's tags and settings instead of mainnet's. Declare the chain of every network you rehearse, as in [the condition](#what-a-fork-run-inherits-and-the-one-condition) below:

```typescript
environments: {
	mainnet: {chain: 1},
},
```

:::

The same applies to a `hardhat node` started with forking and reached with `--is-fork`. anvil does not need it: it reports the forked chain's id.

### Driving `@rocketh/node` yourself

For anvil (or any node you started), call the executor with a fork INPUT instead of an environment name:

```typescript
import {loadAndExecuteDeploymentsFromFiles} from '@rocketh/node';

await loadAndExecuteDeploymentsFromFiles({
	// `fork` names the environment being SIMULATED, which is also the deployments folder read
	environment: {fork: 'mainnet'},
});
```

`{fork: 'mainnet'}` is the whole of the fork input. It also accepts a `chainId`, which states the SIMULATED network's id when the caller happens to know it (`{fork: 'mainnet', chainId: 1}`). No shipped caller supplies it today, so on the hardhat path you state it yourself with the one declaration described in [the condition](#what-a-fork-run-inherits-and-the-one-condition) below.

Nothing has to be declared for the connection. You handed rocketh no `provider`, so it asks the node itself which chain it is talking to, dialling the endpoint it is about to run against: `whenForked.rpcUrl` if you named one, else the conventional local endpoint. That is fork-only, and it has to be: off a fork the endpoint is looked up under the chain id, so asking the node first would mean already knowing the answer.

The node's answer WINS over an `environments[<network>].chain` you declared, because it is the only id a transaction can be signed for. Declaring `chain: 1` therefore stays a statement about the network being SIMULATED (it is what a hardhat fork needs, see below), and never becomes the id your transactions carry.

If the node is not up, the run stops and says which endpoint it tried, rather than guessing an id and signing for a chain nobody is running.

## What a fork run inherits, and the one condition

A fork of mainnet is configured **like mainnet**. The deterministic-deployment settings, the unknown-signer policy, the confirmation count, auto-mining, auto-impersonation and the environment **tags** all come from the network being simulated, so a rehearsal predicts the real run. They no longer come from `chains[31337]`, which is where you describe your own local dev node: its `local` tag becoming the tag set of a mainnet rehearsal is exactly the trap this avoids, because deploy scripts branch on tags.

The condition: rocketh has to know the SIMULATED network's chain id, since that is the key it looks the settings up under. It takes the first of

1. the `chainId` supplied with the fork input,
2. `environments[<network>].chain`,
3. the id the node reported.

**On anvil, step 3 is enough and nothing needs declaring.** anvil forking mainnet reports chain id 1 because it is forking mainnet, so `chains[1]` is found on its own.

**On a hardhat node it is not.** That engine reports `31337` while simulating mainnet, so with nothing declared the lookup lands on `chains[31337]`, your dev node's bucket, and you rehearse with the wrong settings and the wrong tags. The remedy is one line, and it is the same line as above:

```typescript
export const config = {
	environments: {
		mainnet: {chain: 1}, // what a fork of `mainnet` is a fork OF
	},
	chains: {
		1: {
			tags: ['mainnet', 'production'],
			confirmationsRequired: 5,
			onUnknownSigner: 'ask',
		},
	},
	data: {},
} as const satisfies UserConfig;
```

Declaring `chain` does not make the fork run object to the node disagreeing with it: the chain-identity check is skipped on a fork precisely because that disagreement is legitimate there. Off a fork the same disagreement is refused and the run stops, because the run would otherwise sign every transaction for whatever chain the node claims to be. The exception is an environment that declares a local development chain (31337 or 1337): that node is on your own machine, so the run warns and continues with the node's id. That is what lets `anvil --fork-url` serve as `localhost`, since anvil keeps the forked network's id. To use a fork with the forked network's deployment records, run it as a fork.

Two things inherit regardless of any of this, because they key on the environment NAME rather than on a chain id: the deployment records, and any `accounts` or `data` entry written under a `mainnet` key. See [Which chain id?](#which-chain-id-two-questions-two-answers) for the entries that key on a number instead.

## Saying what differs: `whenForked`

A fork states only what is true of the FORK, in a `whenForked` sub-key on the forked network's own environment entry:

```typescript
export const config = {
	environments: {
		mainnet: {
			chain: 1,
			overrides: {confirmationsRequired: 2},
			whenForked: {
				rpcUrl: 'http://127.0.0.1:8546', // a fork on a second port
				confirmationsRequired: 9,
			},
		},
	},
	chains: {
		1: {tags: ['mainnet', 'production'], confirmationsRequired: 5},
	},
	data: {},
} as const satisfies UserConfig;
```

It is the same override bag as `overrides` (an endpoint, tags, impersonation, deterministic-deployment settings, and so on), layered on top of it. The order is `chains[<forked id>]`, then `environments[<network>].overrides`, then `whenForked`, **most specific last**, and the fork layer applies only when the run is a fork. That order describes what a fork INHERITS: the tags, policy and deployment semantics. The connection side of a chain entry (`pollingInterval`, `properties`) still comes from the local bucket the run is actually connected to, since it describes the node you are talking to rather than the network you are simulating. In the example above a fork run gets `confirmationsRequired: 9` and the `mainnet` tags, while a plain `-e mainnet` run gets `2` and never sees the fork's endpoint.

An entry that carries nothing but the fork layer is valid, so saying where a fork listens does not mean declaring a chain you are not using:

```typescript
environments: {
	mainnet: {whenForked: {rpcUrl: 'http://127.0.0.1:8546'}},
}
```

Two things worth knowing about that endpoint. It is only consulted when you did not hand rocketh a `provider` (a provider always wins), which is why the hardhat path never touches it. And you do not have to defend against your own `overrides`: a fork run never dials `overrides.rpcUrl`, because on the environment of a real network that is the REAL network's endpoint, and a rehearsal pointed at production is the one outcome none of this may produce. Only `whenForked.rpcUrl` and the conventional local endpoint are ever dialled by a fork.

**Declaring `whenForked` does not fork anything.** It says what differs ONCE a run is a fork, and the conditional name is chosen to say so. A plain `-e mainnet` run of an environment carrying the key behaves exactly as though the key were not there.

## Impersonation is on by default

`autoImpersonate` defaults to **on** for a fork run, and stays off everywhere else. That default is the reason a rehearsal is worth running: impersonation is what makes a node sign for an account you hold no key for, so the Safe-owned or timelock-owned steps EXECUTE and you see the whole upgrade run to the end instead of stopping at the first privileged call.

Only NAMED accounts are impersonation candidates, so the Safe has to appear in `accounts`:

```typescript
export const config = {
	accounts: {
		deployer: {default: 0},
		safeOwner: {default: '0x1111111111111111111111111111111111111111'},
	},
	data: {},
} as const satisfies UserConfig;
```

An explicit `false` still wins, at either level, and that is how you exercise the OTHER path deliberately: with impersonation off, the Safe-owned call is `unsignable` again and the run takes the [unknown-signer](../unknown-signers/) route (pause and ask, or defer). That is worth rehearsing too, since it is what the real run will do.

```typescript
// for one run
await loadAndExecuteDeploymentsFromFiles({
	environment: {fork: 'mainnet'},
	autoImpersonate: false,
});
```

```typescript
// or for every fork of this network
environments: {
	mainnet: {chain: 1, whenForked: {autoImpersonate: false}},
}
```

A Safe stays `impersonated` on a node you reuse. anvil lists an address it has impersonated as one of its own accounts, and keeps listing it, so after a first rehearsal the Safe would look node-held. So when auto-impersonation is on, an account you declared by ADDRESS (`safeOwner: {default: '0x…'}` above) is impersonated and classified `impersonated` whatever the node lists (if the node refuses to impersonate it, it stays `node` when the node lists it and `unsignable` otherwise), and its transactions are captured as such however many runs the node has seen. An account declared by index (`deployer: {default: 0}`) is the node's own and stays `node`. The decision comes from how you declared the account, not from whether it has code, since an EOA can carry code too (EIP-7702). One consequence: a node's dev account written out by its address is labelled `impersonated` during such a run. It still signs, but it is treated as impersonated in every respect, including `fundImpersonatedAccounts` below, which then pays its gas. Declaring it by index keeps it `node`. Signability is per address, so an address declared both ways (by index under one name, by address under another) is `impersonated` under both names.

### Paying the impersonated account's gas: `fundImpersonatedAccounts`

Impersonating the Safe makes the Safe the account that SENDS its calls, and so the one that pays their gas. For real it never is: whoever submits the Safe transaction pays. A Safe usually holds no ETH, so the rehearsal stops at the first Safe call with "insufficient funds".

Turn on `fundImpersonatedAccounts` and rocketh lends an impersonated account the ETH for each of its transactions, then takes it back:

```typescript
export const config = {
	accounts: {
		deployer: {default: 0},
		safeOwner: {default: '0x1111111111111111111111111111111111111111'},
	},
	environments: {
		mainnet: {chain: 1, whenForked: {fundImpersonatedAccounts: true}},
	},
	data: {},
} as const satisfies UserConfig;
```

Just before an impersonated account sends a transaction, rocketh fills in that transaction's gas limit and fees itself, and raises the account's balance by exactly the most it can cost in gas: the gas limit times the max fee per gas (`hardhat_setBalance`, which anvil and hardhat both accept). Once the transaction is mined, it sets the balance to what it would have been had the account paid no gas: the loan and the gas come back out. Only gas is lent: ETH the transaction sends has to come from the account's own balance, so a Safe that cannot afford it fails on the fork as it would for real. A transaction the node refuses gets its loan back straight away. The only moment the account holds more than it has is during its own transaction, and then only by that transaction's gas budget, which matters only to a contract that reads its own balance.

It is off by default, applies only to accounts rocketh impersonated (a key rocketh or the node holds pays as it would for real), and can be set per chain, in `overrides`, in `whenForked` (as above, for fork runs only) or for one run with the `fundImpersonatedAccounts` execution parameter. A run that stops between a transaction and its receipt leaves that loan in place, which on a fork costs nothing. Two transactions from the same impersonated account broadcast at the same moment (a `Promise.all` of two calls) can leave it short; one after the other, as a deploy script runs, they settle exactly.

Impersonation is a node CAPABILITY and `onUnknownSigner` is a POLICY: they stay orthogonal, and the fork-aware default gives the policy no new value. Details in [Handling unknown signers](../unknown-signers/#on-a-fork-or-in-the-browser-impersonation-instead).

## Taking the rehearsal to your Safe

The rehearsal executed those Safe-owned steps by impersonating the Safe, which means the run knows exactly which transactions your multisig now has to send, in what order, and from which address. It keeps that list: `env.capturedTransactions` on the environment the run returns, and `rocketh -e mainnet --is-fork --write-transactions ./batch.json` writes it to a file for whatever tool proposes to your Safe.

The entries you propose are the `impersonated` ones, which is precisely the set that could not have signed for itself. rocketh does not group them for you: it promises the ORDER and tells you who sent each one, and you decide where a batch splits. [Captured transactions](../captured-transactions/) covers reading the split points, and the one case worth knowing about here: with impersonation turned OFF (above), a deferred step never happens, so it produces no entry and the list is what the run DID rather than what it still owes.

## Which chain id? Two questions, two answers

This is where the tools visibly disagree, and it is not a contradiction. A fork run is answering two different questions.

| the question              | the answer                | where you read it                                          | what it decides                                           |
| ------------------------- | ------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| **what am I simulating?** | the network being forked  | `env.network.fork.networkName` (and `.chainId` when known) | configuration lookup, deployment records, semantics, tags |
| **what am I talking to?** | whatever the node reports | `env.network.chain.id`                                     | the `chainId` field of every transaction rocketh builds   |

The second one cannot follow the first. A locally signed transaction commits to its chain id as part of the signature, and a node rejects an id that is not its own, so the only correct value is the one the node in front of you reports.

What the node reports depends on the tool, and both are normal:

| node                   | reports while forking mainnet | so a transaction declares |
| ---------------------- | ----------------------------- | ------------------------- |
| anvil `--fork-url ...` | `1`                           | `1`                       |
| `hardhat node` forking | `31337`                       | `31337`                   |

Neither is a misconfiguration and rocketh warns about neither. anvil is simply indistinguishable from mainnet along every axis rocketh can interrogate (it even serves the real genesis hash), while hardhat's engine keeps its own id.

The practical consequence, and the one thing to check in your config: an `accounts` or `data` entry keyed by a chain NUMBER follows the node, so `{1: '0x...'}` resolves on an anvil fork and falls through to `default` on a hardhat one. Key those entries by the environment name (`{mainnet: '0x...'}`) and they resolve on both.

In a deploy script:

```typescript
if (env.network.fork) {
	console.log(`fork of ${env.network.fork.networkName}, talking to chain ${env.network.chain.id}`);
}
```

`env.network.fork` is absent (falsy) when the run is not a fork, so `if (env.network.fork)` reads naturally. Its `chainId` is present only when it was ESTABLISHED, meaning supplied with the fork input or declared as `environments[<network>].chain`. It is never filled in from the node, because under hardhat that number is the local engine's and calling it "the network being simulated" would be a lie.

## Deployment records

A fork run reads the forked network's folder, `deployments/mainnet`, which is the entire point of forking: your scripts see the real proxies, the real admin, the real addresses, and an idempotent script skips what is already deployed exactly as it would on the real run.

Those records were written on another chain, so the checks that normally protect a folder from being read against the wrong node (the recorded chain id and genesis hash) are skipped on a fork. The same goes for the rule that deletes a dev chain's deployments when its genesis changed: a fork never triggers it.

### A fork does not SAVE, and you do not have to remember that

Reading those records is the point of forking; writing them back is not. **A fork run does not save by default**, on every path: through the hardhat plugin, through `@rocketh/node`, or by calling core yourself. Nothing has to be passed to get that, so a rehearsal cannot write into `deployments/mainnet` because a caller forgot an argument. The rule lives in rocketh itself, which is why the example above passes no `saveDeployments`.

What a fork run saves is therefore in memory only: your scripts see what they just deployed, `env.get('MyContract')` answers, and nothing reaches the folder.

If you really do want a fork run to write, say so, and it writes into the forked network's folder because that is the environment it is:

```typescript
await loadAndExecuteDeploymentsFromFiles({
	environment: {fork: 'mainnet'},
	// an EXPLICIT value outranks the default: this writes into deployments/mainnet
	saveDeployments: true,
});
```

From the command line that is `rocketh -e mainnet --is-fork --save-deployments`. The flag is set-only (there is no `--no-save-deployments`), which is the right shape once the fork default is off: on a fork it is the only way to turn saving on, and it cannot be typed by accident.

That is the whole escape hatch, and it is deliberately the only one: rocketh does not offer a "save a fork somewhere else" destination. There is nowhere else that would be true.

## Checking the result against live contracts

A rehearsal runs your scripts against the real state, so a script can also check what it deployed against the contracts that are already there, and do it only on a fork:

```typescript
import {erc20Abi} from 'viem';
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, read, data, namedAccounts, network}) => {
		const vault = await deploy('Vault', {
			account: namedAccounts.deployer,
			artifact: artifacts.Vault,
			args: [data.usdc],
		});

		if (network.fork) {
			const balance = await read(
				{address: data.usdc, abi: erc20Abi},
				{functionName: 'balanceOf', args: [vault.address]},
			);
			console.log(`vault USDC balance on the fork of ${network.fork.networkName}: ${balance}`);
		}
	},
	{tags: ['Vault']},
);
```

Here `data.usdc` is the token's address per environment ([`data`](../environments/#per-environment-data-data)), which resolves on a fork because data is keyed by the environment name.

## See also

- [Captured transactions](../captured-transactions/) for turning what the rehearsal sent into Safe proposals, and for replaying a deployment inside a Solidity test.
- [Handling unknown signers](../unknown-signers/) for the Safe-owned steps a rehearsal exists to exercise, and for turning impersonation off to test the deferral path.
- [Guarding execute calls](../execute-guard/) for making a deferred privileged step converge on the re-run.
- [A Safe-owned project, end to end](../safe-owned-project/) for a whole rehearsal, from a Safe-owned proxy to the upgrade executed in the Safe app.
- [Production hardening](../production-hardening/) for where a fork rehearsal sits among the other checks before a privileged change.
