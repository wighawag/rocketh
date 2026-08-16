import {Abi} from 'abitype';
import fs from 'node:fs';
import path from 'node:path';
import {logs} from 'named-logs';

import type {ChainInfo, Deployment, LinkedData, ResolvedUserConfig} from '@rocketh/core/types';
import {loadDeploymentsFromFiles} from '@rocketh/node';
import {bigIntToStringReplacer} from '@rocketh/core/json';
import {getChainConfigFromUserConfig} from 'rocketh';
import {EIP1193ProviderWithoutEvents} from 'eip-1193';

export const logger = logs('@rocketh/export');

/**
 * Type declarations prepended to every generated TypeScript output.
 *
 * WHY this exists: the generated file is emitted `as const`, which is exactly right for the
 * CONTRACTS (literal addresses and ABIs are the whole value of exporting TypeScript) and wrong
 * for the CHAIN, which is configuration a consumer legitimately overrides at run time.
 *
 * Two fields were unusable without a hand-written cast at every consumer:
 *
 * - `rpcUrls.*.http` — rocketh no longer bakes a public RPC endpoint into chain info, so this
 *   is very often `[]`, which `as const` pins to `readonly []`. That type accepts NOTHING, so
 *   any code injecting an endpoint at run time (from an env var, from the user's wallet) fails
 *   to compile. Even a non-empty list was pinned to its own literal tuple, so replacing an
 *   endpoint was equally impossible.
 * - `properties` — usually `{}`, which `as const` pins to `{}`, so reading a known property
 *   (`averageBlockTimeMs`, `finality`) is a type error rather than `undefined`.
 *
 * The alternative was to drop `as const` altogether, which would have thrown away literal
 * inference on addresses and ABIs, the reason the TypeScript output exists at all. So the
 * widening is surgical: `chain.id`, `chain.name` and `nativeCurrency` keep their literal types.
 *
 * These are local declarations rather than imports, deliberately: a generated deployments file
 * must stay dependency-free so it can be dropped into any project, including one that has no
 * rocketh packages installed at all.
 */
const CHAIN_TYPE_PRELUDE = `type JSONValue = string | number | boolean | null | JSONValue[] | {[key: string]: JSONValue};
type ChainRpcUrl = {http: readonly string[]; webSocket?: readonly string[]};
type ChainRpcUrls = {[key: string]: ChainRpcUrl; default: ChainRpcUrl};
type WidenChain<C> = Omit<C, 'rpcUrls' | 'properties'> & {
	rpcUrls: ChainRpcUrls;
	properties: Record<string, JSONValue>;
};
type WidenChainOf<D extends {chain: unknown}> = Omit<D, 'chain'> & {chain: WidenChain<D['chain']>};

`;

export interface ContractExport {
	address: `0x${string}`;
	abi: Abi;
	argsData?: string;
	bytecode?: `0x${string}`;
	linkedData?: LinkedData;
	startBlock?: number;
}

export type ExportedDeployments = {
	chain: ChainInfo;
	name: string;
	contracts: {[name: string]: ContractExport};
};

type Trandformed<O, Value> = {
	[Property in keyof O]: Value;
};

function objectMap<V, N, O extends Trandformed<{}, V> = Trandformed<{}, V>>(
	object: O,
	mapFn: (v: V) => N,
): Trandformed<O, N> {
	return Object.keys(object).reduce(
		(result, key) => {
			(result as any)[key] = mapFn((object as any)[key]);
			return result;
		},
		{} as Trandformed<O, N>,
	);
}

