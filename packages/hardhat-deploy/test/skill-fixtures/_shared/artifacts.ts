/**
 * SHARED by every skill's fixtures: the compiled contracts of the miniature projects, standing
 * in for what a real project's `generated/artifacts` holds after `hardhat compile`. A fixture's
 * `rocketh/deploy.ts` re-exports them where a real project re-exports its generated artifacts.
 *
 * They are MOCKS: the ABIs are the real shape a script is typed against, the bytecode is a
 * placeholder the mock node never executes. Each contract gets its own bytecode marker, so two
 * contracts never share a create2 address and a "recompiled" contract is really different.
 *
 * `artifacts` is deliberately a plain mutable object, as a module namespace would be to the
 * scripts that read it: a test can swap one entry to model "the source changed and the project
 * was recompiled", then re-run the unchanged script.
 *
 * A skill that needs a contract this file lacks adds it here, in the smallest change.
 */

import type {Abi, Artifact} from 'rocketh/types';
import {createMockArtifact} from '@rocketh/test-utils';

function contract<const TAbi extends Abi>(name: string, abi: TAbi, marker: string): Artifact<TAbi> {
	const base = createMockArtifact(name, abi);
	return {
		...base,
		bytecode: `${base.bytecode}${marker}` as `0x${string}`,
		deployedBytecode: `${base.deployedBytecode}${marker}` as `0x${string}`,
	};
}

/** An owned contract holding one value only its owner may set: the smallest privileged change. */
const RegistryAbi = [
	{type: 'constructor', inputs: [{type: 'address', name: 'owner'}], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'owner',
		inputs: [],
		outputs: [{type: 'address'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'value',
		inputs: [],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'setValue',
		inputs: [{type: 'uint256', name: 'newValue'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

/** A token with a fixed supply minted to an owner. */
const TokenAbi = [
	{
		type: 'constructor',
		inputs: [
			{type: 'address', name: 'owner'},
			{type: 'uint256', name: 'supply'},
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

export const artifacts = {
	Registry: contract('Registry', RegistryAbi, 'a1'),
	Token: contract('Token', TokenAbi, 'a2'),
};
