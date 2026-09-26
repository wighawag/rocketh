/**
 * The compiled contracts of the miniature project, standing in for what a real project's
 * `generated/artifacts` holds after `hardhat compile`.
 *
 * They are MOCKS: the ABIs are the real shape a script is typed against, the bytecode is a
 * placeholder the mock provider never executes. Each contract gets its own bytecode marker, so
 * two contracts never share a create2 address and a "recompiled" contract is really different.
 *
 * `artifacts` is deliberately a plain mutable object, as a module namespace would be to the
 * scripts that read it: the proxy-upgrade tests swap one entry to model "the source changed and
 * the project was recompiled", then re-run the unchanged script.
 */

import type {Abi, Artifact} from 'rocketh/types';
import {createMockArtifact, createMockArtifactWithLibrary} from '@rocketh/test-utils';

function contract<const TAbi extends Abi>(name: string, abi: TAbi, marker: string): Artifact<TAbi> {
	const base = createMockArtifact(name, abi);
	return {
		...base,
		bytecode: `${base.bytecode}${marker}` as `0x${string}`,
		deployedBytecode: `${base.deployedBytecode}${marker}` as `0x${string}`,
	};
}

const TokenAbi = [
	{
		type: 'constructor',
		inputs: [
			{type: 'address', name: 'owner'},
			{type: 'uint256', name: 'supply'},
			{type: 'string', name: 'name'},
			{type: 'string', name: 'symbol'},
		],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'balanceOf',
		inputs: [{type: 'address', name: 'account'}],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'transfer',
		inputs: [
			{type: 'address', name: 'to'},
			{type: 'uint256', name: 'amount'},
		],
		outputs: [{type: 'bool'}],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const MathLibAbi = [] as const satisfies Abi;

const CalculatorAbi = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'base'}], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'add',
		inputs: [{type: 'uint256', name: 'value'}],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const RegistryAbi = [
	{type: 'constructor', inputs: [], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'lookup',
		inputs: [{type: 'bytes32', name: 'key'}],
		outputs: [{type: 'address'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const GreetingsRegistryAbi = [
	{type: 'constructor', inputs: [{type: 'string', name: 'prefix'}], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'setMessage',
		inputs: [{type: 'string', name: 'message'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'messages',
		inputs: [{type: 'address', name: 'user'}],
		outputs: [{type: 'string'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const VaultAbi = [
	{
		type: 'function',
		name: 'initialize',
		inputs: [{type: 'address', name: 'guardian'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'migrate',
		inputs: [{type: 'uint256', name: 'version'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{type: 'function', name: 'totalAssets', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

const TreasuryAbi = [
	{type: 'constructor', inputs: [{type: 'uint256', name: 'limit'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'limit', inputs: [], outputs: [{type: 'uint256'}], stateMutability: 'view'},
] as const satisfies Abi;

const ERC20FacetAbi = [
	{
		type: 'function',
		name: 'initialize',
		inputs: [
			{type: 'string', name: 'name'},
			{type: 'string', name: 'symbol'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'balanceOf',
		inputs: [{type: 'address', name: 'account'}],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

const PausableFacetAbi = [
	{type: 'function', name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable'},
	{type: 'function', name: 'paused', inputs: [], outputs: [{type: 'bool'}], stateMutability: 'view'},
] as const satisfies Abi;

const GreeterAbi = [
	{type: 'constructor', inputs: [{type: 'string', name: 'greeting'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'greet', inputs: [], outputs: [{type: 'string'}], stateMutability: 'view'},
	{
		type: 'function',
		name: 'setGreeting',
		inputs: [{type: 'string', name: 'greeting'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

const FaucetAbi = [
	{type: 'constructor', inputs: [{type: 'address', name: 'token'}], stateMutability: 'nonpayable'},
	{type: 'function', name: 'drip', inputs: [], outputs: [], stateMutability: 'nonpayable'},
] as const satisfies Abi;

export const artifacts = {
	Token: contract('Token', TokenAbi, '01'),
	MathLib: contract('MathLib', MathLibAbi, '02'),
	/** Links `MathLib`: its bytecode carries a 20-byte link reference at byte offset 50. */
	Calculator: createMockArtifactWithLibrary('Calculator', 'MathLib', CalculatorAbi),
	Registry: contract('Registry', RegistryAbi, '03'),
	GreetingsRegistry: contract('GreetingsRegistry', GreetingsRegistryAbi, '04'),
	Vault: contract('Vault', VaultAbi, '05'),
	Treasury: contract('Treasury', TreasuryAbi, '06'),
	TreasuryV2: contract('TreasuryV2', TreasuryAbi, '07'),
	ERC20Facet: contract('ERC20Facet', ERC20FacetAbi, '08'),
	PausableFacet: contract('PausableFacet', PausableFacetAbi, '09'),
	Greeter: contract('Greeter', GreeterAbi, '0a'),
	Faucet: contract('Faucet', FaucetAbi, '0b'),
};

/** `Vault` after a source change: the same ABI, different code. */
export const VaultRecompiled = contract('Vault', VaultAbi, '15');