export async function run(
	config: ResolvedUserConfig,
	environmentName: string,
	options: {
		tojs?: string[];
		tots?: string[];
		tojson?: string[];
		totsm?: string[];
		tojsm?: string[];
		includeBytecode?: boolean;
	},
) {
	if (!options.tots && !options.tojs && !options.tojson && !options.tojsm && !options.totsm) {
		console.log(`no filepath to export to are specified`);
		return;
	}

	const {deployments, chainId, genesisHash} = await loadDeploymentsFromFiles(config.deployments, environmentName);

	if (!deployments || Object.keys(deployments).length === 0) {
		console.log(`no deployments to export`);
		return;
	}

	if (!chainId) {
		throw new Error(`no chainId found for ${environmentName}`);
	}

	const idToFetch = parseInt(chainId);
	const chainConfig = getChainConfigFromUserConfig(config, idToFetch, {} as EIP1193ProviderWithoutEvents);
	const chainInfo = {...chainConfig.info, genesisHash, properties: chainConfig.properties};

	const exportData: ExportedDeployments = {
		chain: chainInfo,
		contracts: objectMap<Deployment<Abi>, ContractExport>(deployments, (d) => {
			let startBlock: number | undefined;
			const blockNumberFromDeployment = d.receipt?.blockNumber;
			if (blockNumberFromDeployment !== undefined) {
				if (typeof blockNumberFromDeployment == 'string') {
					if (blockNumberFromDeployment.startsWith('0x')) {
						startBlock = parseInt(blockNumberFromDeployment.slice(2), 16);
					} else {
						startBlock = parseInt(blockNumberFromDeployment);
					}
				} else {
					// hardhat-deploy v1
					startBlock = blockNumberFromDeployment as number;
				}
			}
			return {
				abi: d.abi,
				address: d.address,
				linkedData: d.linkedData,
				bytecode: options.includeBytecode ? d.bytecode : undefined,
				argsData: options.includeBytecode ? d.argsData : undefined,
				startBlock,
			};
		}),
		name: environmentName,
	};

	const js = typeof options.tojs === 'string' ? [options.tojs] : options.tojs || [];
	const ts = typeof options.tots === 'string' ? [options.tots] : options.tots || [];
	const json = typeof options.tojson === 'string' ? [options.tojson] : options.tojson || [];

	const tsmodule = typeof options.totsm === 'string' ? [options.totsm] : options.totsm || [];
	const jsmodule = typeof options.tojsm === 'string' ? [options.tojsm] : options.tojsm || [];

	if (ts.length > 0) {
		const newContent =
			CHAIN_TYPE_PRELUDE +
			`const _deployments = ${JSON.stringify(exportData, bigIntToStringReplacer, 2)} as const;\n` +
			`export default _deployments as WidenChainOf<typeof _deployments>;\n`;
		for (const tsFile of ts) {
			const folderPath = path.dirname(tsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(tsFile, newContent);
		}
	}

	if (js.length > 0) {
		const newContent = `export default /** @type {const} **/ (${JSON.stringify(
			exportData,
			bigIntToStringReplacer,
			2,
		)});`;
		const dtsContent =
			CHAIN_TYPE_PRELUDE +
			`type _Deployments = ${JSON.stringify(exportData, bigIntToStringReplacer, 2)};\n` +
			`declare const _default: WidenChainOf<_Deployments>;\nexport default _default;`;
		for (const jsFile of js) {
			const folderPath = path.dirname(jsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(jsFile, newContent);
			fs.writeFileSync(jsFile.replace('.js', '.d.ts'), dtsContent);
		}
	}

	if (json.length > 0) {
		const newContent = JSON.stringify(exportData, bigIntToStringReplacer, 2);
		for (const jsonFile of json) {
			const folderPath = path.dirname(jsonFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(jsonFile, newContent);
		}
	}

	if (tsmodule.length > 0) {
		let newContent =
			CHAIN_TYPE_PRELUDE +
			`const _chain = ${JSON.stringify(chainInfo, bigIntToStringReplacer, 2)} as const;\n` +
			`export const chain = _chain as WidenChain<typeof _chain>;\n`;

		for (const contractName of Object.keys(exportData.contracts)) {
			newContent += `export const ${contractName} = ${JSON.stringify(
				(exportData.contracts as any)[contractName],
				bigIntToStringReplacer,
				2,
			)} as const;`;
		}

		for (const tsFile of tsmodule) {
			const folderPath = path.dirname(tsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(tsFile, newContent);
		}
	}

	if (jsmodule.length > 0) {
		// TODO test
		let newContent = `export const chain = /** @type {const} **/ (${JSON.stringify(
			chainInfo,
			bigIntToStringReplacer,
			2,
		)});\n`;

		for (const contractName of Object.keys(exportData.contracts)) {
			newContent += `export const ${contractName} = /** @type {const} **/ (${JSON.stringify(
				(exportData.contracts as any)[contractName],
				bigIntToStringReplacer,
				2,
			)});`;
		}

		for (const jsFile of jsmodule) {
			const folderPath = path.dirname(jsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(jsFile, newContent);
		}
	}
}
