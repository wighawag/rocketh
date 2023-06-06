import {traverseMultipleDirectory} from '../utils/fs';
import path from 'node:path';
import fs from 'node:fs';
import type {
	Config,
	Environment,
	ResolvedConfig,
	ResolvedNamedAccounts,
	UnknownArtifacts,
	UnknownDeployments,
	UnresolvedUnknownNamedAccounts,
} from '../environment/types';
import {createEnvironment} from '../environment';
import {DeployScriptFunction, DeployScriptModule, ProvidedContext} from './types';

require('esbuild-register/dist/node').register();

export function execute<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Deployments extends UnknownDeployments = UnknownDeployments
>(
	context: ProvidedContext<Artifacts, NamedAccounts>,
	callback: DeployScriptFunction<Artifacts, ResolvedNamedAccounts<NamedAccounts>, Deployments>,
	options: {tags?: string[]; dependencies?: string[]}
): DeployScriptModule<Artifacts, NamedAccounts, Deployments> {
	const scriptModule = (env: Environment<Artifacts, ResolvedNamedAccounts<NamedAccounts>, Deployments>) =>
		callback(env);
	scriptModule.providedContext = context;
	scriptModule.tags = options.tags;
	scriptModule.dependencies = options.dependencies;
	// TODO id + skip
	return scriptModule as unknown as DeployScriptModule<Artifacts, NamedAccounts, Deployments>;
}

export type ConfigOptions = {network: string; deployments?: string; scripts?: string; tags?: string};

export function readConfig(options: ConfigOptions, extra?: {ignoreMissingRPC?: boolean}): Config {
	type Networks = {[name: string]: {rpcUrl: string}};
	type ConfigFile = {networks: Networks};
	let configFile: ConfigFile | undefined;
	try {
		const configString = fs.readFileSync('./rocketh.json', 'utf-8');
		configFile = JSON.parse(configString);
	} catch {}

	let nodeUrl: string;
	const fromEnv = process.env['ETH_NODE_URI_' + options.network];
	if (typeof fromEnv === 'string') {
		nodeUrl = fromEnv;
	} else {
		if (configFile) {
			const network = configFile.networks && configFile.networks[options.network];
			if (network) {
				nodeUrl = network.rpcUrl;
			} else {
				if (extra?.ignoreMissingRPC) {
					nodeUrl = '';
				} else {
					console.error(`network "${options.network}" is not configured. Please add it to the rocketh.json file`);
					process.exit(1);
				}
			}
		} else {
			if (extra?.ignoreMissingRPC) {
				nodeUrl = '';
			} else {
				console.error(`network "${options.network}" is not configured. Please add it to the rocketh.json file`);
				process.exit(1);
			}
		}
	}

	return {
		nodeUrl,
		networkName: options.network,
		deployments: options.deployments,
		scripts: options.scripts,
		tags: typeof options.tags === 'undefined' ? undefined : options.tags.split(','),
	};
}

export function readAndResolveConfig(options: ConfigOptions, extra?: {ignoreMissingRPC?: boolean}): ResolvedConfig {
	return resolveConfig(readConfig(options, extra));
}

export function resolveConfig(config: Config): ResolvedConfig {
	const resolvedConfig: ResolvedConfig = {
		...config,
		networkName: config.networkName || 'memory',
		deployments: config.deployments || 'deployments',
		scripts: config.scripts || 'deploy',
		tags: config.tags || [],
	};
	return resolvedConfig;
}

export async function loadAndExecuteDeployments<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Deployments extends UnknownDeployments = UnknownDeployments
>(config: Config) {
	const resolvedConfig = resolveConfig(config);

	return executeDeployScripts<Artifacts, NamedAccounts, Deployments>(resolvedConfig);

	// TODO
	// await this.export(options);
}

