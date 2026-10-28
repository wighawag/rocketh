# Deterministic addresses

A normal deployment lands at an address derived from the deployer and its nonce, so the same contract gets a different address on every chain and on every fresh dev node. A **deterministic** deployment goes through a factory instead, and its address follows from inputs you control. Use it for a contract that must have the same address everywhere (a registry, a factory of your own, a singleton other projects hard-code), and for two contracts that must each know the other's address before either exists.

## Deploying deterministically

`deterministic` is an option of `deploy` (and of the deploy functions built on it):

```typescript
// CREATE2 with a zero salt
await deploy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['']},
	{deterministic: true},
);

// CREATE2 with your own salt (left-padded to 32 bytes)
await deploy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['']},
	{deterministic: '0x01'},
);

// CREATE3 with a salt
await deploy(
	'GreetingsRegistry',
	{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['']},
	{deterministic: {type: 'create3', salt: '0xa1'}},
);
```

`true` and a hex string are CREATE2; `{type: 'create2' | 'create3', salt?}` names the kind (a missing salt is zero).

The two kinds derive the address from different things, and the difference decides which to use:

| Kind    | The address depends on                                                      | So                                                                                                                              |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| CREATE2 | the factory, the salt and the creation code (bytecode and constructor args) | any change to the code or the arguments is a new address; whoever deploys, the same code lands at the same place on every chain |
| CREATE3 | the factory, the salt and the deploying account                             | the address survives code and argument changes; the same account and salt give the same address on every chain                  |

With CREATE3 a salt is spent once per account: a second contract deployed from the same account with the same salt is refused, since the address already holds the first one. A re-run that finds this contract's own code there treats it as already deployed.

Deterministic deployments of `@rocketh/proxy` implementations (`deterministicImplementation`), of diamond facets (deterministic by default) and of routes (the router's `deterministic` option) use the same mechanism.

## Knowing the address before deploying: `computeDeterministicAddress`

`computeDeterministicAddress` returns the address a deterministic `deploy` will land on, without sending anything. Give it the artifact, the constructor arguments and the same `account`, `deterministic` (and `libraries`) the `deploy` call will get. This is what lets two contracts reference each other:

```typescript
import {zeroAddress} from 'viem';
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, computeDeterministicAddress, namedAccounts}) => {
		const {deployer} = namedAccounts;
		const deterministic = {type: 'create3', salt: '0xa1'} as const;

		// A's address, before A exists. A create3 address ignores A's constructor arguments.
		const {address: a} = await computeDeterministicAddress(artifacts.A, [zeroAddress], {
			account: deployer,
			deterministic,
		});

		const b = await deploy('B', {account: deployer, artifact: artifacts.B, args: [a]});
		await deploy('A', {account: deployer, artifact: artifacts.A, args: [b.address]}, {deterministic});
	},
	{tags: ['A', 'B']},
);
```

It never broadcasts, even on a chain where `deploy` would first have to deploy a factory: the address is computed from the chain's configuration with the same derivation and salt handling `deploy` uses.

- **For CREATE2** it makes no request at all. The constructor arguments and libraries are part of the address, so they must be the ones `deploy` will get.
- **For CREATE3** it reads the chain once and also returns `occupied`: whether the address already holds code. It does not say whose: it may be this contract from an earlier run, or another contract deployed from the same account with the same salt, which `deploy` would refuse.

The result promises an address, it does not reserve it.

It replaces hardhat-deploy v1's `deployments.deterministic`.

## A salt per environment

A salt is usually a constant, but a project that redeploys on some networks (a fresh address on a testnet, say) can keep the salt per environment in [`data`](../environments/#per-environment-data-data) and fall back to the default:

```typescript
// rocketh/config.ts
export const config = {
	data: {
		timeSalt: {sepolia: '0x000000000000000000000000000000000000000000000000007365706f6c6961'},
	},
} as const satisfies UserConfig;
```

```typescript
export default deployScript(
	async ({deploy, data, namedAccounts}) => {
		const salt: `0x${string}` | undefined = data.timeSalt;
		await deploy(
			'Time',
			{account: namedAccounts.deployer, artifact: artifacts.Time, args: []},
			{deterministic: salt ?? true},
		);
	},
	{tags: ['Time']},
);
```

## The factories

Both kinds deploy through a factory that must exist on the chain. rocketh uses well-known factories by default and deploys them itself when a chain does not have them yet, as part of the first deterministic deployment there:

- **CREATE2**: the [deterministic deployment proxy](https://github.com/Arachnid/deterministic-deployment-proxy) at `0x4e59b44847b379578588920ca78fbf26c0b4956c`, deployed from a pre-signed transaction after funding its deployer.
- **CREATE3**: a CREATE3 factory at `0x000000000004d4f168daE7DB3C610F408eE22F57`, deployed through the CREATE2 factory.

Before using a factory, rocketh checks that the code at its address really is that factory, rather than trusting whatever occupies the address.

A chain where the default cannot be deployed needs another one, declared under `deterministicDeployment` in its chain entry (or in an environment's `overrides`). The pre-signed CREATE2 transaction has no replay protection, so a chain that enforces replay protection cannot run it, and a factory published with replay-protected transactions (such as the [Safe singleton factory](https://github.com/safe-global/safe-singleton-factory)) is declared instead:

```typescript
export const config = {
	chains: {
		11155111: {
			deterministicDeployment: {
				factory: '0x4e59b44847b379578588920ca78fbf26c0b4956c',
				deployer: '0x3fab184622dc19b6109349b94811493bf2a45362',
				funding: '10000000000000000',
				signedTx:
					'0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222',
			},
		},
	},
	data: {},
} as const satisfies UserConfig;
```

The four fields describe the CREATE2 factory: its address, the account that deploys it, the ETH that account needs, and the signed deployment transaction. To configure both factories, give `{create2: {...}, create3: {factory, bytecode, proxyBytecode, salt?}}` instead. A deterministic deployment on a chain with no usable factory fails with `create2 deterministic deployment info not found` (or the `create3` equivalent).
