import type {Environment} from '../environment/types.js';
import {setup} from './index.js';

// Mock environment for testing
const mockEnv = {} as Environment;

// Example utility functions that take Environment as first parameter
const utilityFunctions = {
	deployContract:
		(env: Environment) =>
		async (contractName: string, args: any[] = []): Promise<string> => {
			console.log(`Deploying ${contractName} with args:`, args);
			return '0x1234567890123456789012345678901234567890';
		},

	verifyContract:
		(env: Environment) =>
		async (address: string): Promise<boolean> => {
			console.log(`Verifying contract at ${address}`);
			return true;
		},

	getBalance:
		(env: Environment) =>
		async (address: string): Promise<bigint> => {
			console.log(`Getting balance for ${address}`);
			return BigInt('1000000000000000000'); // 1 ETH
		},

	calculateGas:
		(env: Environment) =>
		(operation: string): number => {
			console.log(`Calculating gas for ${operation}`);
			return 21000;
		},

	isDeployed:
		(env: Environment) =>
		(contractName: string): boolean => {
			console.log(`Checking if ${contractName} is deployed`);
			return false;
		},

	test: (env: Environment) => true,
};

// Create the enhanced execute function using setup
const {deployScript} = setup(utilityFunctions);

// Test the enhanced execute function
const testScript = deployScript(
	async (env, args) => {
		// Type test: env should have both original Environment properties AND curried functions

		// Test curried functions (no need to pass env)
		const address = await env.deployContract('MyToken', ['TokenName', 'TKN']);
		const isVerified = await env.verifyContract(address);
		const balance = await env.getBalance(address);
		const gasEstimate = env.calculateGas('transfer');
		const deployed = env.isDeployed('MyToken');

		// Test that original environment properties are still accessible
		// (These would normally be available on a real environment)
		// console.log('Network name:', env.network?.name);
		// console.log('Chain ID:', env.network?.chain?.id);

		console.log('Test results:', {
			address,
			isVerified,
			balance: balance.toString(),
			gasEstimate,
			deployed,
		});

		return true; // Return true to indicate successful completion
	},
	{
		tags: ['test'],
		dependencies: [],
		id: 'test-setup-function',
	}
);

// Type tests - these should compile without errors
async function testTypes() {
	// The script should be a valid DeployScriptModule
	console.log('Script tags:', testScript.tags);
	console.log('Script dependencies:', testScript.dependencies);
	console.log('Script ID:', testScript.id);

	// The script should be callable with an environment
	try {
		const result = await testScript(mockEnv, undefined);
		console.log('Script execution result:', result);
	} catch (error) {
		console.log('Script execution test completed (expected with mock env)');
	}
}

// Example of how this would be used in a real deployment script
export const exampleUsage = () => {
	// Define your utility functions
	const myFunctions = {
		deployERC20:
			(env: Environment) =>
			async (name: string, symbol: string): Promise<string> => {
				// Implementation would use env.save, env.network.provider, etc.
				return '0x...';
			},

		setupPermissions:
			(env: Environment) =>
			async (contractAddress: string, admin: string): Promise<void> => {
				// Implementation would interact with contracts
			},

		verifyOnEtherscan:
			(env: Environment) =>
			async (address: string, constructorArgs: any[]): Promise<boolean> => {
				// Implementation would call verification service
				return true;
			},
	};

	// Create the enhanced execute function
	const {deployScript} = setup(myFunctions);

	// Export your deployment script
	return deployScript(
		async (env, args) => {
			// Now you can use the functions without passing env each time
			const tokenAddress = await env.deployERC20('MyToken', 'MTK');
			await env.setupPermissions(tokenAddress, env.namedAccounts.deployer);
			await env.verifyOnEtherscan(tokenAddress, ['MyToken', 'MTK']);

			// Original environment is still fully accessible
			console.log(`Deployed on network: ${env.network.name}`);
			const deployment = env.get('MyToken');

			return true;
		},
		{
			tags: ['token', 'deploy'],
			dependencies: ['setup'],
			id: 'deploy-my-token',
		}
	);
};

// Export for potential use in actual tests
export {testTypes, testScript, utilityFunctions};
