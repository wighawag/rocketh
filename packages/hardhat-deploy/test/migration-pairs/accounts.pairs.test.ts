/**
 * Migration pair 9: a per-network named-account map, including a `null` entry.
 *
 * The v1 half is `hardhat.config.v1.ts` (its `namedAccounts`), the rocketh half is the
 * `accounts` of `rocketh/config.ts`, the config every other pair runs with. The values carry over
 * unchanged; what this pins is that they RESOLVE as they did in v1, network by network.
 */

import {describe, it, expect} from 'vitest';

import {createWorld, run, DEPLOYER, FAUCET_OWNER, TOKEN_OWNER} from './harness.js';

describe('migration pair 9: per-network named accounts, and `null`', () => {
	it('by default: every name is its index into the node\u2019s accounts', async () => {
		const {env} = await run(createWorld());

		expect(lowercased(env.namedAccounts)).toEqual({
			deployer: DEPLOYER,
			tokenOwner: TOKEN_OWNER,
			faucetOwner: FAUCET_OWNER,
		});
	});

	it('on sepolia: `tokenOwner` is the address the sepolia entry names', async () => {
		const {env} = await run(createWorld(), {environmentName: 'sepolia', chainId: 11155111});

		expect(env.namedAccounts.tokenOwner).toBe('0x5B38Da6a701c568545dCfcB03FcB875f56beddC4');
		expect(env.namedAccounts.deployer.toLowerCase()).toBe(DEPLOYER);
	});

	it('on mainnet: `faucetOwner` is ABSENT, as v1\u2019s `null` made it, and the run starts', async () => {
		const {env} = await run(createWorld(), {environmentName: 'mainnet', chainId: 1});

		expect('faucetOwner' in env.namedAccounts).toBe(false);
		expect(env.namedAccounts.faucetOwner).toBeUndefined();
		expect(env.namedAccounts.deployer.toLowerCase()).toBe(DEPLOYER);
	});
});

function lowercased(accounts: Record<string, string | undefined>) {
	return Object.fromEntries(Object.entries(accounts).map(([name, address]) => [name, address?.toLowerCase()]));
}
