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

/**
 * A contract written to sit behind a proxy: no constructor, an initializer the first deployment
 * calls through the proxy, and a migration step an upgrade calls. `CounterV1` and `CounterV2` are
 * two versions of the same source, kept side by side as an upgrade story keeps them.
 */
const ProxiedAbi = [
	{
		type: 'function',
		name: 'init',
		inputs: [{type: 'address', name: 'manager'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{type: 'function', name: 'postUpgrade', inputs: [], outputs: [], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'manager',
		inputs: [],
		outputs: [{type: 'address'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/** A diamond facet holding a counter. */
const CounterFacetAbi = [
	{type: 'function', name: 'increment', inputs: [], outputs: [], stateMutability: 'nonpayable'},
	{
		type: 'function',
		name: 'count',
		inputs: [],
		outputs: [{type: 'uint256'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

/** A diamond facet holding the admin switches, with the initializer the first cut calls. */
const AdminFacetAbi = [
	{
		type: 'function',
		name: 'initialize',
		inputs: [{type: 'address', name: 'manager'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'setPaused',
		inputs: [{type: 'bool', name: 'paused'}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'paused',
		inputs: [],
		outputs: [{type: 'bool'}],
		stateMutability: 'view',
	},
] as const satisfies Abi;

export const artifacts = {
	Registry: contract('Registry', RegistryAbi, 'a1'),
	Token: contract('Token', TokenAbi, 'a2'),
	Vault: contract('Vault', ProxiedAbi, 'a3'),
	CounterV1: contract('CounterV1', ProxiedAbi, 'a4'),
	CounterV2: contract('CounterV2', ProxiedAbi, 'a5'),
	CounterFacet: contract('CounterFacet', CounterFacetAbi, 'a6'),
	AdminFacet: contract('AdminFacet', AdminFacetAbi, 'a7'),
};
