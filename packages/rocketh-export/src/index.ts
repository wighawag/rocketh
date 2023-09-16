import {Abi} from 'abitype';
import fs from 'node:fs';
import path from 'node:path';

import {Deployment, ResolvedConfig, loadDeployments} from 'rocketh';

export interface ContractExport {
	address: string;
	abi: Abi;
	// linkedData?: any; TODO
}

export type ExportedDeployments = {
	chainId: string;
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

	const {deployments, chainId} = loadDeployments(config.deployments, config.networkName);

	if (!deployments || Object.keys(deployments).length === 0) {
		console.log(`no deployments to export`);
		return;
	}

	if (!chainId) {
		throw new Error(`no chainId found for ${config.networkName}`);
	}

	const exportData: ExportedDeployments = {
		chainId,
		contracts: objectMap<Deployment<Abi>, ContractExport>(deployments, (d) => ({
			abi: d.abi,
			address: d.address,
			linkedData: d.linkedData,
			bytecode: options.includeBytecode ? d.bytecode : undefined,
			startBlock: d.receipt?.blockNumber ? parseInt(d.receipt.blockNumber.slice(2), 16) : undefined,
		})),
		name: config.networkName,
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
