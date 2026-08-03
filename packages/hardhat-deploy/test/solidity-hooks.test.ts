import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {generateTypes} from '../src/generate-types.js';

vi.mock('../src/generate-types.js', async (importOriginal) => {
	const original = await importOriginal<typeof import('../src/generate-types.js')>();
	return {
		...original,
		generateTypes: vi.fn(original.generateTypes),
	};
});

const generateTypesMock = vi.mocked(generateTypes);

// ----------------------------------------------------------------------------
// minimal hardhat doubles
// ----------------------------------------------------------------------------

type Handlers = {
	processArtifactsAfterSuccessfulBuild: (
		context: any,
		artifactPaths: readonly string[],
		buildRootFilePaths: readonly string[],
		buildOptions: {cleanupArtifacts: boolean},
	) => Promise<void>;
	onCleanUpArtifacts?: unknown;
};

async function getHandlers(): Promise<Handlers> {
	const solidityHooks = (await import('../src/hook-handlers/solidity.js')).default;
	return (await solidityHooks()) as unknown as Handlers;
}

function createContext(artifactsFolder: string, generatedFolder: string) {
	return {
		config: {
			paths: {artifacts: artifactsFolder},
			generateTypedArtifacts: {destinations: [{folder: generatedFolder, mode: 'typescript' as const}]},
		},
	};
}

/**
 * A full build: hardhat cleans up the artifacts, then runs the hook.
 */
async function runFullBuild(handlers: Handlers, context: any, artifactPaths: string[]): Promise<void> {
	await handlers.processArtifactsAfterSuccessfulBuild(context, artifactPaths, [], {cleanupArtifacts: true});
}

/**
 * What `hardhat --network <network> deploy` does: the deploy task builds with
 * `noTests: true`, which is not a full build, so hardhat performs no artifact
 * cleanup. This is the case the previous `onCleanUpArtifacts` based generation
 * never covered.
 */
async function runPartialBuild(handlers: Handlers, context: any, artifactPaths: string[]): Promise<void> {
	await handlers.processArtifactsAfterSuccessfulBuild(context, artifactPaths, [], {cleanupArtifacts: false});
}

// ----------------------------------------------------------------------------
// artifacts folder fixture
// ----------------------------------------------------------------------------

const BUILD_INFO_ID = 'solc-0_8_28-testbuildinfo';

function writeArtifactsFolder(artifactsFolder: string, options: {bytecode: string}): string {
	const contractFolder = path.join(artifactsFolder, 'src', 'Greeter.sol');
	fs.mkdirSync(contractFolder, {recursive: true});
	fs.mkdirSync(path.join(artifactsFolder, 'build-info'), {recursive: true});

	const abi = [{type: 'function', name: 'greet', inputs: [], outputs: [], stateMutability: 'view'}];

	fs.writeFileSync(
		path.join(contractFolder, 'Greeter.json'),
		JSON.stringify({
			_format: 'hh3-artifact-1',
			contractName: 'Greeter',
			sourceName: 'src/Greeter.sol',
			abi,
			bytecode: options.bytecode,
			deployedBytecode: options.bytecode,
			linkReferences: {},
			deployedLinkReferences: {},
			immutableReferences: {},
			inputSourceName: 'project/src/Greeter.sol',
			buildInfoId: BUILD_INFO_ID,
		}),
	);

	fs.writeFileSync(
		path.join(artifactsFolder, 'build-info', `${BUILD_INFO_ID}.output.json`),
		JSON.stringify({
			output: {
				contracts: {
					'project/src/Greeter.sol': {
						Greeter: {abi, evm: {}},
					},
				},
			},
		}),
	);

	return path.join(contractFolder, 'Greeter.json');
}

// ----------------------------------------------------------------------------

