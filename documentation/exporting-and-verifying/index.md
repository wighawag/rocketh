# Exporting, verifying and documenting

Once contracts are deployed, three packages turn the [deployment records](../deployment-records/) into things other people consume: verified source on a block explorer, addresses and ABIs for a frontend, and generated reference documentation. Each is a command of its own, run after `hardhat deploy` or `rocketh`, and they behave the same under both.

## Contract Verification

`@rocketh/verifier` publishes your contracts' source to a block explorer, so the code at each address can be read and audited. It needs nothing but the deployment records: they carry the solc metadata, sources included, so verification can run at any time after the deployment, from any machine that has the records.

```bash
pnpm add -D @rocketh/verifier
```

```bash
# Etherscan (and every chain Etherscan's V2 API covers): one API key for all of them
ETHERSCAN_API_KEY=<your key> npx rocketh-verify -e sepolia etherscan

# Sourcify: no key
npx rocketh-verify -e sepolia sourcify

# Blockscout: a default endpoint is known for the main chains, give the API v2 url otherwise
npx rocketh-verify -e mychain blockscout --endpoint https://blockscout.example/api/v2
```

`-e` comes before the explorer. `ETHERSCAN_API_KEY` can live in `.env` or `.env.local`, which the command loads. Every deployment of the environment is submitted; one that is already verified is reported as such, not as an error. An explorer outside Etherscan's V2 API that speaks its protocol takes `--endpoint`, and `--min-interval <ms>` spaces requests out under a rate limit. `rocketh-verify -e sepolia metadata --out ./metadata` writes the metadata files instead, for verifying by hand. Every option is in [the CLI reference](../reference/cli/#rocketh-verify).

From code, `run` verifies an environment, or some of its deployments:

```typescript
import {run} from '@rocketh/verifier';
import {readAndResolveConfig} from '@rocketh/node';

const config = await readAndResolveConfig({});
await run(config, 'sepolia', {
	verifier: {type: 'etherscan', apiKey: process.env.ETHERSCAN_API_KEY},
	deploymentNames: ['Token', 'TokenSale'],
});
```

`verifier` is `{type: 'etherscan', apiKey?, endpoint?, license?, forceLicense?, fixMispell?}`, `{type: 'sourcify', endpoint?}` or `{type: 'blockscout', endpoint?}`; `minInterval` (milliseconds) and `logErrorOnFailure` are the other options.

## Exporting Deployments

`@rocketh/export` turns an environment's deployment records into one file a frontend imports: the chain, and each contract's address and ABI.

```bash
pnpm add -D @rocketh/export
npx rocketh-export -e sepolia --ts ./src/contracts.ts
```

`--ts`, `--js` and `--json` each take one or more comma-separated paths, and at least one output is required. The file looks like this:

```typescript
// src/contracts.ts (abridged)
export default {
	chain: {
		id: 11155111,
		name: 'Sepolia',
		nativeCurrency: {name: 'Sepolia Ether', symbol: 'ETH', decimals: 18},
		// only the urls your config states: a public default endpoint is left out
		rpcUrls: {default: {http: []}},
		genesisHash: '0x25a5cc106eea7138acab33231d7160d69cb777ee0c2c553fcddf5138993e6dd9',
		properties: {},
	},
	name: 'sepolia',
	contracts: {
		GreetingsRegistry: {
			address: '0x...',
			abi: [/* ... */],
			linkedData: {prefix: ''},
			startBlock: 7000000,
		},
	},
} as const;
```

`startBlock` (the block of the deployment transaction) is where an indexer starts syncing; `linkedData` is whatever the script attached. `-b, --bytecode` adds the bytecode. Because the file is `as const`, the ABIs are typed, and viem infers every function and argument from them:

```typescript
import {createPublicClient, http} from 'viem';
import deployments from './contracts.js';

const {chain, contracts} = deployments;
const client = createPublicClient({
	chain: {id: chain.id, name: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: chain.rpcUrls},
	// the export carries an RPC url only when your config set one, so name the endpoint here
	transport: http('https://my-sepolia-endpoint.example/rpc'),
});

const message = await client.readContract({
	address: contracts.GreetingsRegistry.address,
	abi: contracts.GreetingsRegistry.abi,
	functionName: 'messages',
	args: ['0x0000000000000000000000000000000000000001'],
});
```

The same from code is `run(config, environment, {tots, tojs, tojson, totsm, tojsm, includeBytecode, verify, provider})`, each output a list of paths:

```typescript
import {run} from '@rocketh/export';
import {readAndResolveConfig} from '@rocketh/node';

await run(await readAndResolveConfig({}), 'sepolia', {tots: ['./src/contracts.ts']});
```

### Chain properties in the export

