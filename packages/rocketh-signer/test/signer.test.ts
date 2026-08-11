import {describe, it, expect} from 'vitest';

import {privateKey} from '../src/index.js';

/**
 * `@rocketh/signer` is a leaf package: one exported function that resolves a
 * `privateKey:<0x...>` protocol string into an `{type:'signerOnly', signer}`
 * entry. It is depended on by the harness itself and by every test that declares a
 * private-key named account, but it has never had its own test file.
 */

const ANVIL_KEY_0 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** The checksummed address for anvil key 1 (the key used below). */
const ANVIL_ADDR_1 = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';

describe('@rocketh/signer - privateKey protocol', () => {
	it('resolves a valid private key into a signerOnly signer', async () => {
		const result = await privateKey(`privateKey:${ANVIL_KEY_0}`);

		expect(result.type).toBe('signerOnly');
		expect(result.signer).toBeDefined();
	});

	it('the resulting signer reports the expected address', async () => {
		const {signer} = await privateKey(`privateKey:${ANVIL_KEY_0}`);
		const accounts = (await signer.request({method: 'eth_accounts'})) as string[];
		expect(accounts[0].toLowerCase()).toBe(ANVIL_ADDR_1.toLowerCase());
	});

	it('throws when the private key does not start with 0x', async () => {
		await expect(
			privateKey('privateKey:59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'),
		).rejects.toThrow(/Private key must start with 0x/);
	});

	it('accepts any protocol prefix (only the key after the colon matters)', async () => {
		// The protocol part before ':' is never validated — only the key is checked.
		const result = await privateKey(`anything:${ANVIL_KEY_0}`);
		expect(result.type).toBe('signerOnly');
	});
});
