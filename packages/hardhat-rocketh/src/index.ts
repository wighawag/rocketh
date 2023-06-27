import './type-extensions';

import fs from 'node:fs';
import path from 'node:path';

import {subtask, task, extendConfig} from 'hardhat/config';
import {TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS} from 'hardhat/builtin-tasks/task-names';
import {loadAndExecuteDeployments} from 'rocketh';
import {HardhatConfig, HardhatUserConfig} from 'hardhat/types';
import {ArtifactGenerationConfig} from './type-extensions';

export * from './utils';

function addIfNotPresent(array: string[], value: string) {
	if (array.indexOf(value) === -1) {
		array.push(value);
	}
}
function setupExtraSolcSettings(settings: {
	metadata: {useLiteralContent: boolean};
	outputSelection: {'*': {'': string[]; '*': string[]}};
}): void {
	settings.metadata = settings.metadata || {};
	settings.metadata.useLiteralContent = true;

	if (settings.outputSelection === undefined) {
		settings.outputSelection = {
			'*': {
				'*': [],
				'': [],
			},
		};
	}
	if (settings.outputSelection['*'] === undefined) {
		settings.outputSelection['*'] = {
			'*': [],
			'': [],
		};
	}
	if (settings.outputSelection['*']['*'] === undefined) {
		settings.outputSelection['*']['*'] = [];
	}
	if (settings.outputSelection['*'][''] === undefined) {
		settings.outputSelection['*'][''] = [];
	}

	addIfNotPresent(settings.outputSelection['*']['*'], 'abi');
	// addIfNotPresent(settings.outputSelection['*']['*'], 'evm.bytecode');
	// addIfNotPresent(settings.outputSelection['*']['*'], 'evm.deployedBytecode');
	addIfNotPresent(settings.outputSelection['*']['*'], 'metadata');
	addIfNotPresent(settings.outputSelection['*']['*'], 'devdoc');
	addIfNotPresent(settings.outputSelection['*']['*'], 'userdoc');
	addIfNotPresent(settings.outputSelection['*']['*'], 'storageLayout');
	// addIfNotPresent(settings.outputSelection['*']['*'], 'evm.methodIdentifiers');
	addIfNotPresent(settings.outputSelection['*']['*'], 'evm.gasEstimates');
	// addIfNotPresent(settings.outputSelection["*"][""], "ir");
	// addIfNotPresent(settings.outputSelection["*"][""], "irOptimized");
	// addIfNotPresent(settings.outputSelection["*"][""], "ast");
}

extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
	config.generateArtifacts = userConfig.generateArtifacts || {
		ts: ['./generated/artifacts.ts'],
	};

	for (const compiler of config.solidity.compilers) {
		setupExtraSolcSettings(compiler.settings);
	}
});

task('deploy', 'Deploy contracts').setAction(async (args, hre) => {
	await loadAndExecuteDeployments({
		provider: hre.network.provider as unknown as any,
		networkName: hre.network.name,
		logLevel: 1,
	});
});

function traverse(
	dir: string,
	result: any[] = [],
	topDir?: string,
	filter?: (name: string, stats: any) => boolean // TODO any is Stats
): Array<{
	name: string;
	path: string;
	relativePath: string;
	mtimeMs: number;
	directory: boolean;
}> {
	fs.readdirSync(dir).forEach((name) => {
		const fPath = path.resolve(dir, name);
		const stats = fs.statSync(fPath);
		if ((!filter && !name.startsWith('.')) || (filter && filter(name, stats))) {
			const fileStats = {
				name,
				path: fPath,
				relativePath: path.relative(topDir || dir, fPath),
				mtimeMs: stats.mtimeMs,
				directory: stats.isDirectory(),
			};
			if (fileStats.directory) {
				result.push(fileStats);
				return traverse(fPath, result, topDir || dir, filter);
			}
			result.push(fileStats);
		}
	});
	return result;
}

