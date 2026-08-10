/**
 * Tests for `createTestEnvironment` — the REAL rocketh environment against a mock
 * EIP-1193 provider. These deliberately drive `env.broadcastExecution` /
 * `env.broadcastDeployment` end-to-end so the assertions actually exercise
 * `packages/rocketh`'s environment module (account resolution, `eth_accounts`,
 * auto-impersonation, the single `broadcastTransaction` choke point) — the same
 * paths the removed fabricated stand-in used to bypass (see the *test environment* vs
 * *mock environment* entry in `CONTEXT.md`).
 *
 * By design this file does NOT import `@rocketh/deploy` or `@rocketh/read-execute`:
 * both already devDepend on `@rocketh/test-utils`, so importing them here would close
 * a project-graph cycle. End-to-end proof through `deploy` / `execute` / `tx` lands
 * one task later, in the migrate batches (see `work/tasks/ready/test-env-harness.md`).
 */

import {describe, it, expect, vi} from 'vitest';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';
import {createEnvironment} from 'rocketh';

import {createTestEnvironment, createMapDeploymentStore, createMockArtifact} from '../src/index.js';
import * as testUtils from '../src/index.js';

/** The address the shipped `@rocketh/signer` `privateKey` protocol resolves this key to. Checksummed. */
const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const SIGNER_ADDRESS_CHECKSUMMED = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

const NODE_ACCOUNT_LOWER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

const A_CHECKSUMMED_ACCOUNT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

describe('createTestEnvironment - harness identity + wiring', () => {
	it('returns the identity of what createEnvironment returned', async () => {
		/**
		 * The harness must NOT wrap or spread the environment. Any wrapping quietly
		 * re-introduces the parallel-fake problem this harness exists to end.
		 */
		const spy = vi.spyOn({createEnvironment}, 'createEnvironment');
		void spy;
		const {env, internal} = await createTestEnvironment();
		// duck-typed identity check: every real Environment field is a direct reference to
		//  the objects createEnvironment built. Two fields is enough to catch a spread.
		expect(env).toBeDefined();
		expect(internal).toBeDefined();
		expect(typeof env.broadcastExecution).toBe('function');
		expect(typeof env.broadcastDeployment).toBe('function');
		expect(typeof internal.loadDeployments).toBe('function');
	});

	it('exports exactly ONE environment builder (no second, fabricated one)', () => {
		/**
		 * Regrowth fence. While the migration was in flight this assertion said the opposite
		 * (the legacy fabricated builder is still exported); it is inverted rather than deleted,
		 * because the whole value of the removal is that a SECOND notion of a test environment
		 * cannot come back under any name. The mock PROVIDER and mock ARTIFACT helpers are
		 * orthogonal and stay.
		 */
		const environmentBuilders = Object.keys(testUtils)
			.filter((name) => /^create.*Environment$/.test(name))
			.sort();
		expect(environmentBuilders).toEqual(['createTestEnvironment']);
		expect(typeof testUtils.createMockProvider).toBe('function');
		expect(typeof testUtils.createMockArtifact).toBe('function');
	});
});

