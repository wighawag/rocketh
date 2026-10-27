import {describe, it, expect} from 'vitest';
import {createTestEnvironment} from '@rocketh/test-utils';

/**
 * The shape of `UnresolvableAccountsError` (exported by `rocketh`), restated because this package
 * does not depend on `rocketh` itself: the harness builds the real environment that raises it.
 */
type UnresolvableAccountsError = Error & {
	data: {
		environment: string;
		chainId: string;
		nodeAccountCount?: number;
		accounts: {name: string; reason: string; definition: string; index?: number}[];
	};
};

/**
 * What a run reports when it cannot resolve its named accounts, which is the first thing that
 * happens before any deploy script runs.
 *
 * The commonest case by far: a deploy to a REAL network where no keys were configured. A named
 * account given by INDEX (`deployer: 0`) means "the node's own account number 0", and a node that
 * holds no keys (most public RPC endpoints) answers `eth_accounts` with an empty list, so there is
 * nothing at that index. The error is an `UnresolvableAccountsError` that:
 *
 * - says WHERE: the environment and the chain id (and, when rocketh opened the connection itself
 *   from an `rpcUrl`, the endpoint, redacted);
 * - names EVERY account that cannot be resolved, not just the first;
 * - gives the fix. Its default wording is for the `rocketh` CLI, where the fix is in the `accounts`
 *   of `rocketh/config.ts`. hardhat-deploy rewords it from `error.data` for a hardhat project,
 *   where the accounts at an index come from the hardhat network's `accounts`.
 *
 * None of it ever prints key material from the config.
 */

const SEPOLIA = 11155111;
const OTHER_NETWORK_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const NODE_ACCOUNT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' as `0x${string}`;

async function environmentError(
	options: Parameters<typeof createTestEnvironment>[0],
): Promise<UnresolvableAccountsError> {
	try {
		await createTestEnvironment(options);
	} catch (error) {
		expect(error).toMatchObject({name: 'UnresolvableAccountsError'});
		return error as UnresolvableAccountsError;
	}
	throw new Error('expected the environment to refuse its named accounts');
}

