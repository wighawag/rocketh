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

/**
 * Thrown when a deployment name cannot be a JavaScript identifier, for the MODULE output
 * modes (`--tsm` / `--jsm`) that turn each name into one.
 *
 * Those modes emit `export const <DeploymentName> = {...}`, so the deployment name stops
 * being data and becomes SOURCE. A name that is a perfectly good file name (`Token-V2`,
 * `My Registry`, `default`) then produces a generated file that does not parse, and the
 * failure surfaces in the consuming app's build, pointing at generated code, with nothing
 * naming the deployment that caused it.
 *
 * WHY THIS THROWS RATHER THAN SANITISING THE NAME. Rewriting `Token-V2` to `Token_V2`
 * would emit a file that parses, at the cost of an export name the consumer cannot predict
 * from their own deploy script, and one that no longer matches the key the `--json` /
 * `--ts` object modes use for the same deployment. Silently renaming the thing the caller
 * has to `import` is worse than refusing, because it fails later and somewhere else. The
 * object modes have no such constraint, so the message names them as the way out.
 */
export class InvalidModuleExportNameError extends ExportError {
	readonly environmentName: string;
	/** Every offending deployment name, not just the first, so one run fixes them all. */
	readonly deploymentNames: string[];

	constructor(params: {environmentName: string; deploymentNames: string[]}) {
		super(
			`cannot export environment '${params.environmentName}' as a module: ` +
				`${params.deploymentNames.length === 1 ? 'a deployment name is' : 'some deployment names are'} ` +
				`not valid JavaScript identifiers\n` +
				params.deploymentNames.map((name) => `  - ${JSON.stringify(name)}`).join('\n') +
				`\n  --tsm/--jsm emit \`export const <name> = ...\`, so each deployment name becomes an identifier.\n` +
				`  either rename the deployment, or export with --ts/--js/--json, which keep names as object keys`,
		);
		this.name = 'InvalidModuleExportNameError';
		this.environmentName = params.environmentName;
		this.deploymentNames = params.deploymentNames;
	}
}

/**
 * Identifiers the module output modes can safely emit.
 *
 * Deliberately ASCII-only, though JavaScript accepts far more: the point is not to police
 * what the language allows, it is to guarantee the generated file parses everywhere it is
 * consumed, including by tooling with a narrower idea of an identifier than the spec's.
 */
const JS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Words that pass the identifier shape but cannot follow `export const`.
 *
 * Reserved words plus the few contextual ones that break in a module (`await` at module top
 * level, `let` in a `const` declaration). `undefined`, `NaN` and `Infinity` are omitted:
 * they are shadowable bindings, so `export const undefined = ...` is legal, and refusing a
 * legal name would be the same overreach as silently renaming one.
 */
const RESERVED_WORDS = new Set([
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'implements',
	'import',
	'in',
	'instanceof',
	'interface',
	'let',
	'new',
	'null',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'await',
]);

/** Whether a deployment name can be emitted as `export const <name>`. */
function isValidModuleExportName(name: string): boolean {
	return JS_IDENTIFIER.test(name) && !RESERVED_WORDS.has(name);
}

/**
 * Thrown when `--verify` asked the chain about the deployments and the chain disagreed.
 *
 * The generated file is the consuming app's source of truth for addresses, and the failure
 * it cannot survive is pointing at an address that holds nothing on the network the user
 * connects to: a frontend that ships localhost addresses, or a stale record for a chain that
 * was reset. Nothing in the export path could notice that, because export reads FILES.
 */
export class OnChainVerificationError extends ExportError {
	readonly environmentName: string;
	/** Every problem found, not just the first: fixing addresses one round-trip at a time is worse. */
	readonly problems: string[];

	constructor(params: {environmentName: string; problems: string[]}) {
		super(
			`on-chain verification failed for environment '${params.environmentName}'\n` +
				params.problems.map((problem) => `  - ${problem}`).join('\n') +
				`\n  the export was NOT written`,
		);
		this.name = 'OnChainVerificationError';
		this.environmentName = params.environmentName;
		this.problems = params.problems;
	}
}

/**
 * Ask the chain whether the deployments about to be exported are really there.
 *
 * OPT-IN, and it has to be. Export reads files and writes files, so it works with no network
 * at all, which is what a CI web build depends on: adding an RPC round trip to the default
 * path would make every offline build fail. `--verify` is for the moment before shipping,
 * not for every build.
 *
 * Two checks, both cheap and both catching a whole class of mistake:
 *
 *   - the CHAIN ID the RPC reports matches the one recorded for this environment, which
 *     catches exporting `localhost` while pointed at a testnet, and vice versa;
 *   - every exported address HAS CODE, which catches a record kept from a chain that was
 *     since reset, a deployment that never landed, and an address copied by hand.
 *
 * Deliberately NOT compared: the deployed bytecode against the record's. Immutables and
 * library links legitimately differ from the artifact, so that check needs its own design and
 * a tolerance model; a false alarm there would teach people to pass `--verify` never.
 */
