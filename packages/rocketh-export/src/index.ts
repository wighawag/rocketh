import {Abi, Address} from 'abitype';
import fs from 'node:fs';
import path from 'node:path';

import {Deployment, ResolvedConfig, chainTypes, getChain, loadDeployments} from 'rocketh';

export interface ContractExport {
	address: `0x${string}`;
	abi: Abi;
	argsData?: string;
	bytecode?: `0x${string}`;
	// linkedData?: any; TODO
}

type ChainBlockExplorer = {
	name: string;
	url: string;
	apiUrl?: string | undefined;
};
type ChainContract = {
	address: Address;
	blockCreated?: number | undefined;
};

type ChainNativeCurrency = {
	name: string;
	/** 2-6 characters long */
	symbol: string;
	decimals: number;
};

type ChainRpcUrls = {
	http: readonly string[];
	webSocket?: readonly string[] | undefined;
};

/**
 * @description Combines members of an intersection into a readable type.
 *
 * @see {@link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg}
 * @example
 * Prettify<{ a: string } & { b: string } & { c: number, d: bigint }>
 * => { a: string, b: string, c: number, d: bigint }
 */
type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type ChainInfo = {
	/** ID in number form */
	id: number;
	/** Human-readable name */
	name: string;
	/** Collection of block explorers */
	blockExplorers?:
		| {
				[key: string]: ChainBlockExplorer;
				default: ChainBlockExplorer;
		  }
		| undefined;
	/** Collection of contracts */
	contracts?:
		| Prettify<
				{
					[key: string]: ChainContract | {[sourceId: number]: ChainContract | undefined} | undefined;
				} & {
					ensRegistry?: ChainContract | undefined;
					ensUniversalResolver?: ChainContract | undefined;
					multicall3?: ChainContract | undefined;
				}
		  >
		| undefined;
	/** Currency used by chain */
	nativeCurrency: ChainNativeCurrency;
	/** Collection of RPC endpoints */
	rpcUrls: {
		[key: string]: ChainRpcUrls;
		default: ChainRpcUrls;
	};
	/** Source Chain ID (ie. the L1 chain) */
	sourceId?: number | undefined;
	/** Flag for test networks */
	testnet?: boolean | undefined;

	chainType: 'zksync' | 'op-stack' | 'celo' | 'default';

	// this will bring in the following when reconstructed from the data above

	// /** Custom chain data. */
	// custom?: any;

	// /**
	//  * Modifies how chain data structures (ie. Blocks, Transactions, etc)
	//  * are formatted & typed.
	//  */
	// formatters?: any | undefined;
	// /** Modifies how data (ie. Transactions) is serialized. */
	// serializers?: any | undefined;
	// /** Modifies how fees are derived. */
	// fees?: any | undefined;
};

export type ExportedDeployments = {
	chainId: string;
	genesisHash?: string;
	chainInfo: ChainInfo;
	name: string;
	contracts: {[name: string]: ContractExport};
};

type Trandformed<O, Value> = {
	[Property in keyof O]: Value;
};

function objectMap<V, N, O extends Trandformed<{}, V> = Trandformed<{}, V>>(
	object: O,
	mapFn: (v: V) => N
): Trandformed<O, N> {
	return Object.keys(object).reduce((result, key) => {
		(result as any)[key] = mapFn((object as any)[key]);
		return result;
	}, {} as Trandformed<O, N>);
}

export async function run(
	config: ResolvedConfig,
	options: {tojs?: string[]; tots?: string[]; tojson?: string[]; includeBytecode?: boolean}
) {
	if (!options.tots && !options.tojs && !options.tojson) {
		console.log(`no filepath to export to are specified`);
		return;
	}

	const {deployments, chainId, genesisHash} = loadDeployments(config.deployments, config.network.name);

	if (!deployments || Object.keys(deployments).length === 0) {
		console.log(`no deployments to export`);
		return;
	}

	if (!chainId) {
		throw new Error(`no chainId found for ${config.network.name}`);
	}

	const chain = getChain(chainId);

	const chainInfo: ChainInfo = {
		id: chain.id,
		name: chain.name,
		nativeCurrency: chain.nativeCurrency,
		rpcUrls: chain.rpcUrls,
		blockExplorers: chain.blockExplorers,
		chainType: chainTypes[chainId] || 'default',
		contracts: chain.contracts,
		sourceId: chain.sourceId,
		testnet: chain.testnet,
	};

	const exportData: ExportedDeployments = {
		chainId,
		genesisHash,
		chainInfo,
		contracts: objectMap<Deployment<Abi>, ContractExport>(deployments, (d) => ({
			abi: d.abi,
			address: d.address,
			linkedData: d.linkedData,
			bytecode: options.includeBytecode ? d.bytecode : undefined,
			argsData: options.includeBytecode ? d.argsData : undefined,
			startBlock: d.receipt?.blockNumber ? parseInt(d.receipt.blockNumber.slice(2), 16) : undefined,
		})),
		name: config.network.name,
	};

	const js = typeof options.tojs === 'string' ? [options.tojs] : options.tojs || [];
	const ts = typeof options.tots === 'string' ? [options.tots] : options.tots || [];
	const json = typeof options.tojson === 'string' ? [options.tojson] : options.tojson || [];

	if (typeof ts === 'object' && ts.length > 0) {
		const newContent = `export default ${JSON.stringify(exportData, null, 2)} as const;`;
		for (const tsFile of ts) {
			const folderPath = path.dirname(tsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(tsFile, newContent);
		}
	}

	if (typeof js === 'object' && js.length > 0) {
		const newContent = `export default /** @type {const} **/ (${JSON.stringify(exportData, null, 2)});`;
		const dtsContent = `export = ${JSON.stringify(exportData, null, 2)} as const;`;
		for (const jsFile of js) {
			const folderPath = path.dirname(jsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(jsFile, newContent);
			fs.writeFileSync(jsFile.replace('.js', '.d.ts'), dtsContent);
		}
	}

	if (typeof json === 'object' && json.length > 0) {
		const newContent = JSON.stringify(exportData, null, 2);
		for (const jsonFile of json) {
			const folderPath = path.dirname(jsonFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(jsonFile, newContent);
		}
	}
}
