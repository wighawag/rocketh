/**
 * Integration tests for @rocketh/diamond - default-facet handling and options hygiene.
 *
 * Three defects found while reviewing the package, each about the SAME class of mistake:
 * a condition or a value that is nearly right.
 *
 * 1. The default facets are installed when their flag is `undefined` (omitted) or truthy,
 *    but the ERC-165 interface list read those flags for PLAIN TRUTHINESS. Under the
 *    default config, both facets were installed and NEITHER interface was advertised, so
 *    `supportsInterface` lied about a diamond nobody had configured unusually.
 * 2. The default facets were appended to the CALLER's `options.facets` array. Reusing one
 *    options object across two `diamond(...)` calls appended them twice.
 * 3. `executeData` is the string '0x' when no `execute` is set, and that is truthy, so a
 *    diamond with no `execute` could be told "execute is set in option".
 *
 * These tests read the diamond's CONSTRUCTOR ARGUMENTS back out of the saved deployment
 * record, because the harness's provider does not model chain state: what the deploy
 * ENCODED is the observable, not what a `supportsInterface` call would answer.
 */

import {describe, it, expect} from 'vitest';
import {decodeAbiParameters, decodeFunctionData} from 'viem';
import {diamond} from '../src/index.js';
import artifactPureDiamond from '../src/hardhat-deploy-v1-artifacts/Diamond.js';
import artifactDiamondERC165Init from '../src/hardhat-deploy-v1-artifacts/DiamondERC165Init.js';
import {
	createTestEnvironment,
	createExampleArtifact,
	STANDARD_NAMED_ACCOUNTS,
	NODE_HELD_ACCOUNTS,
} from '@rocketh/test-utils';
import type {Abi} from 'abitype';
import type {DiamondFacets} from '../src/types.js';

/** ERC-165 interface ids the diamond advertises, from `index.ts`'s `interfaceList`. */
const LOUPE_INTERFACE_ID = '0x48e2b093';
const CUT_INTERFACE_ID = '0x1f931c1c';
const OWNERSHIP_INTERFACE_ID = '0x7f5828d0';

/** The function names of a merged diamond ABI, without reaching for `any`. */
function abiFunctionNames(abi: Abi): string[] {
	return abi.filter((entry) => entry.type === 'function').map((entry) => entry.name);
}

async function setup() {
	const {env} = await createTestEnvironment({
		accounts: STANDARD_NAMED_ACCOUNTS,
		nodeAccounts: NODE_HELD_ACCOUNTS,
	});
	return {env};
}

/**
 * The interface ids the deployed diamond was constructed to advertise.
 *
 * Decodes the saved `argsData` against the bundled Diamond's constructor
 * `(address, FacetCut[], Initialization[])`, then decodes the `setERC165` call the
 * deployer put in the initializations list.
 */
function advertisedInterfaceIds(argsData: `0x${string}`): readonly string[] {
	const constructorFragment = artifactPureDiamond.abi.find((f) => f.type === 'constructor');
	if (!constructorFragment) {
		throw new Error('bundled Diamond artifact has no constructor');
	}
	const decodedArgs = decodeAbiParameters(constructorFragment.inputs, argsData);
	const initializations = decodedArgs[2] as readonly {initContract: `0x${string}`; initData: `0x${string}`}[];

	for (const initialization of initializations) {
		const decodedCall = decodeFunctionData({
			abi: artifactDiamondERC165Init.abi,
			data: initialization.initData,
		});
		if (decodedCall.functionName === 'setERC165') {
			return (decodedCall.args as readonly (readonly string[])[])[0];
		}
	}
	throw new Error('no setERC165 initialization found in the diamond constructor args');
}

describe('@rocketh/diamond - default facets and options hygiene', () => {
	describe('ERC-165 advertisement follows facet installation', () => {
		it('advertises cut and ownership when their options are omitted (the default)', async () => {
			const {env} = await setup();

			const result = await diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}]},
			);

			// Both default facets ARE installed under the default config...
			const functionNames = abiFunctionNames(result.abi);
			expect(functionNames).toContain('diamondCut');
			expect(functionNames).toContain('owner');

			// ...so both interfaces must be advertised. Before the fix this was the loupe id alone.
			const interfaceIds = advertisedInterfaceIds(result.argsData as `0x${string}`);
			expect(interfaceIds).toEqual([LOUPE_INTERFACE_ID, CUT_INTERFACE_ID, OWNERSHIP_INTERFACE_ID]);
		});

		it('does not advertise an interface whose facet was explicitly declined', async () => {
			const {env} = await setup();

			const result = await diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}],
					defaultCutFacet: false,
					defaultOwnershipFacet: false,
				},
			);

			const interfaceIds = advertisedInterfaceIds(result.argsData as `0x${string}`);
			expect(interfaceIds).toEqual([LOUPE_INTERFACE_ID]);
		});

		it('advertises only the interface of the facet that was kept', async () => {
			const {env} = await setup();

			const result = await diamond(env)(
				'MyDiamond',
				{account: 'deployer'},
				{
					facets: [{artifact: createExampleArtifact('MyFacet', 0), args: []}],
					defaultOwnershipFacet: false,
				},
			);

			const interfaceIds = advertisedInterfaceIds(result.argsData as `0x${string}`);
			expect(interfaceIds).toEqual([LOUPE_INTERFACE_ID, CUT_INTERFACE_ID]);
		});
	});

	describe('the caller options object is not mutated', () => {
		it('leaves options.facets untouched and stays reusable across deployments', async () => {
			const {env} = await setup();

			const facets: DiamondFacets = [{artifact: createExampleArtifact('MyFacet', 0), args: []}];
			const options = {facets};

			await diamond(env)('FirstDiamond', {account: 'deployer'}, options);

			// The three default facets went into a COPY, not into what the caller passed.
			expect(options.facets).toHaveLength(1);

			// And so the very same options object still describes ONE facet on reuse. With the
			//  defaults appended twice, the same selector lands twice in one Add cut.
			await expect(diamond(env)('SecondDiamond', {account: 'deployer'}, options)).resolves.toBeDefined();
			expect(options.facets).toHaveLength(1);
		});
	});
});
