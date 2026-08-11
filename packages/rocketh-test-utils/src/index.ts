/**
 * @rocketh/test-utils
 *
 * Test utilities for rocketh packages. Provides the `createTestEnvironment` harness
 * (a REAL rocketh environment wired to a mock EIP-1193 provider), plus mock providers,
 * mock artifacts and a mock prompt for testing deployment scenarios.
 */

import type {Abi, Artifact} from '@rocketh/core/types';
import type {EIP1193Provider} from 'eip-1193';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for mock provider responses.
 * Allows tests to specify custom return values for specific RPC methods.
 */
export type MockProviderConfig = {
	/**
	 * Override responses for specific RPC methods.
	 * Can be a static value or a function that receives params and returns a value.
	 */
	responses?: {
		[method: string]: unknown | ((params?: unknown[]) => unknown | Promise<unknown>);
	};

	/**
	 * Called when an unmocked method is requested.
	 * If not provided, returns null and logs a warning.
	 */
	onUnmockedMethod?: (method: string, params?: unknown[]) => unknown | Promise<unknown>;
};

/**
 * A mock EIP-1193 provider with configurable responses.
 */
export type MockProvider = EIP1193Provider & {
	/**
	 * Update the configuration for the mock provider.
	 */
	setConfig: (config: MockProviderConfig) => void;

	/**
	 * Update or add a specific response for an RPC method.
	 */
	setResponse: (method: string, response: unknown | ((params?: unknown[]) => unknown | Promise<unknown>)) => void;

	/**
	 * Get all recorded requests made to the provider.
	 */
	getRequests: () => Array<{method: string; params?: unknown[]}>;

	/**
	 * Clear recorded requests.
	 */
	clearRequests: () => void;

	/**
	 * Add an event listener (no-op in mock).
	 */
	on: (event: string, listener: (...args: unknown[]) => void) => MockProvider;

	/**
	 * Remove an event listener (no-op in mock).
	 */
	removeListener: (event: string, listener: (...args: unknown[]) => void) => MockProvider;
};

// ============================================================================
// Mock Provider
// ============================================================================

/**
 * Default RPC method responses for a mock provider.
 * These simulate a basic EVM environment.
 */
function getDefaultResponses(txCounter: {
	value: number;
}): Record<string, unknown | ((params?: unknown[]) => unknown | Promise<unknown>)> {
	return {
		eth_sendTransaction: () => {
			txCounter.value++;
			return `0x${'0'.repeat(63)}${txCounter.value.toString(16)}` as `0x${string}`;
		},
		eth_sendRawTransaction: () => {
			txCounter.value++;
			return `0x${'1'.repeat(63)}${txCounter.value.toString(16)}` as `0x${string}`;
		},
		eth_getCode: () => '0x',
		eth_getBalance: () => '0x' + BigInt('1000000000000000000000').toString(16),
		evm_mine: () => null,
		eth_getTransactionReceipt: (params?: unknown[]) => ({
			contractAddress: ('0x' + 'a'.repeat(40)) as `0x${string}`,
			status: '0x1',
			blockNumber: '0x1',
			blockHash: `0x${'b'.repeat(64)}`,
			transactionHash: (params?.[0] as string) || `0x${'c'.repeat(64)}`,
			gasUsed: '0x5208',
		}),
		eth_chainId: () => '0x7a69', // 31337
		eth_blockNumber: () => '0x1',
		eth_gasPrice: () => '0x3b9aca00', // 1 gwei
		eth_estimateGas: () => '0x5208', // 21000
		eth_getTransactionCount: () => '0x0',
	};
}

/**
 * Creates a mock EIP-1193 provider with configurable responses.
 *
 * @param config - Optional configuration for custom responses
 * @returns A mock provider that can be used in tests
 *
 * @example
 * ```typescript
 * const provider = createMockProvider({
 *   responses: {
 *     eth_getCode: '0x6080...', // Return deployed code
 *     eth_getBalance: (params) => {
 *       const address = params?.[0];
 *       return address === '0x123...' ? '0x0' : '0x1000';
 *     },
 *   },
 * });
 * ```
 */
export function createMockProvider(config: MockProviderConfig = {}): MockProvider {
	const txCounter = {value: 0};
	const defaultResponses = getDefaultResponses(txCounter);
	let currentConfig = {...config};
	const requests: Array<{method: string; params?: unknown[]}> = [];

	const request = async ({method, params}: {method: string; params?: unknown[]}): Promise<unknown> => {
		requests.push({method, params: params as unknown[]});

		// Check custom responses first
		const customResponse = currentConfig.responses?.[method];
		if (customResponse !== undefined) {
			if (typeof customResponse === 'function') {
				return customResponse(params as unknown[]);
			}
			return customResponse;
		}

		// Check default responses
		const defaultResponse = defaultResponses[method];
		if (defaultResponse !== undefined) {
			if (typeof defaultResponse === 'function') {
				return defaultResponse(params as unknown[]);
			}
			return defaultResponse;
		}

		// Handle unmocked method
		if (currentConfig.onUnmockedMethod) {
			return currentConfig.onUnmockedMethod(method, params as unknown[]);
		}

		console.warn(`Unmocked provider method: ${method}`);
		return null;
	};

	const provider: MockProvider = {
		request: request as EIP1193Provider['request'],
		on: () => provider, // No-op event listener
		removeListener: () => provider, // No-op event listener removal
		setConfig: (newConfig: MockProviderConfig) => {
			currentConfig = {...newConfig};
		},
		setResponse: (method: string, response: unknown | ((params?: unknown[]) => unknown | Promise<unknown>)) => {
			if (!currentConfig.responses) {
				currentConfig.responses = {};
			}
			currentConfig.responses[method] = response;
		},
		getRequests: () => [...requests],
		clearRequests: () => {
			requests.length = 0;
		},
	};
	return provider;
}

