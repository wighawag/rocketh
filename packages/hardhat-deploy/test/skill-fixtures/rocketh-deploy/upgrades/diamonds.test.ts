/**
 * The fixture test of `skills/rocketh-deploy/references/diamonds.md`. It runs `deploy/03_game.ts`
 * of the `upgrades/` miniature project on the shared node, calling the script with the node's
 * environment directly (as `../../_shared/node.ts` allows), so the message the run prints can be
 * captured with the transactions it sends. It checks what the reference claims:
 *
 * - a re-run of the same facet set sends nothing;
 * - a facet that no longer produces a selector the diamond serves makes the re-run REMOVE it: the
 *   cut plan is printed with the removal first, by signature, and the cut is sent right after,
 *   from the `owner`, in the same run, with nothing waiting for an answer;
 * - `execute: {init}` rides the creation only: the later cut carries no initialization call.
 *
 * The node does not execute anything. The diamond answers `facets()` with the facets of its
 * latest record (what the chain holds once that run's cut landed) and `owner()` with `admin`.
 */

import {describe, it, expect, vi} from 'vitest';
import {decodeFunctionData, encodeAbiParameters, toFunctionSelector, zeroAddress} from 'viem';
import type {Abi, DeploymentStore} from 'rocketh/types';
import {createMapDeploymentStore} from '@rocketh/test-utils';

import {createNode, sent, NODE_HELD_ACCOUNTS} from '../../_shared/node.js';
import {config} from './rocketh/config.js';
import {artifacts} from './rocketh/deploy.js';
import game from './deploy/03_game.js';

const ADMIN = NODE_HELD_ACCOUNTS[1].toLowerCase();
const FACETS = toFunctionSelector('facets()');
const OWNER = toFunctionSelector('owner()');
const SET_PAUSED = toFunctionSelector('setPaused(bool)');
const REMOVE = 2; // FacetCutAction.Remove

const DIAMOND_CUT = [
	{
		type: 'function',
		name: 'diamondCut',
		inputs: [
			{
				type: 'tuple[]',
				name: 'cuts',
				components: [
					{name: 'facetAddress', type: 'address'},
					{name: 'action', type: 'uint8'},
					{name: 'functionSelectors', type: 'bytes4[]'},
				],
			},
			{name: 'init', type: 'address'},
			{name: 'data', type: 'bytes'},
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const satisfies Abi;

type Facet = {facetAddress: `0x${string}`; functionSelectors: `0x${string}`[]};

/** A deployment store that also keeps the facets each diamond's latest record says it serves. */
function storeWithDiamondState() {
	const store = createMapDeploymentStore();
	const facetsOf = new Map<string, Facet[]>();
	const track = (content: string) => {
		const record = JSON.parse(content) as {address?: string; facets?: Facet[]};
		if (record.address && record.facets) facetsOf.set(record.address.toLowerCase(), record.facets);
	};
	const deploymentStore: DeploymentStore = {
		...store,
		async writeFile(folder, environmentName, name, content) {
			if (name.endsWith('.json')) track(content);
			return store.writeFile(folder, environmentName, name, content);
		},
		async writeFileWithChainInfo(chainInfo, folder, environmentName, name, content) {
			if (name.endsWith('.json')) track(content);
			return store.writeFileWithChainInfo(chainInfo, folder, environmentName, name, content);
		},
	};
	return {deploymentStore, facetsOf};
}

/** One run of `03_game.ts` on a node over `deploymentStore`, capturing what it printed and when. */
async function run(deploymentStore: DeploymentStore, facetsOf: Map<string, Facet[]>) {
	const {env, provider, internal} = await createNode({
		accounts: config.accounts,
		deploymentStore,
		responses: {
			eth_call: (params?: unknown[]) => {
				const call = params?.[0] as {to?: string; data?: string};
				const selector = call.data?.slice(0, 10);
				if (selector === FACETS) {
					const facets = facetsOf.get(call.to?.toLowerCase() ?? '') ?? [];
					return encodeAbiParameters(
						[{type: 'tuple[]', components: [{type: 'address'}, {type: 'bytes4[]'}]}],
						[facets.map((f) => [f.facetAddress, f.functionSelectors] as const)],
					);
				}
				if (selector === OWNER) return encodeAbiParameters([{type: 'address'}], [ADMIN as `0x${string}`]);
				return '0x';
			},
		},
	});
	await internal.loadDeployments();
	const shown: {message: string; sentSoFar: number}[] = [];
	vi.spyOn(env, 'showMessage').mockImplementation((message: string) => {
		shown.push({message, sentSoFar: sent(provider).length});
	});
	await game(env as unknown as Parameters<typeof game>[0]);
	return {env, provider, shown};
}

describe('rocketh-deploy, diamonds: the declared facet set is what the diamond ends up with', () => {
	it('a re-run of the same facets sends nothing', async () => {
		const {deploymentStore, facetsOf} = storeWithDiamondState();
		const first = await run(deploymentStore, facetsOf);
		expect(sent(first.provider).length).toBeGreaterThan(0);

		const second = await run(deploymentStore, facetsOf);

		expect(sent(second.provider)).toEqual([]);
		expect(second.shown.filter((s) => s.message.includes('diamondCut on Game'))).toEqual([]);
	});

	it('a selector the facets no longer produce is removed: the plan prints the removal first, and the cut goes out in the same run', async () => {
		const {deploymentStore, facetsOf} = storeWithDiamondState();
		const first = await run(deploymentStore, facetsOf);
		const diamondAddress = first.env.get('Game').address.toLowerCase();

		// AdminFacet.sol lost `setPaused` and the project was recompiled; the script is unchanged
		const original = artifacts.AdminFacet;
		artifacts.AdminFacet = {
			...original,
			abi: original.abi.filter((entry) => entry.name !== 'setPaused') as unknown as typeof original.abi,
			bytecode: `${original.bytecode}b7`,
			deployedBytecode: `${original.deployedBytecode!}b7`,
		};
		try {
			const second = await run(deploymentStore, facetsOf);

			const plan = second.shown.find((s) => s.message.includes('diamondCut on Game'));
			expect(plan).toBeDefined();
			const lines = plan!.message.split('\n');
			// the removal is the first block, by signature
			expect(lines[1]).toMatch(/^ {2}REMOVING 1 function from the diamond:$/);
			expect(lines[2]).toContain('setPaused(bool)');

			// printed, then sent right away from `owner`: nothing waited for an answer in between
			const all = sent(second.provider);
			const isCut = (tx: (typeof all)[number]) => tx.data?.startsWith(toFunctionSelector(DIAMOND_CUT[0]));
			const cuts = all.filter(isCut);
			expect(cuts).toHaveLength(1);
			expect(cuts[0]).toMatchObject({from: ADMIN, to: diamondAddress});
			expect(all.findIndex(isCut)).toBeGreaterThanOrEqual(plan!.sentSoFar);

			const {args} = decodeFunctionData({abi: DIAMOND_CUT, data: cuts[0].data!});
			const [facetCuts, init, data] = args;
			expect(facetCuts).toContainEqual({facetAddress: zeroAddress, action: REMOVE, functionSelectors: [SET_PAUSED]});
			// `init` rode the creation only: this cut calls nothing
			expect(init).toBe(zeroAddress);
			expect(data).toBe('0x');
		} finally {
			artifacts.AdminFacet = original;
		}
	});
});
