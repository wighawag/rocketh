/**
 * Which accounts hardhat-deploy's network helpers give a network when no mnemonic is configured.
 *
 * Only the local network names (`hardhat`, `localhost`, `memory`, `test`) fall back to the PUBLIC
 * test mnemonic. A real network with neither `MNEMONIC_<network>` nor `MNEMONIC` set gets NO
 * accounts, so a deploy that needs one stops with an error naming the variable to set, instead
 * of signing with a key everyone knows. `addNetworksFromEnv` and `addNetworksFromKnownList` follow
 * the same rule; `addNetworksFromEnv` used to give every network the test mnemonic.
 *
 * The helpers read `process.env` directly, in-process, so the test owns the relevant variables:
 * every `ETH_NODE_URI*` / `MNEMONIC*` variable of the real environment is removed for the test and
 * put back afterwards, and the test asserts that the real values are back untouched.
 */

import {describe, it, expect, beforeEach, afterEach, afterAll} from 'vitest';
import {addNetworksFromEnv, addNetworksFromKnownList} from '../src/helpers.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
const OWNED = (key: string) => key.startsWith('ETH_NODE_URI') || key.startsWith('MNEMONIC');

const realEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key]) => OWNED(key)));

function clearOwnedVariables() {
	for (const key of Object.keys(process.env)) {
		if (OWNED(key)) delete process.env[key];
	}
}

beforeEach(clearOwnedVariables);

afterEach(() => {
	clearOwnedVariables();
	Object.assign(process.env, realEnvironment);
});

afterAll(() => {
	expect(Object.fromEntries(Object.entries(process.env).filter(([key]) => OWNED(key)))).toEqual(realEnvironment);
});

describe('addNetworksFromEnv', () => {
	it('gives a real network no accounts when no mnemonic is set', () => {
		process.env.ETH_NODE_URI_sepolia = 'https://sepolia.example.invalid';
		const networks = addNetworksFromEnv();
		expect(networks.sepolia).toEqual({type: 'http', url: 'https://sepolia.example.invalid', accounts: undefined});
	});

	it('uses MNEMONIC_<network>, else MNEMONIC, for a real network', () => {
		process.env.ETH_NODE_URI_sepolia = 'https://sepolia.example.invalid';
		process.env.ETH_NODE_URI_holesky = 'https://holesky.example.invalid';
		process.env.MNEMONIC_sepolia = 'sepolia words';
		process.env.MNEMONIC = 'shared words';
		const networks = addNetworksFromEnv();
		expect(networks.sepolia).toMatchObject({accounts: {mnemonic: 'sepolia words'}});
		expect(networks.holesky).toMatchObject({accounts: {mnemonic: 'shared words'}});
	});

	it('still gives the local network names the test mnemonic', () => {
		process.env.ETH_NODE_URI_localhost = 'http://127.0.0.1:8545';
		process.env.ETH_NODE_URI_test = 'http://127.0.0.1:8546';
		const networks = addNetworksFromEnv();
		expect(networks.localhost).toMatchObject({accounts: {mnemonic: TEST_MNEMONIC}});
		expect(networks.test).toMatchObject({accounts: {mnemonic: TEST_MNEMONIC}});
	});

	it('needs an explicit mnemonic for a dev node under any other name', () => {
		process.env.ETH_NODE_URI_lan = 'http://ethereum.local:8545';
		expect(addNetworksFromEnv().lan).toMatchObject({accounts: undefined});

		process.env.MNEMONIC_lan = TEST_MNEMONIC;
		expect(addNetworksFromEnv().lan).toMatchObject({accounts: {mnemonic: TEST_MNEMONIC}});
	});
});

describe('the template composition: addNetworksFromKnownList(addNetworksFromEnv(...))', () => {
	/**
	 * `addNetworksFromEnv` runs first and `addNetworksFromKnownList` leaves a network it already
	 * has alone, so this is the case that used to slip through: a known network given an
	 * `ETH_NODE_URI_<network>` but no mnemonic got the test mnemonic from the first helper.
	 */
	it('gives a known network with ETH_NODE_URI_<network> and no mnemonic no accounts', () => {
		process.env.ETH_NODE_URI_sepolia = 'https://sepolia.example.invalid';
		const networks = addNetworksFromKnownList(addNetworksFromEnv());
		expect(networks.sepolia).toMatchObject({url: 'https://sepolia.example.invalid', accounts: undefined});
	});
});