describe('named accounts that cannot be resolved', () => {
	it('reports a deploy to a network with no keys configured, naming where and how to fix it', async () => {
		/**
		 * Example: `deployer: 0` on sepolia, against a public endpoint that holds no keys.
		 */
		const error = await environmentError({
			accounts: {deployer: 0},
			nodeAccounts: [],
			chainId: SEPOLIA,
			environmentName: 'sepolia',
		});

		expect(error.message).toBe(
			[
				`cannot resolve the named account "deployer" for environment "sepolia" (chain ${SEPOLIA}):`,
				`  - "deployer" is configured as index 0, but the node lists no accounts.`,
				`An account given by index is one of the node's own accounts, and this node holds none: nodes without keys (most public RPC endpoints) answer 'eth_accounts' with an empty list.`,
				`To fix it, in the \`accounts\` of your rocketh config (rocketh/config.ts), give "deployer" a signer protocol or an address for "sepolia". Read any key from the environment rather than writing it in the file, for example:`,
				'    deployer: {default: 0, sepolia: `privateKey:${process.env.DEPLOYER_PRIVATE_KEY}`},',
				`The 'privateKey' protocol is registered with \`signerProtocols: {privateKey}\` (from @rocketh/signer). Or point "sepolia" at a node that holds the keys.`,
			].join('\n'),
		);
		// The same facts, structured, for an entry point that words its own fix.
		expect(error.data).toMatchObject({
			environment: 'sepolia',
			chainId: String(SEPOLIA),
			nodeAccountCount: 0,
			accounts: [{name: 'deployer', reason: 'node-has-no-accounts', definition: 'index 0', index: 0}],
		});
	});

	it('reports every account that cannot be resolved in one error, not one per run', async () => {
		/**
		 * Example: `deployer: 0` and `admin: {default: 1}`. Fixing the first must not be how the
		 * user discovers the second.
		 */
		const error = await environmentError({
			accounts: {deployer: 0, admin: {default: 1}},
			nodeAccounts: [],
			chainId: SEPOLIA,
			environmentName: 'sepolia',
		});

		expect(error.message).toMatch(/^cannot resolve 2 named accounts \("deployer", "admin"\) for environment "sepolia"/);
		expect(error.message).toContain(`  - "deployer" is configured as index 0, but the node lists no accounts.`);
		expect(error.message).toContain(`  - "admin" is configured as index 1, but the node lists no accounts.`);
		expect(error.message).toContain('give each of these accounts a signer protocol or an address for "sepolia"');
		expect(error.data.accounts.map((account) => account.name)).toEqual(['deployer', 'admin']);
	});

	it('reports an index beyond what the node lists, saying how many it does', async () => {
		/**
		 * Example: a local node with ONE account, and `admin: 3`. The node has keys, just not that
		 * many, so the fix also offers a lower index.
		 */
		const error = await environmentError({
			accounts: {deployer: 0, admin: 3},
			nodeAccounts: [NODE_ACCOUNT],
			environmentName: 'localhost',
		});

		expect(error.data.accounts).toEqual([
			{name: 'admin', reason: 'index-beyond-node-accounts', definition: 'index 3', index: 3},
		]);
		expect(error.message).toContain(`  - "admin" is configured as index 3, but the node lists 1 account (index 0).`);
		expect(error.message).toContain('a signer protocol or an address for "localhost" (or an index below 1)');
		expect(error.message).not.toContain('holds none');
	});

	it("says that 'eth_accounts' failed, and keeps the failure as the cause", async () => {
		const failure = new Error('eth_accounts is not available on this endpoint');
		const error = await environmentError({
			accounts: {deployer: 0},
			providerConfig: {
				responses: {
					eth_accounts: () => {
						throw failure;
					},
				},
			},
		});

		expect(error.message).toContain(
			`"deployer" is configured as index 0, which needs the node to list its accounts, but 'eth_accounts' failed: eth_accounts is not available on this endpoint`,
		);
		expect(error.cause).toBe(failure);
		expect(error.data.nodeAccountCount).toBeUndefined();
	});

	it('reports the other ways an account can fail alongside, each with its own fix', async () => {
		const error = await environmentError({
			accounts: {
				deployer: 0,
				owner: 'nosuchname',
				signer: 'ledger:0',
				treasury: {mainnet: '0x' + '1'.repeat(40)},
			},
			nodeAccounts: [],
			chainId: SEPOLIA,
			environmentName: 'sepolia',
		});

		expect(error.data.accounts.map(({name, reason}) => [name, reason])).toEqual([
			['deployer', 'node-has-no-accounts'],
			['owner', 'unknown-reference'],
			['signer', 'unknown-signer-protocol'],
			['treasury', 'no-value-for-environment'],
		]);
		expect(error.message).toContain(
			`  - "owner" is configured as "nosuchname", which is not an address, a private key, a signer protocol ('<protocol>:...') or the name of another account in \`accounts\`.`,
		);
		expect(error.message).toContain(
			`  - "signer" is configured as "ledger:<redacted>", but no signer protocol "ledger" is registered in \`signerProtocols\` (registered: "privateKey").`,
		);
		expect(error.message).toContain(
			`  - "treasury" is configured as {mainnet: "0x1111111111111111111111111111111111111111"}, which gives nothing for this environment: no entry for "sepolia" (or chain ${SEPOLIA}) and no \`default\`.`,
		);
	});

	it('never prints a key from the config', async () => {
		/**
		 * Keys configured for ANOTHER network sit in the same definitions as the index that fails;
		 * none of them may reach the message, which ends up in terminals and CI logs.
		 */
		const error = await environmentError({
			accounts: {
				deployer: {default: 0, mainnet: `privateKey:${OTHER_NETWORK_KEY}`},
				admin: {mainnet: OTHER_NETWORK_KEY},
				pasted: OTHER_NETWORK_KEY.slice(2),
			},
			nodeAccounts: [],
			chainId: SEPOLIA,
			environmentName: 'sepolia',
		});

		expect(error.data.accounts.map((account) => account.name)).toEqual(['deployer', 'admin', 'pasted']);
		const everything = error.message + JSON.stringify(error.data);
		expect(everything).not.toContain(OTHER_NETWORK_KEY.slice(2));
		expect(everything).not.toMatch(/[0-9a-fA-F]{41}/);
		expect(error.message).toContain('"admin" is configured as {mainnet: <redacted>}');
		expect(error.message).toContain('"pasted" is configured as <redacted>');
	});
});
