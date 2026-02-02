/**
 * @rocketh/test-utils
 *
 * Test utilities for rocketh packages. Provides mock environments, providers,
 * and artifacts for testing deployment scenarios.
 */

import type {Abi, Artifact, Environment} from '@rocketh/core/types';
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

/**
 * Options for creating a mock environment.
 */
export type MockEnvironmentOptions = {
	/**
	 * Custom provider configuration.
	 */
	providerConfig?: MockProviderConfig;

	/**
	 * Custom named accounts. Defaults to deployer, user1, user2.
	 */
	namedAccounts?: Record<string, `0x${string}`>;

	/**
	 * Chain ID. Defaults to 31337 (localhost).
	 */
	chainId?: number;

	/**
	 * Chain name. Defaults to 'localhost'.
	 */
	chainName?: string;

	/**
	 * Tags to set on the environment.
	 */
	tags?: Record<string, boolean>;
};

/**
 * Result of creating a mock environment.
 */
export type MockEnvironmentResult = {
	/**
	 * The mock environment.
	 */
	env: Environment;

	/**
	 * The mock provider (for inspecting/updating responses).
	 */
	provider: MockProvider;

	/**
	 * The deployments record (for inspecting saved deployments).
	 */
	deployments: Record<string, unknown>;
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
// Mock Environment
// ============================================================================

/**
 * Default named accounts for testing.
 */
const DEFAULT_NAMED_ACCOUNTS: Record<string, `0x${string}`> = {
	deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
	user1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
	user2: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
};

/**
 * Creates a mock environment for testing deployments.
 *
 * @param options - Optional configuration
 * @returns An object containing the environment, provider, and deployments record
 *
 * @example
 * ```typescript
 * // Basic usage
 * const {env, provider} = createMockEnvironment();
 *
 * // With custom provider responses
 * const {env, provider} = createMockEnvironment({
 *   providerConfig: {
 *     responses: {
 *       eth_getCode: '0x6080...', // Simulate deployed contract
 *     },
 *   },
 * });
 *
 * // Update responses during test
 * provider.setResponse('eth_getCode', '0x'); // Reset to empty
 * ```
 */
export function createMockEnvironment(options: MockEnvironmentOptions = {}): MockEnvironmentResult {
	const deployments: Record<string, unknown> = {};
	const provider = createMockProvider(options.providerConfig);
	const namedAccounts = options.namedAccounts || DEFAULT_NAMED_ACCOUNTS;
	const chainId = options.chainId ?? 31337;
	const chainName = options.chainName ?? 'localhost';

	const addressSigners: Record<string, {type: 'remote'; signer: MockProvider}> = {};
	for (const address of Object.values(namedAccounts)) {
		addressSigners[address.toLowerCase()] = {
			type: 'remote',
			signer: provider,
		};
	}

	const env: Environment = {
		namedAccounts: namedAccounts as Record<string, `0x${string}`>,
		network: {
			chain: {
				id: chainId,
				name: chainName,
				nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
			},
			provider,
			deterministicDeployment: {
				create2: {
					factory: '0x4e59b44847b379578588920cA78FbF26c0B4956C' as `0x${string}`,
					deployer: '0x3f39e218c8a8b13d2488ccf2a3b7d0e3c0c8e8d9' as `0x${string}`,
					signedTx: '0xf8a5' as `0x${string}`,
					funding: '100000000000000000',
				},
				create3: {
					factory: '0x000000000004d4f168daE7DB3C610F408eE22F57',
					salt: '0x5361109ca02853ca8e22046b7125306d9ec4ae4cdecc393c567b6be861df3db6',
					bytecode:
						'0x6080604052348015600f57600080fd5b506103ca8061001f6000396000f3fe6080604052600436106100295760003560e01c8063360d0fad1461002e5780639881d19514610077575b600080fd5b34801561003a57600080fd5b5061004e610049366004610228565b61008a565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b61004e61008536600461029c565b6100ee565b6040517fffffffffffffffffffffffffffffffffffffffff000000000000000000000000606084901b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e78261014c565b9392505050565b6040517fffffffffffffffffffffffffffffffffffffffff0000000000000000000000003360601b166020820152603481018290526000906054016040516020818303038152906040528051906020012091506100e734848461015e565b600061015882306101ce565b92915050565b60006f67363d3d37363d34f03d5260086018f3600052816010806000f58061018e5763301164256000526004601cfd5b8060145261d69460005260016034536017601e20915060008085516020870188855af1823b026101c65763301164256000526004601cfd5b509392505050565b60006040518260005260ff600b53836020527f21c35dbe1b344a2488cf3321d6ce542f8e9f305544ff09e4993a62319a497c1f6040526055600b20601452806040525061d694600052600160345350506017601e20919050565b6000806040838503121561023b57600080fd5b823573ffffffffffffffffffffffffffffffffffffffff8116811461025f57600080fd5b946020939093013593505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600080604083850312156102af57600080fd5b823567ffffffffffffffff8111156102c657600080fd5b8301601f810185136102d757600080fd5b803567ffffffffffffffff8111156102f1576102f161026d565b6040517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0603f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8501160116810181811067ffffffffffffffff8211171561035d5761035d61026d565b60405281815282820160200187101561037557600080fd5b816020840160208301376000602092820183015296940135945050505056fea264697066735822122059dcc5dc6453397d13ff28021e28472a80a45bbd97f3135f69bd2650773aeb0164736f6c634300081a0033',
					proxyBytecode: '0x67363d3d37363d34f03d5260086018f3',
				},
			},
		},
		addressSigners,
		tags: {
			test: true,
			'auto-mine': true,
			...(options.tags || {}),
		},
		get: <T>(name: string) => deployments[name] as T,
		getOrNull: <T>(name: string) => (deployments[name] as T) || null,
		save: async <T>(name: string, deployment: T) => {
			deployments[name] = deployment;
			return deployment as T;
		},
		savePendingDeployment: async (pendingDeployment: unknown) => {
			const pd = pendingDeployment as {
				partialDeployment: Record<string, unknown>;
				expectedAddress?: `0x${string}`;
			};
			return {
				...pd.partialDeployment,
				address: pd.expectedAddress || (('0x' + '1'.repeat(40)) as `0x${string}`),
				newlyDeployed: true,
			};
		},
		savePendingExecution: async () => {},
		showMessage: (message: string) => {
			// Could be configured to capture messages for testing
		},
	} as unknown as Environment;

	return {env, provider, deployments};
}

// ============================================================================
// Re-exports
// ============================================================================

export type {Environment} from '@rocketh/core/types';
