/**
 * Migration pair 6: a diamond deploy, and a diamond cut.
 *
 * In both versions a cut is not a separate API: you edit the facet list of the diamond script
 * and re-run it, and the diamond extension works out the cut. `07a_diamond.ts` is the script as
 * first written, `07b_diamond_with_new_facet.ts` the same script after adding a facet.
 */

import {describe, it, expect} from 'vitest';
import {decodeFunctionData, encodeFunctionData, parseAbi, toFunctionSelector} from 'viem';
import type {Abi, Deployment} from 'rocketh/types';

import {createWorld, run, runScript, sent, DEPLOYER} from './harness.js';
import diamond from './deploy/07a_diamond.js';
import diamondWithNewFacet from './deploy/07b_diamond_with_new_facet.js';
import {artifacts} from './mock-artifacts.js';

const DIAMOND_CUT = parseAbi([
	'function diamondCut((address facetAddress, uint8 action, bytes4[] functionSelectors)[] cut, address init, bytes data)',
]);

const initializeCall = encodeFunctionData({
	abi: artifacts.ERC20Facet.abi,
	functionName: 'initialize',
	args: ['Diamond Token', 'DMT'],
});

type WithFacets = Deployment<Abi> & {facets: {facetAddress: `0x${string}`; functionSelectors: `0x${string}`[]}[]};

describe('migration pair 6: a diamond deploy, and a diamond cut', () => {
	it('deploys the diamond with ERC20Facet, owned by the deployer, initialized in the constructor', async () => {
		const {env, provider} = await run(createWorld());

		await runScript(diamond, env);

		const record = env.get('Diamond') as WithFacets;
		const erc20Facet = env.get('ERC20Facet').address;
		const erc20Selectors = record.facets.find((f) => f.facetAddress === erc20Facet)?.functionSelectors;
		expect(erc20Selectors).toEqual([
			toFunctionSelector('initialize(string,string)'),
			toFunctionSelector('balanceOf(address)'),
		]);
		// the diamond's creation carries the owner and the init call
		const creation = sent(provider).find((tx) => tx.to === undefined && tx.data?.includes(initializeCall.slice(2)));
		expect(creation?.data).toContain(DEPLOYER.slice(2));
	});

	it('the script re-run with PausableFacet added: one diamondCut that ADDS its selectors, with the init call', async () => {
		const world = createWorld();
		const first = await run(world);
		await runScript(diamond, first.env);
		// what the loupe of the deployed diamond now answers
		world.chain.state.facets = (first.env.get('Diamond') as WithFacets).facets;

		const second = await run(world);
		await runScript(diamondWithNewFacet, second.env);

		const diamondAddress = second.env.get('Diamond').address.toLowerCase();
		const cuts = sent(second.provider).filter((tx) => tx.to === diamondAddress);
		expect(cuts).toHaveLength(1);
		expect(cuts[0].from).toBe(DEPLOYER);
		const {args} = decodeFunctionData({abi: DIAMOND_CUT, data: cuts[0].data!});
		const [cut, init, data] = args;
		expect(cut).toEqual([
			{
				facetAddress: second.env.get('PausableFacet').address,
				action: 0, // Add
				functionSelectors: [toFunctionSelector('pause()'), toFunctionSelector('paused()')],
			},
		]);
		expect(init).toBe(second.env.get('ERC20Facet').address);
		expect(data).toBe(initializeCall);
	});
});