async function verifyOnChain(params: {
	provider: EIP1193ProviderWithoutEvents;
	environmentName: string;
	expectedChainId: string;
	contracts: {name: string; address: string}[];
}): Promise<void> {
	const {provider, environmentName, expectedChainId, contracts} = params;
	const problems: string[] = [];

	let actualChainId: string;
	try {
		actualChainId = await provider.request({method: 'eth_chainId'});
	} catch (err) {
		// Unable to ASK is not the same as verified. `--verify` was requested explicitly, so an
		//  unreachable node fails the export rather than silently downgrading to no checks.
		throw new OnChainVerificationError({
			environmentName,
			problems: [`could not reach the node to verify the export (${err})`],
		});
	}

	// Compared NUMERICALLY: the recorded id is decimal ('31337') and the RPC answers hex
	//  ('0x7a69'), so a string comparison would fail every single time.
	if (BigInt(actualChainId) !== BigInt(expectedChainId)) {
		problems.push(
			`the node reports chain ${BigInt(actualChainId)} but environment '${environmentName}' holds deployments ` +
				`for chain ${BigInt(expectedChainId)}: the RPC and the environment are not the same network`,
		);
		// Returning here on purpose: on the wrong chain EVERY address would also report no code,
		//  and a page of consequences buries the one cause.
		throw new OnChainVerificationError({environmentName, problems});
	}

	for (const contract of contracts) {
		let code: string;
		try {
			code = await provider.request({method: 'eth_getCode', params: [contract.address as `0x${string}`, 'latest']});
		} catch (err) {
			problems.push(`could not check ${contract.name} at ${contract.address} (${err})`);
			continue;
		}
		if (!code || code === '0x') {
			problems.push(
				`${contract.name} is recorded at ${contract.address}, but that address holds no code on this chain`,
			);
		}
	}

	if (problems.length > 0) {
		throw new OnChainVerificationError({environmentName, problems});
	}
}

/**
 * A provider able to answer `eth_chainId` and `eth_getCode` for the environment's chain.
 *
 * The chain config yields either a caller-supplied provider or an rpcUrl, and `--verify`
 * needs one of them: an environment configured with neither cannot be verified, and saying so
 * is better than exporting unverified output while the user believes it was checked.
 */
async function resolveVerificationProvider(
	config: ResolvedUserConfig,
	chainId: number,
	environmentName: string,
	supplied: EIP1193ProviderWithoutEvents | undefined,
): Promise<EIP1193ProviderWithoutEvents> {
	// A programmatic caller (a test, `@rocketh/web`, a script that already has a connection)
	//  passes its own. Chain CONFIG has no provider field, only an `rpcUrl`, so for the CLI there
	//  is exactly one place an endpoint can come from.
	if (supplied) {
		return supplied;
	}

	let rpcUrl: string | undefined;
	try {
		const chainConfig = getChainConfigFromUserConfig(config, chainId);
		rpcUrl = 'rpcUrl' in chainConfig ? chainConfig.rpcUrl : undefined;
	} catch {
		// It throws its own "no rpc url provided nor any provider" error, which is true but
		//  phrased for the deployment path. Swallowed so the message below can say what to do
		//  about it HERE, including that not verifying is a legitimate answer.
	}

	if (rpcUrl) {
		const {JSONRPCHTTPProvider} = await import('eip-1193-jsonrpc-provider');
		return new JSONRPCHTTPProvider(rpcUrl) as EIP1193ProviderWithoutEvents;
	}

	throw new OnChainVerificationError({
		environmentName,
		problems: [
			`no RPC endpoint is configured for chain ${chainId}, so there is nothing to verify against: ` +
				`give that chain an \`rpcUrl\` in your config, pass a provider to run(), or export without --verify`,
		],
	});
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
		/**
		 * Ask the chain whether these deployments are really there, before writing anything.
		 *
		 * OFF by default, and that is not laziness: export reads files and writes files, so it
		 * runs with no network at all, which a CI web build depends on. Turning this on makes the
		 * export require a reachable RPC for the environment's chain.
		 */
		verify?: boolean;
		/**
		 * The provider `verify` should ask. Defaults to one built from the chain's `rpcUrl`.
		 *
		 * Present because a programmatic caller often HAS a connection already, and because the
		 * alternative for anyone testing this path is intercepting HTTP.
		 */
		provider?: EIP1193ProviderWithoutEvents;
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

	// The dummy provider above is passed only so `getChainConfigFromUserConfig` returns the
	//  metadata this export needs (`info`, `properties`), and it takes the `provider` branch
	//  because ANY truthy value does. For verification a REAL one is needed, so the same lookup
	//  runs again with no provider, which lets the config's own provider (or its rpcUrl) through.
	const providerForVerification = options.verify
		? await resolveVerificationProvider(config, idToFetch, environmentName, options.provider)
		: undefined;

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

	// BEFORE any file is written, and after the export data is assembled so the addresses checked
	//  are exactly the ones about to be shipped. A failure here must leave the previous output
	//  untouched: a half-verified file is worse than an old one, because it looks current.
	if (providerForVerification) {
		await verifyOnChain({
			provider: providerForVerification,
			environmentName,
			expectedChainId: chainId,
			contracts: Object.entries(exportData.contracts).map(([name, contract]) => ({
				name,
				address: (contract as {address: string}).address,
			})),
		});
	}

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

	// Checked ONCE for both module modes, and ahead of writing either: a name that cannot be an
	//  identifier makes the generated file unparseable, and half-writing an output the consumer
	//  cannot load is the silent-stale-file failure this package already refuses elsewhere.
	if (tsmodule.length > 0 || jsmodule.length > 0) {
		const invalidNames = Object.keys(exportData.contracts).filter((name) => !isValidModuleExportName(name));
		if (invalidNames.length > 0) {
			throw new InvalidModuleExportNameError({environmentName, deploymentNames: invalidNames});
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