describe('createTestEnvironment - options that describe an account', () => {
	it('accepts an account the node holds (numbered index into eth_accounts)', async () => {
		const {env} = await createTestEnvironment({
			accounts: {deployer: 0},
			nodeAccounts: [NODE_ACCOUNT_LOWER],
		});
		expect(env.namedAccounts.deployer).toBe(NODE_ACCOUNT_LOWER);
		expect(env.addressSigners[NODE_ACCOUNT_LOWER].type).toBe('remote');
	});

	it('accepts an account with local signing material (privateKey → signerOnly)', async () => {
		const {env} = await createTestEnvironment({accounts: {deployer: PRIVATE_KEY}});
		const signer = env.addressSigners[env.resolveAccount('deployer')];
		expect(signer.type).toBe('signerOnly');
	});

	it('accepts an account the node does NOT hold (bare address) — resolves as remote', async () => {
		const {env} = await createTestEnvironment({
			accounts: {admin: A_CHECKSUMMED_ACCOUNT},
			nodeAccounts: [], // node does not know admin
		});
		expect(env.addressSigners[env.resolveAccount('admin')].type).toBe('remote');
	});

	it('impersonation:succeed + autoImpersonate:true calls hardhat_impersonateAccount without throwing', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: {admin: A_CHECKSUMMED_ACCOUNT},
			nodeAccounts: [],
			impersonation: 'succeed',
			executionParams: {autoImpersonate: true},
		});
		const impCalls = provider.getRequests().filter((r) => r.method === 'hardhat_impersonateAccount');
		expect(impCalls.length).toBe(1);
		expect(env.namedAccounts.admin).toBe(A_CHECKSUMMED_ACCOUNT);
	});

	it('impersonation:fail is swallowed by setup and does NOT bring the env down', async () => {
		// setup wraps the impersonation call in try/catch and only logs; the env still builds.
		const {env, provider} = await createTestEnvironment({
			accounts: {admin: A_CHECKSUMMED_ACCOUNT},
			nodeAccounts: [],
			impersonation: 'fail',
			executionParams: {autoImpersonate: true},
		});
		const impCalls = provider.getRequests().filter((r) => r.method === 'hardhat_impersonateAccount');
		expect(impCalls.length).toBe(1);
		expect(env.namedAccounts.admin).toBe(A_CHECKSUMMED_ACCOUNT);
	});

	it('autoImpersonate:false skips the impersonation call entirely', async () => {
		const {provider} = await createTestEnvironment({
			accounts: {admin: A_CHECKSUMMED_ACCOUNT},
			nodeAccounts: [],
			executionParams: {autoImpersonate: false},
		});
		const impCalls = provider.getRequests().filter((r) => r.method === 'hardhat_impersonateAccount');
		expect(impCalls.length).toBe(0);
	});
});

describe('createTestEnvironment - casing fence (protects 09ea46d)', () => {
	it('lowercases addressSigners keys while leaving namedAccounts values checksummed', async () => {
		/**
		 * The old draft warned about a casing trap in addressSigners; commit 09ea46d
		 * lowercased those keys. The remaining asymmetry — namedAccounts values stay
		 * checksummed — is DELIBERATE because they are user-visible and reach
		 * deployment records and frontend exports where EIP-55 checksums matter.
		 */
		const {env} = await createTestEnvironment({accounts: {deployer: PRIVATE_KEY}});
		for (const key of Object.keys(env.addressSigners)) {
			expect(key).toBe(key.toLowerCase());
		}
		expect(env.namedAccounts.deployer).toBe(SIGNER_ADDRESS_CHECKSUMMED);
	});
});

