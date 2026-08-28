/**
 * The `chainId` a fork run puts in the transaction it BROADCASTS.
 *
 * `execute` and `tx` hex-encode `env.network.chain.id` into the transaction's `chainId` field, so
 * they are the last link of the chain traced in
 * `work/notes/observations/a-fork-run-builds-transactions-declaring-chain-31337.md` and the only
 * place the consequence is visible. The rule (ADR 0014) is
 * **transactions follow the node, configuration follows the forked network**: a chain id is not
 * metadata but part of what was signed, so the only correct value is the one the node accepts.
 *
 * These assert on the SIGNED transaction rather than on `env.network.chain`, and with a
 * locally-signing (`privateKey` → `signerOnly`) account rather than a node-held one, because that
 * is the case that actually breaks: the node fills its own id for `eth_sendTransaction`, while a
 * raw transaction commits to the id in its signature and is rejected on a mismatch. `viem`'s
 * `parseTransaction` reads back what was really signed.
 *
 * The two provider shapes are measured, not assumed
 * (`work/notes/findings/fork-node-chain-identity-behaviour.md`): anvil forking mainnet reports 1,
 * hardhat reports 31337. Both runs below declare the SAME simulated network (mainnet, chain 1),
 * so the only thing that differs is what the node says, which is what makes them discriminating.
 */

import {describe, it, expect} from 'vitest';
import {parseTransaction} from 'viem';
import {tx} from '../src/index.js';
import {createTestEnvironment} from '@rocketh/test-utils';

/** anvil's account #1, as a `privateKey:` protocol string so the account signs LOCALLY. */
const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const TO = ('0x' + 'a'.repeat(40)) as `0x${string}`;

const LOCAL_RPC_URL = 'http://127.0.0.1:8545';

const chainInfo = (id: number, name: string) => ({
	id,
	name,
	nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
	rpcUrls: {default: {http: [LOCAL_RPC_URL]}},
});

/**
 * A fork of mainnet against a node reporting `nodeChainId`. The SIMULATED network is declared
 * identically in both cases (`{fork: 'mainnet', chainId: 1}`); only the node's answer moves.
 */
async function forkRun(nodeChainId: number) {
	return createTestEnvironment({
		accounts: {deployer: `privateKey:${PRIVATE_KEY}`},
		chainId: nodeChainId,
		environmentName: 'mainnet',
		executionParams: {environment: {fork: 'mainnet', chainId: 1}},
		config: {
			// the CONNECTION bucket a fork run reads, fully described so nothing unrelated warns
			chains: {31337: {rpcUrl: LOCAL_RPC_URL, info: chainInfo(31337, 'localhost')}},
		},
	});
}

/** The chain id recovered from the raw transaction the node was actually handed. */
async function broadcastChainId(nodeChainId: number): Promise<number | undefined> {
	const {env, provider} = await forkRun(nodeChainId);

	await tx(env)({account: 'deployer', to: TO, data: '0xdeadbeef'});

	const sendRaw = provider.getRequests().find((r) => r.method === 'eth_sendRawTransaction');
	expect(sendRaw).toBeDefined();
	return parseTransaction(sendRaw!.params![0] as `0x${string}`).chainId;
}

describe('@rocketh/read-execute - a fork run signs for the chain the NODE reports', () => {
	/**
	 * The anvil shape, and the bug this closes: forking mainnet, anvil reports 1. The run used to
	 * sign for 31337 (read off the local chain bucket) and the node would refuse it.
	 */
	it('declares the forked chain id when the node reports it', async () => {
		expect(await broadcastChainId(1)).toBe(1);
	});

	/**
	 * The hardhat shape, which is every hardhat-deploy user today: the engine reports 31337 while
	 * simulating mainnet. Unchanged, and the reason the SIMULATED id (1, declared identically in
	 * both runs) must never be adopted for transactions.
	 */
	it('declares the local engine id when the node reports that instead', async () => {
		expect(await broadcastChainId(31337)).toBe(31337);
	});

	/** The simulated side is still simulated: the run knows it is a fork of mainnet either way. */
	it('still names the simulated network on both', async () => {
		const anvilShaped = await forkRun(1);
		const hardhatShaped = await forkRun(31337);

		expect(anvilShaped.env.network.fork).toEqual({networkName: 'mainnet', chainId: 1});
		expect(hardhatShaped.env.network.fork).toEqual({networkName: 'mainnet', chainId: 1});
	});
});
