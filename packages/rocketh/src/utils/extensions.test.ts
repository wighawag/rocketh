import type {Environment} from '../environment/types.js';
import {withEnvironment} from './extensions.js';

// Mock environment for testing
const mockEnv = {} as Environment;

// Example functions that take environment as first parameter
const exampleExtensions = {
	deploy:
		(env: Environment) =>
		async (contractName: string, args: any[]): Promise<void> => {
			return Promise.resolve();
		},

	verify:
		(env: Environment) =>
		async (address: string): Promise<boolean> => {
			return Promise.resolve(true);
		},

	getBalance:
		(env: Environment) =>
		async (address: string): Promise<bigint> => {
			return Promise.resolve(BigInt(0));
		},

	syncFunction:
		(env: Environment) =>
		(value: number): number => {
			return value * 2;
		},

	provider: (env: Environment) => env.network.provider,
};

// Test the currying function
const enhancedEnv = withEnvironment(mockEnv, exampleExtensions);

// Type tests - these should compile without errors
async function testTypes() {
	// These calls should work without passing env
	await enhancedEnv.deploy('MyContract', []);
	const isVerified = await enhancedEnv.verify('0x123...');
	const balance = await enhancedEnv.getBalance('0x456...');
	const doubled = enhancedEnv.syncFunction(42);
	const provider = enhancedEnv.provider;

	console.log('Type tests passed!');
	console.log({isVerified, balance, doubled, provider});
}

// Export for potential use in actual tests
export {testTypes, enhancedEnv, exampleExtensions};