The chain's [`properties`](../environments/#chain-properties-properties) from `rocketh/config.ts` are exported as `chain.properties`. This is the place for what a frontend needs to know about the chain and cannot ask it: the average block time to schedule polling, the number of blocks to treat as final, the gas price to expect.

```typescript
const {averageBlockTimeMs, finality} = deployments.chain.properties as {averageBlockTimeMs?: number; finality?: number};
```

The export keeps the chain as data only: viem's function-valued fields (the formatters and serializers of OP-stack chains, Celo, zkSync) are dropped rather than written half-serialised.

### Exporting from a contracts package

In a monorepo (the [template](https://github.com/wighawag/template-ethereum-contracts) is one), the contracts package writes the export into the app, after each deployment:

```bash
pnpm contracts:export sepolia --ts ../web/src/lib/deployments.ts
# runs: rocketh-export -e sepolia --ts ../web/src/lib/deployments.ts
```

During development the template's watcher does it after every redeploy, see [Development workflow](/hardhat-deploy/development-workflow/). An app can also import the contracts package itself (its generated ABIs and artifacts, its deployment records), see [Share contracts between projects](../sharing-contracts/).

If the named environment has no deployments (a misspelled name, or a network you have not deployed to yet), the export fails with a non-zero exit code and writes nothing. That is deliberate: the generated file is your app's source of truth for addresses, and it is usually already there from an export against another network, so succeeding without writing would leave the app pointing at that other network's contracts without saying so.

The module formats (`--tsm` / `--jsm`) emit one named export per deployment (`export const Token = ...`), so a deployment name has to be a valid JavaScript identifier there. A name like `Token-V2`, `My Registry` or `default` is refused with a message naming it, rather than writing a file that does not parse. The object formats (`--ts`, `--js`, `--json`) keep names exactly as they are and have no such constraint.

### Checking the export against the chain (`--verify`)

Export reads files and writes files. It makes no network request, which is what lets it run in an offline CI build, and it also means it cannot tell that a deployment record is stale, that the chain it describes was reset, or that you are exporting an environment that is not the network your app will connect to. That failure usually surfaces much later, as a user's transaction reverting against an address holding no code.

`--verify` asks the chain first:

```bash
npx rocketh-export -e sepolia --ts ./src/contracts.ts --verify
```

It checks that the chain id the RPC reports matches the one recorded for the environment, and that every exported address has code. On failure it writes nothing and leaves the previous output alone, naming every contract at fault. A wrong chain id is reported on its own, because on the wrong network every address also looks empty. An unreachable node fails the export rather than skipping the checks: you asked for verification, and "could not check" is not "checked".

It is opt-in for exactly the reason above: an offline build must keep working, so verification is something you turn on before shipping, not something every build pays for. It needs an `rpcUrl` for the chain (or a provider passed to `run()` programmatically).

### `linkedData` is public

Whatever you attach as `linkedData` on a deployment is stored in the deployment record and copied into every export, so it ends up in the frontend bundle you ship and in the repository if you commit your deployments. Treat it as public: it is a convenient place for a prefix, an admin address or a start block, and the wrong place for an API key, a private RPC URL with a token in it, or anything else you would not publish.

## Generating Documentation

The `@rocketh/doc` package generates reference documentation from your deployments, reading each one's ABI and the NatSpec carried in it:

```bash
npx rocketh-doc -e sepolia -o ./docs/contracts
```

A proxied contract saves three records (`MyContract`, `MyContract_Proxy`, `MyContract_Implementation`), so most projects want to filter the generated ones out:

```bash
npx rocketh-doc -e sepolia -o ./docs/contracts --except-suffix _Implementation,_Proxy
```

The suffixes are one comma-separated value.

Output is rendered through [Handlebars](https://handlebarsjs.com) templates. The bundled default is `public/default_templates/{{contracts}}.hbs` in the package: a file name containing `{{contracts}}` is expanded once per contract, so one template produces a page per contract. `-t` points at a folder of your own templates.

The text comes from the NatSpec in the artifacts the deployments were built from (`devdoc` and `userdoc`): compiler settings that drop it give pages with the right structure and no prose.

From code, `run(config, environment, {output, template, exceptSuffix})` does what the command does, `runFromFolder(folder, options)` reads a folder of records without a config, and `generateDocumentationData` builds the model only (methods, events and errors, with their signatures, selectors, ABI fragments and NatSpec), to render it with something other than Handlebars:

```typescript
import {run} from '@rocketh/doc';
import {readAndResolveConfig} from '@rocketh/node';

await run(await readAndResolveConfig({}), 'sepolia', {
	output: './docs/contracts',
	exceptSuffix: ['_Implementation', '_Proxy'],
});
```