// ============================================================================
// Mock Artifacts
// ============================================================================

/**
 * Default ABI for mock artifacts.
 */
const DEFAULT_ABI: Abi = [
	{
		type: 'function',
		name: 'getValue',
		inputs: [],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
	{
		type: 'constructor',
		inputs: [{type: 'uint256', name: '_initialValue'}],
		stateMutability: 'nonpayable',
	},
] as const;

/**
 * Creates a mock artifact for testing.
 *
 * @param name - Contract name
 * @param abi - Optional ABI (defaults to a simple contract with constructor and getValue)
 * @returns A mock artifact object
 *
 * @example
 * ```typescript
 * const artifact = createMockArtifact('MyContract', [
 *   {
 *     type: 'constructor',
 *     inputs: [{type: 'address', name: 'owner'}],
 *     stateMutability: 'nonpayable',
 *   },
 * ]);
 * ```
 */
export function createMockArtifact<TAbi extends Abi = typeof DEFAULT_ABI>(
	name: string,
	abi: TAbi = DEFAULT_ABI as TAbi,
): Artifact<TAbi> {
	return {
		contractName: name,
		abi,
		bytecode: '0x6080604052348015600f57600080fd5b50' as `0x${string}`,
		deployedBytecode: '0x6080604052' as `0x${string}`,
		linkReferences: {},
		metadata: JSON.stringify({compiler: {version: '0.8.20'}, settings: {optimizer: {enabled: true}}}),
	};
}

/**
 * A mock artifact whose TEMPLATE distinguishes it from its siblings — in both the ABI and
 * the BYTECODE.
 *
 * The bytecode half is not cosmetic. A deterministic (create2) deployment derives its
 * address from the bytecode, so templates that differ only in their ABI all deploy to the
 * SAME address. That made the multi-facet diamond example silently document a diamond
 * whose three differently-named facets were one contract: three cuts pointing at one
 * address, with every assertion still green. Each template therefore carries a distinct
 * bytecode (and deployedBytecode, so the redeploy comparison can tell them apart too).
 */
export function createExampleArtifact(name: string, templateNumber: number): Artifact<Abi> {
	const mock = createMockArtifact(name);
	if (templateNumber == 0) {
		(mock as any).abi = [
			{
				type: 'function',
				name: 'getValue0',
				inputs: [],
				outputs: [{type: 'uint256'}],
				stateMutability: 'view',
			},
			{
				type: 'constructor',
				inputs: [{type: 'uint256', name: '_initialValue'}],
				stateMutability: 'nonpayable',
			},
		];
	} else if (templateNumber == 1) {
		(mock as any).abi = [
			{
				type: 'function',
				name: 'getValue1',
				inputs: [],
				outputs: [{type: 'uint256'}],
				stateMutability: 'view',
			},
			{
				type: 'constructor',
				inputs: [{type: 'uint256', name: '_initialValue'}],
				stateMutability: 'nonpayable',
			},
		];
	} else if (templateNumber == 2) {
		(mock as any).abi = [
			{
				type: 'function',
				name: 'getValue2',
				inputs: [],
				outputs: [{type: 'uint256'}],
				stateMutability: 'view',
			},
			{
				type: 'constructor',
				inputs: [{type: 'uint256', name: '_initialValue'}],
				stateMutability: 'nonpayable',
			},
		];
	} else {
		throw new Error(`no template ${templateNumber}`);
	}

	// Distinct code per template, so two templates never collapse onto one create2 address.
	const templateByte = templateNumber.toString(16).padStart(2, '0');
	(mock as any).bytecode = `${mock.bytecode}${templateByte}`;
	(mock as any).deployedBytecode = `${mock.deployedBytecode}${templateByte}`;

	return mock;
}

/**
 * Creates a mock artifact with library references.
 *
 * @param name - Contract name
 * @param libraryName - Name of the library to reference
 * @param abi - Optional ABI
 * @returns A mock artifact with library link references
 *
 * @example
 * ```typescript
 * const artifact = createMockArtifactWithLibrary('Calculator', 'MathLib');
 * ```
 */
export function createMockArtifactWithLibrary<TAbi extends Abi = typeof DEFAULT_ABI>(
	name: string,
	libraryName: string,
	abi: TAbi = DEFAULT_ABI as TAbi,
): Artifact<TAbi> {
	return {
		contractName: name,
		abi,
		bytecode: '0x6080604052348015600f57600080fd5b50' as `0x${string}`,
		deployedBytecode: '0x6080604052' as `0x${string}`,
		linkReferences: {
			'contracts/libraries.sol': {
				[libraryName]: [{length: 20, start: 50}],
			},
		},
		metadata: JSON.stringify({compiler: {version: '0.8.20'}, settings: {optimizer: {enabled: true}}}),
	};
}

// ============================================================================
// Re-exports
// ============================================================================

export type {Environment} from '@rocketh/core/types';

export {
	createTestEnvironment,
	createMapDeploymentStore,
	type CreateTestEnvironmentOptions,
	type TestEnvironmentResult,
	type InternalTestEnvironment,
} from './test-environment.js';

export {
	createMockPromptExecutor,
	type CreateMockPromptExecutorOptions,
	type MockPromptExecutor,
	type MockPromptRequest,
	type MockConfirmPromptRequest,
	type MockTextPromptRequest,
	type MockTextAnswer,
} from './mock-prompt.js';
