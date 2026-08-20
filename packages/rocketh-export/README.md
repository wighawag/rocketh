# @rocketh/export

Export your rocketh deployments as TypeScript, JavaScript or JSON, so a frontend can import contract addresses and ABIs without reaching into the deployments folder.

The generated file becomes the consuming app's source of truth for addresses and ABIs. Export is **offline by default**: it reads files and writes files, with no RPC involved, which is what lets a CI web build run it with no network.

## Installation

```bash
# Using pnpm
pnpm add -D @rocketh/export

# Using npm
npm install --save-dev @rocketh/export

# Using yarn
yarn add -D @rocketh/export
```

`rocketh` and `@rocketh/node` are peer dependencies.

## CLI

The package provides the `rocketh-export` command.

```bash
# export the sepolia deployments as a TypeScript module
rocketh-export -e sepolia --ts ./src/generated/contracts.ts

# several formats and several destinations at once
rocketh-export -e mainnet --ts ./app/src/contracts.ts,./admin/src/contracts.ts --json ./public/contracts.json
```

### Options

| Option | Description |
| --- | --- |
| `-e, --environment <value>` | **(Required)** Environment context to use. |
| `-d, --deployments <value>` | Folder where deployments are saved. |
| `--ts <value>` | Comma-separated file paths for the TypeScript export. |
| `--js <value>` | Comma-separated file paths for the JavaScript export. |
| `--json <value>` | Comma-separated file paths for the JSON export. |
| `--tsm <value>` | TypeScript export with one named export per contract. |
| `--jsm <value>` | JavaScript export with one named export per contract. |
| `-b, --bytecode` | Include bytecode in the output. |
| `--verify` | Ask the chain whether the deployments are really there before writing. Needs an RPC. |

At least one output path is required; without one the command fails with `NoOutputPathError` rather than doing nothing.

### `--tsm` / `--jsm`

The plain `--ts` / `--js` exports emit a single object of all contracts. The `m` variants emit **one named export per contract** (`export const Token = ...`), which lets a bundler tree-shake the ABIs your app never touches. ABIs are large, so this matters for bundle size.

The catch: each deployment name becomes a JavaScript identifier. A deployment called `Token_Proxy` is fine; one called `My Token` or `class` is not, and the export fails with `InvalidModuleExportNameError` listing every offending name at once. Either rename the deployment, or use `--ts`/`--js`/`--json`, which keep names as object keys.

## Programmatic usage

```typescript
import {run} from '@rocketh/export';
import {readAndResolveConfig} from '@rocketh/node';

const config = await readAndResolveConfig({});

await run(config, 'sepolia', {
	tots: ['./src/generated/contracts.ts'],
	tojson: ['./public/contracts.json'],
	includeBytecode: false,
});
```

Option names differ from the CLI flags: `tots`, `tojs`, `tojson`, `totsm`, `tojsm`, `includeBytecode`, `verify`, and `provider`.

## Output shape

```typescript
type ExportedDeployments = {
	chain: ChainInfo;
	name: string;
	contracts: {[name: string]: ContractExport};
};

interface ContractExport {
	address: `0x${string}`;
	abi: Abi;
	argsData?: string;
	bytecode?: `0x${string}`;
	linkedData?: LinkedData;
	startBlock?: number;
}
```

`startBlock` is useful for an indexer: it is the block to start syncing from rather than genesis. `linkedData` carries whatever your deploy script attached to the record.

## An empty export is an error, not a no-op

If the named environment has no deployments, the command fails with `NoDeploymentsError` (with `reason` being either `missing-folder` or `no-records`).

This is deliberate. The generated file is usually **already there** from an earlier export against a different environment, so "write nothing and succeed" would not leave the consumer with no deployments; it would silently leave them with another environment's deployments. A typo in `-e` should be loud.

## Verifying before you write

`--verify` asks the chain whether each deployment is actually present before writing anything, failing with `OnChainVerificationError` if not. It is off by default because it requires a reachable RPC.

Turn it on when exporting a production environment, where a record pointing at an address that does not exist on the target chain (a stale record, a reorged deployment, records copied between environments) would ship straight into your frontend.

## Treat the generated file as a build artifact

The output is derived from your deployment records. Regenerate it rather than editing it, and do not hand-edit an address into it.

## Related packages

- [`rocketh`](https://www.npmjs.com/package/rocketh) - core environment and executor
- [`@rocketh/node`](https://www.npmjs.com/package/@rocketh/node) - runs the deployments you are exporting
- [`@rocketh/verifier`](https://www.npmjs.com/package/@rocketh/verifier) - verify source on block explorers
- [`@rocketh/doc`](https://www.npmjs.com/package/@rocketh/doc) - generate documentation from deployments

For full documentation, visit [rocketh.dev](https://rocketh.dev).

For hardhat-deploy documentation, see [rocketh.dev/hardhat-deploy/](https://rocketh.dev/hardhat-deploy/).
