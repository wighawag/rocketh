import type {Environment} from '../environment/types.js';
import {withEnvironment} from './curry.js';

// Mock environment for testing
const mockEnv = {} as Environment;

// Example functions that take environment as first parameter
const exampleFunctions = {
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
};

// Test the currying function
const curriedFunctions = withEnvironment(mockEnv, exampleFunctions);

// Type tests - these should compile without errors
async function testTypes() {
	// These calls should work without passing env
	await curriedFunctions.deploy('MyContract', []);
	const isVerified = await curriedFunctions.verify('0x123...');
	const balance = await curriedFunctions.getBalance('0x456...');
	const doubled = curriedFunctions.syncFunction(42);

	console.log('Type tests passed!');
	console.log({isVerified, balance, doubled});
}

// Export for potential use in actual tests
export {testTypes, curriedFunctions, exampleFunctions};
