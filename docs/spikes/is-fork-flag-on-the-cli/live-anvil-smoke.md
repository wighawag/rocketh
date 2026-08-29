# `--is-fork` against a real node: what was actually run

The acceptance criterion for `--is-fork` says the zero-configuration path must be CONFIRMED end to end rather than assumed, because it is the one a reader tries first. The automated tests (`packages/rocketh-node/test/cli-is-fork-flag.test.ts`) fake the network boundary so they can assert WHICH url is dialled; this is the complementary check, the built CLI binary driving a real node from a real project directory. Captured 2026-08-29, on the branch that added the flag.

## The project

A throwaway project outside the repo, with no build step and no compiler: `package.json` (`"type": "module"`), a `rocketh.js` config, one deploy script under `deploy/`, and pre-existing records under `deployments/mainnet/` marked with mainnet's chain id and a genesis hash the local node cannot possibly serve (that mismatch is what a fork run has to be lenient about to read the folder at all). `node_modules/rocketh`, `node_modules/@rocketh/node` and `node_modules/@rocketh/core` were symlinks to the workspace packages, and the CLI was invoked as `node <workspace>/packages/rocketh-node/dist/cli.js`, so the BUILT bin script ran, not a test double.

The deploy script only prints what the environment resolved to and then calls `env.save`, so the run sends no transaction: it reads, and it tries to write.

```js
// deploy/001_probe.js
import {setupDeployScripts} from 'rocketh';
const {deployScript} = setupDeployScripts({});
export default deployScript(
	async (env) => {
		console.log(
			'PROBE ' +
				JSON.stringify({
					fork: env.network.fork,
					connectedChainId: env.network.chain.id,
					tags: env.network.tags,
					saveDeployments: env.context.saveDeployments,
					readRecords: Object.keys(env.deployments),
					existingAddress: env.getOrNull('MyContract')?.address,
				}),
		);
		await env.save('SmokeContract', {
			abi: [],
			address: '0xffffffffffffffffffffffffffffffffffffffff',
			argsData: '0x',
			bytecode: '0x',
			deployedBytecode: '0x',
			linkReferences: {},
		});
	},
	{tags: ['probe']},
);
```

## 1. A fork of mainnet on another port, named by `whenForked`

`anvil --port 8546 --chain-id 1` stands in for `anvil --fork-url <mainnet>`: rocketh only ever asks the node `eth_chainId`, and an anvil forking mainnet answers `1`. The config declared nothing but where the fork listens.

```js
environments: {mainnet: {whenForked: {rpcUrl: 'http://127.0.0.1:8546'}}},
chains: {1: {tags: ['mainnet', 'production'], confirmationsRequired: 1}, 31337: {tags: ['local']}},
```

```
$ rocketh -e mainnet --is-fork --skip-prompts
PROBE {"fork":{"networkName":"mainnet"},"connectedChainId":1,"tags":{"mainnet":true,"production":true},
       "saveDeployments":false,"readRecords":["MyContract"],
       "existingAddress":"0xabc0000000000000000000000000000000000000"}
$ ls -a deployments/mainnet
.  ..  .chain  MyContract.json
```

The descriptor names the network, the SIMULATED network's tags are what the run got (not the dev node's `local`), mainnet's records loaded on a node that is not mainnet, and `SmokeContract.json` is absent: the save went to memory only.

## 2. The same command WITHOUT the flag

Nothing else changed. It is not a fork, so nothing dials to discover an id, and a `mainnet` run with no provider and no declared chain has nowhere to get one:

```
$ rocketh -e mainnet --skip-prompts
Error: Could not find chainId for environment named "mainnet" (no provider)
```

That is the pre-existing behaviour of a named run, and it is the sharpest possible demonstration that the flag, not the configuration, is what makes a run a fork.

## 3. Zero configuration, on the conventional local endpoint

The config was reduced to `{accounts: {deployer: {default: 0}}, data: {}}`: no `environments`, no `chains`. The node on `http://127.0.0.1:8545` in this case was a `hardhat node`, which is the OTHER shape of fork (it reports `31337` while simulating another network), so this run also covers the tool that does not report the forked chain's id.

```
$ rocketh -e mainnet --is-fork --skip-prompts
PROBE {"fork":{"networkName":"mainnet"},"connectedChainId":31337,"tags":{},"saveDeployments":false,
       "readRecords":["MyContract"],"existingAddress":"0xabc0000000000000000000000000000000000000"}
```

With NOTHING declared the run found the node on the conventional endpoint, asked it which chain it was, adopted `31337` for transactions (which is what that engine will accept), still read `deployments/mainnet`, and still refused to write. The empty `tags` are the documented hardhat-fork caveat rather than a defect: no `chains[31337]` entry existed in this config, and declaring `environments.mainnet.chain: 1` is the one line that makes a hardhat fork inherit mainnet's settings (see `documentation/fork-runs/index.md`, "What a fork run inherits, and the one condition").
