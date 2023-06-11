import './type-extensions';

import fs from 'node:fs';
import path from 'node:path';

import {subtask, task, extendConfig} from 'hardhat/config';
import {TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS} from 'hardhat/builtin-tasks/task-names';
import {loadAndExecuteDeployments} from 'rocketh';
import {HardhatConfig, HardhatUserConfig} from 'hardhat/types';

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

subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(async (args, hre, runSuper): Promise<any> => {
	const allArtifacts: {[name: string]: any} = {}; // TODO read current ?
	const artifactResult = await runSuper(args);
	const shortNameDict: {[shortName: string]: boolean} = {};
	for (const artifact of artifactResult.artifactsEmittedPerFile) {
		const filepath = `./artifacts/${artifact.file.sourceName}/${artifact.artifactsEmitted[0]}.json`;
		if (fs.existsSync(filepath)) {
			for (let i = 0; i < artifact.artifactsEmitted.length; i++) {
				const shortName = artifact.artifactsEmitted[i];
				const content = fs.readFileSync(filepath, 'utf-8');
				const parsed = JSON.parse(content);

				const debugFilepath = filepath.replace('.json', '.dbg.json');
				const debugContent = fs.readFileSync(debugFilepath, 'utf-8');
				const parsedDebug: {_format: string; buildInfo: string} = JSON.parse(debugContent);
				const buildInfoFilepath = path.join(path.dirname(path.resolve(debugFilepath)), parsedDebug.buildInfo);
				const buildInfoContent = fs.readFileSync(buildInfoFilepath, 'utf-8');
				const parsedBuildInfo = JSON.parse(buildInfoContent);
				const solidityOutput = parsedBuildInfo.output.contracts[artifact.file.sourceName][shortName];

				const artifactObject = {...parsed, ...solidityOutput};
				const fullName = `${artifact.file.sourceName}/${shortName}`;
				allArtifacts[fullName] = artifactObject;
				if (shortNameDict[shortName]) {
					delete allArtifacts[shortName];
				} else {
					allArtifacts[shortName] = artifactObject;
					shortNameDict[shortName] = true;
				}
			}
		} else {
			// this can happen for solidity file without contract exported, just error or types for example
			// throw new Error(`no artifact at ${filepath}`);
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

	const js =
		typeof hre.config.generateArtifacts?.js === 'string'
			? [hre.config.generateArtifacts?.js]
			: hre.config.generateArtifacts?.js || [];
	const ts =
		typeof hre.config.generateArtifacts?.ts === 'string'
			? [hre.config.generateArtifacts?.ts]
			: hre.config.generateArtifacts?.ts || [];
	const json =
		typeof hre.config.generateArtifacts?.json === 'string'
			? [hre.config.generateArtifacts?.json]
			: hre.config.generateArtifacts?.json || [];

	if (typeof ts === 'object' && ts.length > 0) {
		const newContent = `export default ${JSON.stringify(allArtifacts, null, 2)} as const;`;
		for (const tsFile of ts) {
			const folderPath = path.dirname(tsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(tsFile, newContent);
		}
	}

	if (typeof js === 'object' && js.length > 0) {
		const newContent = `export default /** @type {const} **/ (${JSON.stringify(allArtifacts, null, 2)});`;
		const dtsContent = `export = ${JSON.stringify(allArtifacts, null, 2)} as const;`;
		for (const jsFile of js) {
			const folderPath = path.dirname(jsFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(jsFile, newContent);
			fs.writeFileSync(jsFile.replace('.js', '.d.ts'), dtsContent);
		}
	}

	if (typeof json === 'object' && json.length > 0) {
		const newContent = JSON.stringify(allArtifacts, null, 2);
		for (const jsonFile of json) {
			const folderPath = path.dirname(jsonFile);
			fs.mkdirSync(folderPath, {recursive: true});
			fs.writeFileSync(jsonFile, newContent);
		}
	}

	return artifactResult;
});