function writeFiles(name: string | undefined, data: any, config: ArtifactGenerationConfig) {
	const js = typeof config?.js === 'string' ? [config?.js] : config?.js || [];
	const ts = typeof config?.ts === 'string' ? [config?.ts] : config?.ts || [];
	const json = typeof config?.json === 'string' ? [config?.json] : config?.json || [];

	if (typeof ts === 'object' && ts.length > 0) {
		const newContent = `export default ${JSON.stringify(data, null, 2)} as const;`;
		for (const tsFile of ts) {
			if (tsFile.endsWith('.ts')) {
				if (!name) {
					const filepath = tsFile;
					const folderPath = path.dirname(filepath);
					fs.mkdirSync(folderPath, {recursive: true});
					fs.writeFileSync(filepath, newContent);
				}
			} else {
				if (name) {
					const filepath = `${tsFile}/${name}.ts`;
					const folderPath = path.dirname(filepath);
					fs.mkdirSync(folderPath, {recursive: true});
					fs.writeFileSync(filepath, newContent);
				}
			}
		}
	}

	if (typeof js === 'object' && js.length > 0) {
		const newContent = `export default /** @type {const} **/ (${JSON.stringify(data, null, 2)});`;
		const dtsContent = `export = ${JSON.stringify(data, null, 2)} as const;`;
		for (const jsFile of js) {
			if (jsFile.endsWith('.js')) {
				if (!name) {
					const filepath = jsFile;
					const folderPath = path.dirname(filepath);
					fs.mkdirSync(folderPath, {recursive: true});
					fs.writeFileSync(filepath, newContent);
					fs.writeFileSync(filepath.replace(/\.js$/, '.d.ts'), dtsContent);
				}
			} else {
				if (name) {
					const filepath = `${jsFile}/${name}.js`;
					const folderPath = path.dirname(filepath);
					fs.mkdirSync(folderPath, {recursive: true});
					fs.writeFileSync(filepath, newContent);
					fs.writeFileSync(filepath.replace(/\.js$/, '.d.ts'), dtsContent);
				}
			}
		}
	}

	if (typeof json === 'object' && json.length > 0) {
		const newContent = JSON.stringify(data, null, 2);
		for (const jsonFile of json) {
			if (jsonFile.endsWith('.json')) {
				if (!name) {
					const filepath = jsonFile;
					const folderPath = path.dirname(filepath);
					fs.mkdirSync(folderPath, {recursive: true});
					fs.writeFileSync(filepath, newContent);
				}
			} else {
				if (name) {
					const filepath = `${jsonFile}/${name}.json`;
					const folderPath = path.dirname(filepath);
					fs.mkdirSync(folderPath, {recursive: true});
					fs.writeFileSync(filepath, newContent);
				}
			}
		}
	}
}

subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(async (args, hre, runSuper): Promise<any> => {
	const allArtifacts: {[name: string]: any} = {}; // TODO read current ?
	const artifactResult = await runSuper(args);
	const shortNameDict: {[shortName: string]: boolean} = {};
	const files = traverse('./artifacts', [], undefined, (name) => name != 'build-info');

	for (const file of files) {
		const filename = path.basename(file.path);
		const dirname = path.dirname(file.relativePath);
		// const namePath = dirname.replace('.sol', '');
		const contractName = filename.replace('.json', '');
		if (file.directory || file.path.endsWith('.dbg.json')) {
			continue;
		}
		// const shortName = artifact.artifactsEmitted[i];
		const content = fs.readFileSync(file.path, 'utf-8');
		const parsed = JSON.parse(content);

		const debugFilepath = file.path.replace('.json', '.dbg.json');
		const debugContent = fs.readFileSync(debugFilepath, 'utf-8');
		const parsedDebug: {_format: string; buildInfo: string} = JSON.parse(debugContent);
		const buildInfoFilepath = path.join(path.dirname(path.resolve(debugFilepath)), parsedDebug.buildInfo);
		if (fs.existsSync(buildInfoFilepath)) {
			const buildInfoContent = fs.readFileSync(buildInfoFilepath, 'utf-8');
			const parsedBuildInfo = JSON.parse(buildInfoContent);
			const solidityOutput = parsedBuildInfo.output.contracts[dirname][contractName];

			const artifactObject = {...parsed, ...solidityOutput};
			const fullName = `${dirname}/${contractName}`;
			allArtifacts[fullName] = artifactObject;
			if (shortNameDict[contractName]) {
				delete allArtifacts[contractName];
			} else {
				allArtifacts[contractName] = artifactObject;
				shortNameDict[contractName] = true;
			}
		}
	}
	for (const key of Object.keys(allArtifacts)) {
		if (key.indexOf('/') >= 0) {
			const split = key.split('/');
			if (split.length > 1) {
				const shortName = split[split.length - 1];
				if (allArtifacts[shortName]) {
					delete allArtifacts[key];
				}
			}
		}
	}

	for (const key of Object.keys(allArtifacts)) {
		const artifact = allArtifacts[key];
		writeFiles(key, artifact, hre.config.generateArtifacts);
	}
	writeFiles(undefined, allArtifacts, hre.config.generateArtifacts);

	return artifactResult;
});
