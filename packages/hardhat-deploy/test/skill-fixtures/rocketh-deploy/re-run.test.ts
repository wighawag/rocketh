/**
 * The rocketh-deploy skill's fixture test. It runs the fixture's deploy scripts through rocketh's
 * real executor (`../_shared/executor.ts`) on the shared node, twice, with the same deployment
 * store, and checks what `SKILL.md` claims:
 *
 * - the first run deploys, executes the guarded call and the run-once transfer, and records the id;
 * - the run-once transfer goes to the address `get('Token')` returns, to the named `treasury`;
 * - a re-run of the same scripts SENDS NOTHING: `deploy` finds the records, the guard reads the
 *   value already set, and the run-once script is skipped as a whole.
 */

import {describe, it, expect} from 'vitest';
import {decodeFunctionData, encodeAbiParameters, encodeFunctionData} from 'viem';
import {createMapDeploymentStore} from '@rocketh/test-utils';

import {createNode, sent, NODE_HELD_ACCOUNTS} from '../_shared/node.js';
import {executeScripts} from '../_shared/executor.js';
import {config, extensions} from './rocketh/config.js';
import {artifacts} from './rocketh/deploy.js';
import token from './deploy/01_token.js';
import registry from './deploy/02_registry.js';
import fundTreasury from './deploy/03_fund_treasury.js';

const scripts = {'01_token.ts': token, '02_registry.ts': registry, '03_fund_treasury.ts': fundTreasury};
const DEPLOYER = NODE_HELD_ACCOUNTS[0].toLowerCase();
const TREASURY = NODE_HELD_ACCOUNTS[1].toLowerCase();
const SET_VALUE = encodeFunctionData({abi: artifacts.Registry.abi, functionName: 'setValue', args: [42n]});
const VALUE = encodeFunctionData({abi: artifacts.Registry.abi, functionName: 'value'});

/** A node whose Registry answers `value()` with what the last `setValue` sent to it set, 0 before. */
async function nodeWithRegistryState() {
	const node = await createNode({accounts: config.accounts});
	node.provider.setResponse('eth_call', (params?: unknown[]) => {
		const call = params?.[0] as {data?: string};
		if (call?.data !== VALUE) return '0x';
		const set = sent(node.provider).filter((tx) => tx.data === SET_VALUE).length > 0;
		return encodeAbiParameters([{type: 'uint256'}], [set ? 42n : 0n]);
	});
	return node;
}

describe('rocketh-deploy: a re-run converges and sends nothing', () => {
	it('the first run sends everything once; the re-run of the same scripts sends nothing', async () => {
		const {provider} = await nodeWithRegistryState();
		const deploymentStore = createMapDeploymentStore();

		const first = await executeScripts({config, extensions, scripts, provider, deploymentStore});

		const tokenAddress = first.get('Token').address.toLowerCase();
		const registryAddress = first.get('Registry').address.toLowerCase();
		const transfer = sent(provider).find((tx) => tx.to === tokenAddress);
		expect(sent(provider)).toEqual([
			expect.objectContaining({from: DEPLOYER, to: undefined}), // Token
			expect.objectContaining({from: DEPLOYER, to: undefined}), // Registry
			{from: DEPLOYER, to: registryAddress, data: SET_VALUE}, // the guarded call, still needed
			expect.objectContaining({from: DEPLOYER, to: tokenAddress}), // the run-once transfer
		]);
		// the transfer's token is the recorded one, its recipient the named account
		expect(decodeFunctionData({abi: artifacts.Token.abi, data: transfer!.data!})).toEqual({
			functionName: 'transfer',
			args: [expect.stringMatching(new RegExp(`^${TREASURY}$`, 'i')), 100_000n],
		});
		expect(first.hasMigrationBeenDone('fund_treasury')).toBe(true);

		const sentBefore = sent(provider).length;
		const second = await executeScripts({config, extensions, scripts, provider, deploymentStore});

		expect(sent(provider).length).toBe(sentBefore);
		expect(second.get('Token').address.toLowerCase()).toBe(tokenAddress);
		expect(second.get('Registry').address.toLowerCase()).toBe(registryAddress);
	});

	it('the guard reads the chain, not a record: while the value is unset, the re-run sends the call again', async () => {
		// the same scripts against a node whose Registry still reads 0 after the first run: the re-run
		// sends `setValue` again, and nothing else (the records and the run-once id still hold)
		const {provider} = await createNode({
			accounts: config.accounts,
			responses: {eth_call: () => encodeAbiParameters([{type: 'uint256'}], [0n])},
		});
		const deploymentStore = createMapDeploymentStore();
		await executeScripts({config, extensions, scripts, provider, deploymentStore});
		const sentBefore = sent(provider).length;

		const second = await executeScripts({config, extensions, scripts, provider, deploymentStore});

		expect(sent(provider).slice(sentBefore)).toEqual([
			{from: DEPLOYER, to: second.get('Registry').address.toLowerCase(), data: SET_VALUE},
		]);
	});
});
