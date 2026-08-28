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

A run is a fork **because of how it was invoked**. There are two ways to invoke one today.

### Through hardhat-deploy

Set `HARDHAT_FORK` to the network you are forking:

```bash
HARDHAT_FORK=mainnet npx hardhat deploy
```

The plugin creates the forking network, passes its provider to rocketh, and builds the fork input for you. The value is both the hardhat network to fork FROM and the rocketh environment whose deployment records are read, so `HARDHAT_FORK=mainnet` reads `deployments/mainnet`. See the [fork testing guide](/hardhat-deploy/documentation/how-to/use-fork-testing/) for the network helpers that set this up.

### Driving `@rocketh/node` yourself

For anvil (or any node you started), call the executor with a fork INPUT instead of an environment name:

```typescript
import {loadAndExecuteDeploymentsFromFiles} from '@rocketh/node';

await loadAndExecuteDeploymentsFromFiles({
	// `fork` names the environment being SIMULATED, which is also the deployments folder read
	environment: {fork: 'mainnet'},
	// see "Saving is unchanged" below: without this, a fork run writes into deployments/mainnet
	saveDeployments: false,
});
```

`{fork: 'mainnet'}` is the whole of the fork input. It also accepts a `chainId`, which states the SIMULATED network's id when the caller happens to know it (`{fork: 'mainnet', chainId: 1}`), and that is what hardhat-deploy would supply on your behalf.

One thing to declare on this path. rocketh asks the node for its chain id only when you hand it a `provider`, and this call does not, so the run takes the id from configuration and fails with `Could not find chainId for environment named "mainnet" (no provider)` when nothing declares one. The `chainId` in the fork input does not answer that question (it describes the simulated network, not the connection), so declare the environment's chain:

```typescript
export const config = {
	environments: {
		mainnet: {chain: 1},
	},
	data: {},
} as const satisfies UserConfig;
```

Against anvil forking mainnet that is also the id the node reports, so both identities agree and nothing is at odds. If you attach to a node that reports something else (a `hardhat node` reports `31337`), pass that node's `provider` on the execution params instead, so the connected id is read from the node rather than from the file.

### There is no `--is-fork` flag yet

`rocketh -e mainnet` is never a fork run: `-e` takes an environment NAME, and a fork is a different kind of input. The planned CLI flag is spelled `--is-fork`, an assertion about the node you are pointing at, and it does not exist yet. (`--fork` is deliberately reserved for a future in-process engine that can actually create a fork, since that word reads as an imperative rocketh cannot honour today.)

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

Declaring `chain` does not make the fork run warn about the node disagreeing with it: the chain-identity check is skipped on a fork precisely because that disagreement is legitimate there.

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

It is the same override bag as `overrides` (an endpoint, tags, impersonation, deterministic-deployment settings, and so on), layered on top of it. The order is `chains[<forked id>]`, then `environments[<network>].overrides`, then `whenForked`, **most specific last**, and the fork layer applies only when the run is a fork. In the example above a fork run gets `confirmationsRequired: 9` and the `mainnet` tags, while a plain `-e mainnet` run gets `2` and never sees the fork's endpoint.

An entry that carries nothing but the fork layer is valid, so saying where a fork listens does not mean declaring a chain you are not using:

```typescript
environments: {
	mainnet: {whenForked: {rpcUrl: 'http://127.0.0.1:8546'}},
}
```

Two things worth knowing about that endpoint. It is only consulted when you did not hand rocketh a `provider` (a provider always wins), which is why the hardhat path never touches it. And because the fork layer sits ON TOP of `overrides`, an `overrides.rpcUrl` naming the real network's endpoint would otherwise be what a fork run dials: if your environment entry has one, name the fork's endpoint in `whenForked` as well.

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

An explicit `false` still wins, at either level, and that is how you exercise the OTHER path deliberately: with impersonation off, the Safe-owned call is `unsignable` again and the run takes the [unknown-signer](../unknown-signers/) route (pause and ask, or defer through `catchUnknownSigner`). That is worth rehearsing too, since it is what the real run will do.

```typescript
// for one run
await loadAndExecuteDeploymentsFromFiles({
	environment: {fork: 'mainnet'},
	saveDeployments: false,
	autoImpersonate: false,
});
```

```typescript
// or for every fork of this network
environments: {
	mainnet: {chain: 1, whenForked: {autoImpersonate: false}},
}
```

Impersonation is a node CAPABILITY and `onUnknownSigner` is a POLICY: they stay orthogonal, and the fork-aware default gives the policy no new value. Details in [Handling unknown signers](../unknown-signers/#on-a-fork-or-in-the-browser-impersonation-instead).

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

## Two things a fork run does not do yet

### Saving is unchanged

Stated precisely, because the difference matters: **core would happily save a fork run into the forked network's folder.** It is the one caller that can fork today, the hardhat plugin, that suppresses saving itself (it passes `saveDeployments: false` whenever `HARDHAT_FORK` is set). So hardhat-deploy users are safe today, and the rule lives in that caller rather than in rocketh.

If you drive `@rocketh/node` (or core) directly with a fork input, nothing suppresses it for you: the environment name IS the forked network's, so the default is to save, and a rehearsal would write into the real records. Pass `saveDeployments: false` yourself, as the example above does. Moving the rule into core is deliberately deferred rather than forgotten.

### There is no CLI flag

Covered above: a fork is reachable through the hardhat plugin's `HARDHAT_FORK` variable or by constructing the fork input programmatically. The planned flag is `--is-fork`.

## See also

- [Handling unknown signers](../unknown-signers/) for the Safe-owned steps a rehearsal exists to exercise, and for turning impersonation off to test the deferral path.
- [Guarding execute calls](../execute-guard/) for making a deferred privileged step converge on the re-run.
- [Production hardening](../production-hardening/) for where a fork rehearsal sits among the other checks before a privileged change.
