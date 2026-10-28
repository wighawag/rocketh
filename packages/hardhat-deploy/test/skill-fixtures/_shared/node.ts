/**
 * SHARED by every skill's fixtures: the test's NODE, and the way a fixture declares a named
 * account of each signability. Not part of any miniature project: this is the stand-in for the
 * chain a user's run talks to.
 *
 * It is `createTestEnvironment` from `@rocketh/test-utils`: a REAL rocketh environment (config
 * resolution, named-account resolution, signability, the broadcast path) over a mock EIP-1193
 * provider. Hand its `provider` to `executeScripts` (`./executor.ts`) to run deploy scripts
 * through rocketh's real executor, or use its `env` to call one script directly.
 *
 * ## Declaring each signability
 *
 * The node holds `NODE_HELD_ACCOUNTS` (so `deployer: 0` is node-held) and lets impersonation
 * succeed ONLY for the addresses listed in `impersonable`, which defaults to
 * `[IMPERSONABLE_ADDRESS]`. Auto-impersonation is on for the `env` returned here; a run through
 * the executor turns it on with `executeScripts({autoImpersonate: true})`, as a fork run does. So a fixture's `rocketh/config.ts` declares, in the form a user
 * writes:
 *
 * | signability (`Signability`) | how the named account is declared                                       |
 * | --------------------------- | ----------------------------------------------------------------------- |
 * | `node`                      | an index (`deployer: 0`)                                                |
 * | `impersonated`              | an address listed in `impersonable` (`IMPERSONABLE_ADDRESS` by default) |
 * | `unsignable`                | any other address (`UNSIGNABLE_ADDRESS` is one)                         |
 * | `local`                     | `privateKey:0x…`, on this `env` only (see below)                        |
 *
 * This is "Constructing each signability" in `documentation/extending/testing/`, with the
 * impersonation outcome decided per address rather than for the whole node, so one run can mix
 * an impersonated account with an unsignable one. `local` resolves on the `env` returned here,
 * because `createTestEnvironment` registers the `privateKey` protocol; a run through the
 * executor resolves the FIXTURE's config, which would have to register it itself
 * (`signerProtocols`), and `@rocketh/signer` is not a dependency of this package.
 */

import type {DeploymentStore, UnresolvedUnknownNamedAccounts} from 'rocketh/types';
import {
	createTestEnvironment,
	NODE_HELD_ACCOUNTS,
	type CreateTestEnvironmentOptions,
	type MockProvider,
	type TestEnvironmentResult,
} from '@rocketh/test-utils';

export {NODE_HELD_ACCOUNTS};

/** An address the node lets rocketh impersonate (by default): declared by address, it is `impersonated`. */
export const IMPERSONABLE_ADDRESS = '0x1111111111111111111111111111111111111111' as const;

/** An address the node neither holds nor lets rocketh impersonate: declared by address, it is `unsignable`. */
export const UNSIGNABLE_ADDRESS = '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe' as const;

/**
 * A key no real account uses, for a `local` account (`privateKey:${LOCAL_PRIVATE_KEY}`): rocketh
 * signs with it itself and sends the raw transaction.
 */
export const LOCAL_PRIVATE_KEY = `0x${'1'.repeat(63)}2` as const;

export type CreateNodeOptions = {
	/** The named accounts, as a fixture's `rocketh/config.ts` declares them (`config.accounts`). */
	accounts?: UnresolvedUnknownNamedAccounts;
	/** The addresses whose impersonation succeeds; every other non-held address is unsignable. */
	impersonable?: readonly string[];
	chainId?: number;
	environmentName?: string;
	/** The same store twice is the same deployment folder on a second run. */
	deploymentStore?: DeploymentStore;
	/** Canned answers for the RPC methods a script or an extension reads back (see `MockProvider`). */
	responses?: NonNullable<CreateTestEnvironmentOptions['providerConfig']>['responses'];
	executionParams?: CreateTestEnvironmentOptions['executionParams'];
};

/** A node over the mock provider, with the signability of each account decided as described above. */
export function createNode(options: CreateNodeOptions = {}): Promise<TestEnvironmentResult> {
	const impersonable = new Set((options.impersonable ?? [IMPERSONABLE_ADDRESS]).map((a) => a.toLowerCase()));
	return createTestEnvironment({
		accounts: options.accounts ?? {},
		nodeAccounts: NODE_HELD_ACCOUNTS,
		chainId: options.chainId,
		environmentName: options.environmentName,
		deploymentStore: options.deploymentStore,
		// a dev node or a fork that impersonates: without it no account is `impersonated`
		executionParams: {autoImpersonate: true, ...options.executionParams},
		providerConfig: {
			responses: {
				hardhat_impersonateAccount: (params?: unknown[]) => {
					const address = String(params?.[0] ?? '').toLowerCase();
					if (!impersonable.has(address)) {
						// not swallowed as "method not supported": the account stays unsignable
						throw new Error(`hardhat_impersonateAccount rejected for ${address} by the skill-fixture node`);
					}
					return null;
				},
				...options.responses,
			},
		},
	});
}

/** Every transaction the node was asked to send, in order, with `from` and `to` lowercased. */
export function sent(provider: Pick<MockProvider, 'getRequests'>) {
	return provider
		.getRequests()
		.filter((r) => r.method === 'eth_sendTransaction')
		.map((r) => {
			const tx = r.params?.[0] as {from: string; to?: string; data?: `0x${string}`};
			return {from: tx.from.toLowerCase(), to: tx.to?.toLowerCase(), data: tx.data};
		});
}
