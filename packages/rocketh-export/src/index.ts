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

/**
 * Base of the failures that are a USER-FACING CONDITION rather than a bug.
 *
 * This is the seam the CLI branches on: an `ExportError` is reported as a message on stderr
 * with exit 1, anything else keeps its stack trace because it means something unexpected went
 * wrong. It exists as a base class rather than a union of `instanceof` checks at the call site
 * so that a failure added here JOINS that branch instead of silently falling through to the
 * stack-trace path.
 */
export abstract class ExportError extends Error {}

/**
 * Thrown when no output file was asked for, so there is nowhere to export TO.
 *
 * Same bug shape as `NoDeploymentsError` and fixed the same way: a request that cannot be
 * satisfied used to print on stdout and exit 0. Here the caller passed no `--ts`/`--js`/
 * `--json`/`--tsm`/`--jsm` at all, which no useful invocation does, and a chained
 * `export && dev` would carry on with a file that was never regenerated.
 */
export class NoOutputPathError extends ExportError {
	readonly environmentName: string;

	constructor(environmentName: string) {
		super(
			`no output file specified for the export of environment '${environmentName}'\n` +
				`  pass at least one of --ts, --js, --json, --tsm, --jsm ` +
				`(tots, tojs, tojson, totsm, tojsm when calling run() directly)`,
		);
		this.name = 'NoOutputPathError';
		this.environmentName = environmentName;
	}
}

/** Why an export of an environment with nothing in it could not be satisfied. */
export type NoDeploymentsReason =
	/** No deployment folder for that environment at all: a typo, or a deploy that never ran. */
	| 'missing-folder'
	/** The folder is there but holds no deployment record. */
	| 'no-records';

/**
 * Thrown when the named environment has no deployments to export.
 *
 * WHY this is a failure and not a no-op. The generated file is the consuming app's source of
 * truth for addresses and ABIs, and it is normally ALREADY THERE from an earlier export against
 * a different environment. So "write nothing and succeed" does not leave the consumer with no
 * deployments, it leaves them with ANOTHER environment's deployments, silently. The case that
 * prompted this: `attach sepolia` on an environment with no records, export no-opped with exit
 * 0, the dev server came up, and the app talked to localhost addresses while the developer
 * believed they were on Sepolia. A typo in `-e` produces exactly the same silence, and is the
 * more common way to hit it.
 *
 * Both reasons are fatal, and deliberately so: the harm to the consumer is identical either way.
 * The reason is carried separately from the message so a programmatic caller can branch on the
 * typo case without parsing prose.
 *
 * This lives on the ROOT export surface rather than a `./errors` subpath (the convention for
 * extension packages, see `@rocketh/unknown-signer`) because this package is not an extension:
 * its root already exports `run` and `logger`, so it is never spread into `withEnvironment`.
 */
export class NoDeploymentsError extends ExportError {
	readonly environmentName: string;
	/** Absolute path of the folder that was looked in. */
	readonly environmentPath: string;
	readonly reason: NoDeploymentsReason;

	constructor(params: {
		environmentName: string;
		environmentPath: string;
		reason: NoDeploymentsReason;
		message: string;
	}) {
		super(params.message);
		this.name = 'NoDeploymentsError';
		this.environmentName = params.environmentName;
		this.environmentPath = params.environmentPath;
		this.reason = params.reason;
	}
}

/** The environment folders sitting next to the one asked for, or `undefined` if the deployments folder itself is absent. */
function listEnvironments(deploymentsFolder: string): string[] | undefined {
	try {
		return fs
			.readdirSync(deploymentsFolder, {withFileTypes: true})
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
	} catch {
		return undefined;
	}
}

/**
 * Build the failure for an environment with nothing to export.
 *
 * The message names WHAT was asked for and WHERE it was looked for, because the reader's next
 * action differs completely between "you misspelled it" and "you have not deployed yet", and
 * the old `no deployments to export` distinguished neither. It also names the output files that
 * were left in place, since those holding a previous environment's addresses is the actual
 * danger, and nothing else in the chain of events reports it.
 */
function noDeploymentsError(
	deploymentsFolder: string,
	environmentName: string,
	outputFiles: string[],
): NoDeploymentsError {
	const deploymentsPath = path.resolve(deploymentsFolder);
	const environmentPath = path.join(deploymentsPath, environmentName);
	const folderExists = fs.statSync(environmentPath, {throwIfNoEntry: false})?.isDirectory() === true;

	const lines: string[] = [];
	if (folderExists) {
		lines.push(`no deployments to export for environment '${environmentName}'`);
		lines.push(`  its folder exists but holds no deployment record: ${environmentPath}`);
		lines.push(`  deploy to '${environmentName}' first, or export an environment that has deployments`);
	} else {
		lines.push(`no deployments to export for environment '${environmentName}'`);
		lines.push(`  no such deployment folder: ${environmentPath}`);
		const siblings = listEnvironments(deploymentsPath);
		if (siblings === undefined) {
			lines.push(`  the deployments folder itself does not exist: ${deploymentsPath}`);
			lines.push(`  check the deployments folder (-d, or 'deployments' in the config) and deploy first`);
		} else if (siblings.length === 0) {
			lines.push(`  no environment has been deployed yet under ${deploymentsPath}`);
		} else {
			lines.push(`  environments found in ${deploymentsPath}: ${siblings.join(', ')}`);
			lines.push(`  check the name passed to -e, or deploy to '${environmentName}' first`);
		}
	}

	// Resolved for display: the caller's path is usually relative to a cwd the reader of the
	// message (a CI log, a chained script) cannot see, and every other path here is absolute.
	const leftBehind = outputFiles.filter((file) => fs.existsSync(file)).map((file) => path.resolve(file));
	if (leftBehind.length > 0) {
		lines.push(
			`  nothing was written: ${leftBehind.join(', ')} ${leftBehind.length > 1 ? 'still hold' : 'still holds'} the result of a previous export`,
		);
	}

	return new NoDeploymentsError({
		environmentName,
		environmentPath,
		reason: folderExists ? 'no-records' : 'missing-folder',
		message: lines.join('\n'),
	});
}

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
	// Checked before the environment is even looked up: this is about the caller's own arguments,
	// and reporting a missing output path is actionable whatever state the deployments are in.
	if (!options.tots && !options.tojs && !options.tojson && !options.tojsm && !options.totsm) {
		throw new NoOutputPathError(environmentName);
	}

	// Normalized here, above the load, so the failure below can name the files it did NOT write.
	const js = typeof options.tojs === 'string' ? [options.tojs] : options.tojs || [];
	const ts = typeof options.tots === 'string' ? [options.tots] : options.tots || [];
	const json = typeof options.tojson === 'string' ? [options.tojson] : options.tojson || [];

	const tsmodule = typeof options.totsm === 'string' ? [options.totsm] : options.totsm || [];
	const jsmodule = typeof options.tojsm === 'string' ? [options.tojsm] : options.tojsm || [];

	const {deployments, chainId, genesisHash} = await loadDeploymentsFromFiles(config.deployments, environmentName);

	// Nothing to export is a failure, not a silent success (see `NoDeploymentsError`). It is
	// raised BEFORE any mkdir or write, so a failed export leaves every output file byte-identical.
	if (!deployments || Object.keys(deployments).length === 0) {
		throw noDeploymentsError(config.deployments, environmentName, [...ts, ...js, ...json, ...tsmodule, ...jsmodule]);
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