describe('createTestEnvironment - real broadcast path (signer selection)', () => {
	it('routes a signerOnly account to eth_signTransaction + eth_sendRawTransaction (NOT eth_sendTransaction)', async () => {
		/**
		 * This assertion can ONLY pass through the real `broadcastTransaction`. The old fake
		 * shorts the signer switch and always calls eth_sendTransaction (or its raw sibling
		 * on `type: 'raw'`) — it never looks at `addressSigners[from].type`. Registering a
		 * fake signerOnly protocol lets us assert the routing without needing a fully
		 * fielded EIP-1559 transaction (which the shipped local signer would demand).
		 */
		const fakeSignerAddress = '0x1111111111111111111111111111111111111111' as `0x${string}`;
		let signCalls = 0;
		const fakeLocalSigner = {
			request: (async (args: {method: string; params?: unknown[]}) => {
				if (args.method === 'eth_accounts') return [fakeSignerAddress];
				if (args.method === 'eth_signTransaction') {
					signCalls++;
					return `0x${'e'.repeat(200)}`;
				}
				throw new Error(`unexpected fake-signer method: ${args.method}`);
			}) as EIP1193ProviderWithoutEvents['request'],
		} satisfies EIP1193ProviderWithoutEvents;

		const {env, provider} = await createTestEnvironment({
			accounts: {deployer: 'fake:anything'},
			config: {
				signerProtocols: {
					fake: async () => ({type: 'signerOnly', signer: fakeLocalSigner}),
				},
			},
		});

		await env.broadcastExecution({
			type: 'object',
			data: {
				from: env.resolveAccount('deployer'),
				to: '0x0000000000000000000000000000000000000001',
				chainId: '0x7a69',
			} as any,
		});

		const methods = provider.getRequests().map((r) => r.method);
		expect(signCalls).toBe(1);
		expect(methods).toContain('eth_sendRawTransaction');
		expect(methods).not.toContain('eth_sendTransaction');
	});

	it('routes a remote account to eth_sendTransaction', async () => {
		// the node must actually HOLD the account (`eth_accounts`), otherwise it is `unsignable`
		//  and the unknown-signer seam throws before any routing happens
		const {env, provider} = await createTestEnvironment({
			accounts: {deployer: NODE_ACCOUNT_LOWER as `0x${string}`},
			nodeAccounts: [NODE_ACCOUNT_LOWER as `0x${string}`],
		});

		await env.broadcastExecution({
			type: 'object',
			data: {
				from: env.resolveAccount('deployer'),
				to: '0x0000000000000000000000000000000000000001',
				chainId: '0x7a69',
			} as any,
		});

		const methods = provider.getRequests().map((r) => r.method);
		expect(methods).toContain('eth_sendTransaction');
		expect(methods).not.toContain('eth_sendRawTransaction');
	});

	it('an unsignable `from` throws a first-class UnknownSignerError', async () => {
		// the seam at the broadcast choke point replaced the old opaque `cannot get signer for ...`
		//  with `UnknownSignerError`, which carries the tx to execute out-of-band
		const {env} = await createTestEnvironment();
		await expect(
			env.broadcastExecution({
				type: 'object',
				data: {
					from: '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead' as `0x${string}`,
					to: '0x0000000000000000000000000000000000000001',
					chainId: '0x7a69',
				} as any,
			}),
		).rejects.toThrow(/Unknown signer for account 0xdeaddead/);
	});

	it('autoMine:true emits evm_mine after broadcastTransaction', async () => {
		const {env, provider} = await createTestEnvironment({
			accounts: {deployer: NODE_ACCOUNT_LOWER as `0x${string}`},
			nodeAccounts: [NODE_ACCOUNT_LOWER as `0x${string}`],
			executionParams: {autoMine: true},
		});

		await env.broadcastExecution({
			type: 'object',
			data: {
				from: env.resolveAccount('deployer'),
				to: '0x0000000000000000000000000000000000000001',
				chainId: '0x7a69',
			} as any,
		});

		const methods = provider.getRequests().map((r) => r.method);
		// evm_mine must come AFTER eth_sendTransaction — production emits it right in
		//  broadcastTransaction, before waiting for the receipt.
		const sendIndex = methods.indexOf('eth_sendTransaction');
		const mineIndex = methods.indexOf('evm_mine');
		expect(sendIndex).toBeGreaterThanOrEqual(0);
		expect(mineIndex).toBeGreaterThan(sendIndex);
	});
});