describe('solidity hook handlers', () => {
	let tmpFolder: string;
	let artifactsFolder: string;
	let generatedFolder: string;
	let artifactPath: string;

	beforeEach(() => {
		vi.resetModules();
		generateTypesMock.mockClear();

		tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'hardhat-deploy-hooks-'));
		artifactsFolder = path.join(tmpFolder, 'artifacts');
		generatedFolder = path.join(tmpFolder, 'generated');
		artifactPath = writeArtifactsFolder(artifactsFolder, {bytecode: '0xaaaa'});
	});

	afterEach(() => {
		fs.rmSync(tmpFolder, {recursive: true, force: true});
	});

	describe('when a build does not clean up artifacts (what `deploy` does)', () => {
		it('generates the typed artifacts', async () => {
			const handlers = await getHandlers();
			const context = createContext(artifactsFolder, generatedFolder);

			await runPartialBuild(handlers, context, [artifactPath]);

			expect(generateTypesMock).toHaveBeenCalledTimes(1);
			expect(fs.existsSync(path.join(generatedFolder, 'artifacts', 'Greeter.ts'))).toBe(true);
		});

		it('picks up artifacts recompiled since the last full build', async () => {
			const handlers = await getHandlers();
			const context = createContext(artifactsFolder, generatedFolder);

			await runFullBuild(handlers, context, [artifactPath]);
			const afterFullBuild = fs.readFileSync(path.join(generatedFolder, 'artifacts', 'Greeter.ts'), 'utf-8');
			expect(afterFullBuild).toContain('0xaaaa');

			// same thing `deploy` does: recompile (here with another build profile,
			//  hence another bytecode) without a full build
			writeArtifactsFolder(artifactsFolder, {bytecode: '0xbbbb'});
			await runPartialBuild(handlers, context, [artifactPath]);

			const afterPartialBuild = fs.readFileSync(path.join(generatedFolder, 'artifacts', 'Greeter.ts'), 'utf-8');
			expect(afterPartialBuild).toContain('0xbbbb');
			expect(afterPartialBuild).not.toContain('0xaaaa');
		});
	});

	describe('when a build cleans up artifacts (a full build)', () => {
		it('generates the typed artifacts exactly once', async () => {
			const handlers = await getHandlers();
			const context = createContext(artifactsFolder, generatedFolder);

			await runFullBuild(handlers, context, [artifactPath]);

			expect(generateTypesMock).toHaveBeenCalledTimes(1);
			expect(fs.existsSync(path.join(generatedFolder, 'artifacts', 'Greeter.ts'))).toBe(true);
		});
	});

	describe('guards and contract with hardhat', () => {
		it('does not register the deprecated `onCleanUpArtifacts` hook', async () => {
			const handlers = await getHandlers();

			// generation is driven only by `processArtifactsAfterSuccessfulBuild`, which
			//  hardhat runs for every successful "contracts" build
			expect(handlers.onCleanUpArtifacts).toBeUndefined();
		});

		it('generates from the artifacts folder, not from the artifact paths the hook receives', async () => {
			const handlers = await getHandlers();
			const context = createContext(artifactsFolder, generatedFolder);

			// the hook argument is only a "there is something to generate" guard: the
			//  paths themselves are never read, the artifacts folder is rescanned
			await runPartialBuild(handlers, context, ['/does/not/exist/Whatever.json']);

			expect(generateTypesMock).toHaveBeenCalledWith(
				{artifacts: [artifactsFolder]},
				context.config.generateTypedArtifacts,
			);
			expect(fs.existsSync(path.join(generatedFolder, 'artifacts', 'Greeter.ts'))).toBe(true);
		});

		it('does not generate when there is no artifact at all', async () => {
			const handlers = await getHandlers();
			const context = createContext(artifactsFolder, generatedFolder);

			await runPartialBuild(handlers, context, []);
			await runFullBuild(handlers, context, []);

			expect(generateTypesMock).not.toHaveBeenCalled();
		});

		it('generates for each hardhat instance', async () => {
			const handlers = await getHandlers();
			const contextA = createContext(artifactsFolder, generatedFolder);
			const contextB = createContext(artifactsFolder, path.join(tmpFolder, 'generated-b'));

			await runFullBuild(handlers, contextA, [artifactPath]);
			await runFullBuild(handlers, contextB, [artifactPath]);

			expect(generateTypesMock).toHaveBeenCalledTimes(2);
			expect(fs.existsSync(path.join(generatedFolder, 'artifacts', 'Greeter.ts'))).toBe(true);
			expect(fs.existsSync(path.join(tmpFolder, 'generated-b', 'artifacts', 'Greeter.ts'))).toBe(true);
		});
	});
});