export async function executeDeployScripts<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Deployments extends UnknownDeployments = UnknownDeployments
>(config: ResolvedConfig): Promise<Deployments> {
	let filepaths;
	filepaths = traverseMultipleDirectory([config.scripts]);
	filepaths = filepaths
		.filter((v) => !path.basename(v).startsWith('_'))
		.sort((a: string, b: string) => {
			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		});

	let providedContext: ProvidedContext<Artifacts, NamedAccounts> | undefined;

	const scriptModuleByFilePath: {[filename: string]: DeployScriptModule} = {};
	const scriptPathBags: {[tag: string]: string[]} = {};
	const scriptFilePaths: string[] = [];

	for (const filepath of filepaths) {
		const scriptFilePath = path.resolve(filepath);
		let scriptModule: DeployScriptModule;
		try {
			if (require.cache) {
				delete require.cache[scriptFilePath]; // ensure we reload it every time, so changes are taken in consideration
			}
			scriptModule = require(scriptFilePath);

			if ((scriptModule as any).default) {
				scriptModule = (scriptModule as any).default as DeployScriptModule;
				if ((scriptModule as any).default) {
					console.warn(`double default...`);
					scriptModule = (scriptModule as any).default as DeployScriptModule;
				}
			}
			scriptModuleByFilePath[scriptFilePath] = scriptModule;
			if (providedContext && providedContext !== scriptModule.providedContext) {
				throw new Error(`context between 2 scripts is different, please share the same across them`);
			}
			providedContext = scriptModule.providedContext as ProvidedContext<Artifacts, NamedAccounts>;
		} catch (e) {
			console.error(`could not import ${filepath}`);
			throw e;
		}

		let scriptTags = scriptModule.tags;
		if (scriptTags !== undefined) {
			if (typeof scriptTags === 'string') {
				scriptTags = [scriptTags];
			}
			for (const tag of scriptTags) {
				if (tag.indexOf(',') >= 0) {
					throw new Error('Tag cannot contains commas');
				}
				const bag = scriptPathBags[tag] || [];
				scriptPathBags[tag] = bag;
				bag.push(scriptFilePath);
			}
		}

		if (config.tags !== undefined && config.tags.length > 0) {
			let found = false;
			if (scriptTags !== undefined) {
				for (const tagToFind of config.tags) {
					for (const tag of scriptTags) {
						if (tag === tagToFind) {
							scriptFilePaths.push(scriptFilePath);
							found = true;
							break;
						}
					}
					if (found) {
						break;
					}
				}
			}
		} else {
			scriptFilePaths.push(scriptFilePath);
		}
	}

	if (!providedContext) {
		throw new Error(`no context loaded`);
	}

	const {internal, external} = await createEnvironment(config, providedContext);

	await internal.recoverTransactionsIfAny();

	const scriptsRegisteredToRun: {[filename: string]: boolean} = {};
	const scriptsToRun: Array<{
		func: DeployScriptModule;
		filePath: string;
	}> = [];
	const scriptsToRunAtTheEnd: Array<{
		func: DeployScriptModule;
		filePath: string;
	}> = [];
	function recurseDependencies(scriptFilePath: string) {
		if (scriptsRegisteredToRun[scriptFilePath]) {
			return;
		}
		const scriptModule = scriptModuleByFilePath[scriptFilePath];
		if (scriptModule.dependencies) {
			for (const dependency of scriptModule.dependencies) {
				const scriptFilePathsToAdd = scriptPathBags[dependency];
				if (scriptFilePathsToAdd) {
					for (const scriptFilenameToAdd of scriptFilePathsToAdd) {
						recurseDependencies(scriptFilenameToAdd);
					}
				}
			}
		}
		if (!scriptsRegisteredToRun[scriptFilePath]) {
			if (scriptModule.runAtTheEnd) {
				scriptsToRunAtTheEnd.push({
					filePath: scriptFilePath,
					func: scriptModule,
				});
			} else {
				scriptsToRun.push({
					filePath: scriptFilePath,
					func: scriptModule,
				});
			}
			scriptsRegisteredToRun[scriptFilePath] = true;
		}
	}
	for (const scriptFilePath of scriptFilePaths) {
		recurseDependencies(scriptFilePath);
	}

	for (const deployScript of scriptsToRun.concat(scriptsToRunAtTheEnd)) {
		const filename = path.basename(deployScript.filePath);
		// if (deployScript.func.id && this.db.migrations[deployScript.func.id]) {
		// 	log(`skipping ${filename} as migrations already executed and complete`);
		// 	continue;
		// }
		let skip = false;
		if (deployScript.func.skip) {
			try {
				skip = await deployScript.func.skip(external);
			} catch (e) {
				console.error(`skip failed for ${deployScript.filePath}`);
				throw e;
			}
		}
		if (!skip) {
			let result;
			try {
				// console.log(`Executing...`);
				result = await deployScript.func(external);
			} catch (e) {
				console.error(`execution failed for ${deployScript.filePath}`);
				throw e;
			}
			if (result && typeof result === 'boolean') {
				// if (!deployScript.func.id) {
				// 	throw new Error(
				// 		`${deployScript.filePath} return true to not be executed again, but does not provide an id. the script function needs to have the field "id" to be set`
				// 	);
				// }
				// this.db.migrations[deployScript.func.id] = Math.floor(Date.now() / 1000);

				const deploymentFolderPath = config.deployments;

				// TODO refactor to extract this whole path and folder existence stuff
				// const toSave = this.db.writeDeploymentsToFiles && this.network.saveDeployments;
				// if (toSave) {
				// 	try {
				// 		fs.mkdirSync(this.deploymentsPath);
				// 	} catch (e) {}
				// 	try {
				// 		fs.mkdirSync(path.join(this.deploymentsPath, deploymentFolderPath));
				// 	} catch (e) {}
				// 	fs.writeFileSync(
				// 		path.join(this.deploymentsPath, deploymentFolderPath, '.migrations.json'),
				// 		JSON.stringify(this.db.migrations, null, '  ')
				// 	);
				// }
			}
		}
	}

	return external.deployments as Deployments;
}