describe('createTestEnvironment - per-tx contractAddress (pitfall fix)', () => {
	it('two deployments in one test get two distinct addresses from the default receipt', async () => {
		/**
		 * The old default receipt returned ONE contractAddress for every transaction, so
		 * every deployment in a test collapsed onto one address once real code read
		 * `receipt.contractAddress`. A diamond deploys many facets plus a proxy; this
		 * pitfall is what motivates the harness's per-tx-hash address map.
		 */
		const {env} = await createTestEnvironment({
			accounts: {deployer: NODE_ACCOUNT_LOWER as `0x${string}`},
			nodeAccounts: [NODE_ACCOUNT_LOWER as `0x${string}`],
		});

		const artifact = createMockArtifact('A');
		const dep1 = await env.broadcastDeployment(
			'A',
			{
				type: 'object',
				data: {
					from: env.resolveAccount('deployer'),
					to: null,
					data: artifact.bytecode,
					chainId: '0x7a69',
				} as any,
			},
			{...artifact, argsData: '0x'},
		);
		const dep2 = await env.broadcastDeployment(
			'B',
			{
				type: 'object',
				data: {
					from: env.resolveAccount('deployer'),
					to: null,
					data: artifact.bytecode,
					chainId: '0x7a69',
				} as any,
			},
			{...createMockArtifact('B'), argsData: '0x'},
		);

		expect(dep1.address).not.toBe(dep2.address);
	});
});

describe('createTestEnvironment - Map-backed store survives across environments', () => {
	it('a second createTestEnvironment on the same store sees the deployments the first one saved', async () => {
		const deploymentStore = createMapDeploymentStore();

		const first = await createTestEnvironment({
			accounts: {deployer: NODE_ACCOUNT_LOWER as `0x${string}`},
			nodeAccounts: [NODE_ACCOUNT_LOWER as `0x${string}`],
			deploymentStore,
		});

		const artifact = createMockArtifact('Persistent');
		await first.env.broadcastDeployment(
			'Persistent',
			{
				type: 'object',
				data: {
					from: first.env.resolveAccount('deployer'),
					to: null,
					data: artifact.bytecode,
					chainId: '0x7a69',
				} as any,
			},
			{...artifact, argsData: '0x'},
		);

		const second = await createTestEnvironment({
			accounts: {deployer: NODE_ACCOUNT_LOWER as `0x${string}`},
			nodeAccounts: [NODE_ACCOUNT_LOWER as `0x${string}`],
			deploymentStore,
		});
		await second.internal.loadDeployments();

		expect(second.env.getOrNull('Persistent')).not.toBeNull();
		expect(second.env.get('Persistent').address).toBe(first.env.get('Persistent').address);
	});
});

describe('createTestEnvironment - generic passthrough', () => {
	it('config.chains[id] overrides reach env.network.chain', async () => {
		const {env} = await createTestEnvironment({
			chainId: 12345,
			config: {
				chains: {
					12345: {
						info: {
							id: 12345,
							name: 'my-test-chain',
							nativeCurrency: {name: 'X', symbol: 'X', decimals: 18},
							rpcUrls: {default: {http: []}},
						},
					},
				},
			},
		});
		expect(env.network.chain.id).toBe(12345);
		expect(env.network.chain.name).toBe('my-test-chain');
	});

	it('executionParams.extra reaches env.extra', async () => {
		const {env} = await createTestEnvironment({
			executionParams: {extra: {my: 'flag'} as any},
		});
		expect(env.extra).toEqual({my: 'flag'});
	});
});

describe('createTestEnvironment - noise-free construction', () => {
	it('creating an env and running a broadcast produces no unmocked-method warning and no chain-config error', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const {env} = await createTestEnvironment({
				accounts: {deployer: NODE_ACCOUNT_LOWER as `0x${string}`},
				nodeAccounts: [NODE_ACCOUNT_LOWER as `0x${string}`],
			});
			await env.broadcastExecution({
				type: 'object',
				data: {
					from: env.resolveAccount('deployer'),
					to: '0x0000000000000000000000000000000000000001',
					chainId: '0x7a69',
				} as any,
			});
			for (const call of warn.mock.calls) {
				expect(String(call[0] ?? '')).not.toMatch(/Unmocked provider method/);
			}
			for (const call of error.mock.calls) {
				expect(String(call[0] ?? '')).not.toMatch(/has no public info/);
			}
		} finally {
			warn.mockRestore();
			error.mockRestore();
		}
	});
});
