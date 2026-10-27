# Named accounts and signers

A deploy script never says `accounts[0]`. It names the accounts it uses (`deployer`, `admin`, `treasury`), and `rocketh/config.ts` says, per environment, which account each name is and how rocketh gets its transactions signed. The same script then deploys from a dev node's first account locally, from a key read from the environment on a testnet, and hands a Safe-owned call to the Safe in production.

## Declaring them

```typescript
// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';
import {privateKey} from '@rocketh/signer';

export const config = {
	accounts: {
		deployer: {
			default: 0,
			sepolia: `privateKey:${process.env.DEPLOYER_PRIVATE_KEY}`,
		},
		admin: {
			default: 1,
			mainnet: '0x1111111111111111111111111111111111111111', // a Safe
		},
		treasury: 'admin', // the same account as `admin`, on every network
	},
	signerProtocols: {privateKey},
	data: {},
} as const satisfies UserConfig;
```

A script reads them as `env.namedAccounts` (addresses) and passes a name or an address as `account`:

```typescript
export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;
		await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [admin]});
	},
	{tags: ['Registry']},
);
```

`env.unnamedAccounts` lists the node's accounts that no name points at, which is what tests use for throwaway users.

## What a definition can be

Each name holds one definition for every network, or a map of definitions per network. In the map, the run takes the entry under the environment's name, else the one under its chain id, else `default`. A name with no matching entry and no `default` stops the run (see below), so a misspelt network name fails loudly.

| Definition                | Is                                                                                                         | Signed by                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `0`, `1`, ...             | the node's account at that index (`eth_accounts`)                                                          | the node                                                                                  |
| `'0x' + 40 hex`           | that address                                                                                               | the node if it holds the key, impersonation on a fork, else [nobody](../unknown-signers/) |
| `'0x' + 64 hex`           | the address of that private key                                                                            | rocketh, locally (needs the `privateKey` protocol registered)                             |
| `'<protocol>:<data>'`     | whatever the protocol in `signerProtocols` returns, for example `privateKey:0x...`                         | that protocol                                                                             |
| `'<name>'`                | the same account as another name (`treasury: 'admin'`)                                                     | as that name                                                                              |
| `null` (in a network map) | no account on that network: the name is absent from `env.namedAccounts`, and typed as possibly `undefined` |                                                                                           |

Read keys from the environment (`process.env`) rather than writing them in the file. An address that rocketh cannot sign for is not an error: it is how a Safe, a multisig or a timelock appears in a config, and a transaction from it goes through the [unknown-signer flow](../unknown-signers/) (pause and ask for the hash by default), or is impersonated on a [fork](../fork-runs/#impersonation-is-on-by-default).

A name that is `null` on some network exists elsewhere and not there:

```typescript
accounts: {
	deployer: {default: 0},
	// signs on every network except mainnet, where there is no such account
	faucetOperator: {default: 1, mainnet: null},
},
```

```typescript
const {faucetOperator} = env.namedAccounts;
if (faucetOperator) {
	// ...
}
```

## Signer protocols

A string `<protocol>:<data>` is resolved by the function registered under that protocol in `signerProtocols`. `@rocketh/signer` ships `privateKey`, which signs locally with the key that follows (`privateKey:0x<64 hex>`). Any other source of signatures (a hardware wallet, a KMS, a remote signer) is a protocol of your own: a function that receives the whole string and returns a signer.

```typescript
import type {SignerProtocolFunction} from 'rocketh/types';

export const ledger: SignerProtocolFunction = async (protocolString) => {
	const derivationPath = protocolString.slice('ledger:'.length);
	const signer = await connectToLedger(derivationPath); // an EIP-1193 provider that answers eth_accounts and eth_signTransaction
	return {type: 'signerOnly', signer};
};
```

```typescript
export const config = {
	accounts: {deployer: {default: 0, mainnet: "ledger:m/44'/60'/0'/0/0"}},
	signerProtocols: {privateKey, ledger},
	data: {},
} as const satisfies UserConfig;
```

The returned signer is one of three kinds, and the difference decides how rocketh broadcasts:

| `type`       | Means                                                            | Broadcast                                            |
| ------------ | ---------------------------------------------------------------- | ---------------------------------------------------- |
| `signerOnly` | rocketh holds the signing material and signs locally             | `eth_signTransaction`, then `eth_sendRawTransaction` |
| `wallet`     | an external wallet signs on the user's behalf (a browser wallet) | `eth_sendTransaction`                                |
| `remote`     | the node signs                                                   | `eth_sendTransaction`                                |

A protocol that signs (a hardware wallet, an HSM) returns `signerOnly`, as `privateKey` does.

## Named accounts on a real network

An index means one of the **node's own** accounts, the ones it lists in `eth_accounts`. A local dev node holds keys, so `deployer: 0` works there. A real network's public RPC endpoint holds none and answers `eth_accounts` with an empty list, so an account given only by index cannot be resolved there, and the run stops before any script runs. It reports every account that cannot be resolved, where it asked, and the fix:

```
cannot resolve 2 named accounts ("deployer", "admin") for environment "sepolia" (chain 11155111, endpoint https://sepolia.infura.io/<redacted>):
  - "deployer" is configured as index 0, but the node lists no accounts.
  - "admin" is configured as index 1, but the node lists no accounts.
An account given by index is one of the node's own accounts, and this node holds none: nodes without keys (most public RPC endpoints) answer 'eth_accounts' with an empty list.
To fix it, in the `accounts` of your rocketh config (rocketh/config.ts), give each of these accounts a signer protocol or an address for "sepolia". Read any key from the environment rather than writing it in the file, for example:
    deployer: {default: 0, sepolia: `privateKey:${process.env.DEPLOYER_PRIVATE_KEY}`},
The 'privateKey' protocol is registered with `signerProtocols: {privateKey}` (from @rocketh/signer). Or point "sepolia" at a node that holds the keys.
```

The endpoint is shown with its path, query string and credentials replaced by `<redacted>`, since RPC providers put API keys there, and a key from your config is never printed. The `rocketh` CLI prints this message and exits with code 1, without a stack trace. The fix it describes looks like this:

```typescript
import {privateKey} from '@rocketh/signer';

export const config = {
	accounts: {
		deployer: {default: 0, sepolia: `privateKey:${process.env.DEPLOYER_PRIVATE_KEY}`},
		admin: {default: 1, sepolia: '0x...'}, // an address: a multisig, say, that signs out of band
	},
	signerProtocols: {privateKey},
} as const satisfies UserConfig;
```

Under hardhat-deploy the accounts at an index are the ones the hardhat network configures, so the fix is different: see [Under hardhat-deploy](#when-the-network-has-no-accounts) below.

The same error, listing each account with its own reason, covers the other ways a named account can fail to resolve: an index beyond what the node lists, `eth_accounts` failing on the node, a per-network map with no entry for the environment and no `default`, a reference to an account name that does not exist (or a cycle of them), a private key with no `privateKey` protocol registered, and a `<protocol>:...` string whose protocol is not in `signerProtocols`. Programmatically it is an `UnresolvableAccountsError` (exported by `rocketh`), whose `data` carries the environment, chain id, endpoint and each failing account.

### Under hardhat-deploy {#when-the-network-has-no-accounts}

A named account given by index (`deployer: 0` in `rocketh/config.ts`) is the account at that index on the **hardhat network**, which comes from that network's `accounts` in `hardhat.config.ts`. A network with no `accounts` configured (hardhat resolves it to `'remote'`) asks the node instead, and a public RPC endpoint holds no keys. This is what happens with hardhat-deploy's network helpers (`addNetworksFromEnv`, `addNetworksFromKnownList`) when neither `MNEMONIC_sepolia` nor `MNEMONIC` is set. The deploy then stops before any script runs, with a plugin error rather than a crash:

```
Error in community plugin hardhat-deploy: cannot resolve 2 named accounts ("deployer", "admin") for environment "sepolia" (chain 11155111, endpoint https://11155111.rpc.thirdweb.com):
  - "deployer" is configured as index 0, but the node lists no accounts.
  - "admin" is configured as index 1, but the node lists no accounts.
The hardhat network "sepolia" configures no accounts (its `accounts` is 'remote'), so hardhat asks the node for its own, and this node holds none.
To fix it, configure accounts for "sepolia" in your hardhat config, for example `accounts: {mnemonic: configVariable('MNEMONIC_sepolia')}` or `accounts: [configVariable('DEPLOYER_PRIVATE_KEY')]`. If "sepolia" is added by hardhat-deploy's `addNetworksFromEnv` or `addNetworksFromKnownList`, set the environment variable MNEMONIC_sepolia to the mnemonic (or MNEMONIC, which every network without its own falls back to); the value SECRET reads it from the configuration variable SECRET_MNEMONIC_sepolia instead.
Alternatively, in the `accounts` of rocketh/config.ts, give the account a signer protocol (for example 'privateKey:...', read from the environment) or an address for "sepolia".

For more info run Hardhat with --show-stack-traces
```

The message names the environment, the chain id and the endpoint (with any path, query string or credentials replaced by `<redacted>`, since that is where RPC providers put API keys), and lists every account that cannot be resolved, so fixing one does not reveal the next on the following run. So, with the network helpers:

```bash
# .env.local (not committed)
MNEMONIC_sepolia=your testnet mnemonic here
```

When the network does configure accounts but fewer than the index asks for, the message says how many it has and points at `accounts.count` (for a mnemonic) or the list of keys instead.
