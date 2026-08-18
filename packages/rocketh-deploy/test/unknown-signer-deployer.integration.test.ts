/**
 * Integration tests for @rocketh/deploy - an unsignable DEPLOYER.
 *
 * A deploy whose `account` resolves to an address rocketh cannot sign for (the
 * canonical case: a Safe that owns the deployment key, or a hardware wallet left
 * unplugged) must surface the exact transaction to execute out-of-band, exactly like
 * a raw `tx` or an `execute` does. `deploy` used to perform its OWN
 * `env.addressSigners[address]` lookup and throw an opaque `cannot get signer for ...`
 * BEFORE building the transaction, so it never reached the single
 * `broadcastTransaction` choke point where the unknown-signer seam lives (ADR 0006).
 * These tests fence that: the deploy now reaches the seam and raises
 * `UnknownSignerError`, under the SAME effective `onUnknownSigner` policy as any other
 * transaction.
 *
 * They also fence the other half: a SIGNABLE deployer is completely unaffected,
 * including the deterministic create2/create3 factory paths (which is where the
 * removed lookup used to feed a `signer` argument).
 *
 * They live HERE rather than in `packages/rocketh/test/` because driving `deploy`
 * needs this package, and `rocketh` must not depend on `@rocketh/test-utils` (that
 * closes an nx project-graph cycle; see `CONTEXT.md` under _test environment_).
 */

import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';
import {UnknownSignerError} from '@rocketh/core';
import type {Environment} from '@rocketh/core/types';

/** An address the mock node lists in `eth_accounts`, so it is signable. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as `0x${string}`;
/** Stands in for the Safe/multisig deployer: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111' as `0x${string}`;
/**
 * A Safe address passed to `deploy` LITERALLY, i.e. never declared as a named account
 * and not held by the node, so it has NO `addressSigners` entry at all. This is the
 * spelling the removed pre-guard used to reject: `addressSigners[address]` was
 * `undefined` and it threw `cannot get signer for ...` before the transaction existed.
 * (A named account declared as a bare address always HAS an entry —
 * `{type:'remote', signer: provider}` — which is why the guard never fired for it, and
 * why the seam keys off signability rather than the presence of a signer entry.)
 */
const UNDECLARED_SAFE_ADDRESS = '0x2222222222222222222222222222222222222222' as `0x${string}`;

/**
 * A run where `safeDeployer` is unsignable: the node does not list it in
 * `eth_accounts` and `autoImpersonate` is off (story 8 of the spec).
 */
async function setup(executionParams?: {onUnknownSigner?: 'throw' | 'auto'}) {
	return createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT, safeDeployer: SAFE_ADDRESS},
		nodeAccounts: [NODE_ACCOUNT],
		executionParams: {autoImpersonate: false, ...executionParams},
	});
}

/** Run `action`, expecting it to reject with an `UnknownSignerError`, and return it. */
async function expectUnknownSignerError(action: () => Promise<unknown>): Promise<UnknownSignerError> {
	const error = await action().then(
		() => undefined,
		(e) => e,
	);
	expect(error).toBeInstanceOf(UnknownSignerError);
	return error as UnknownSignerError;
}

/** The transaction object passed to the last `eth_sendTransaction` recorded by the mock. */
function lastSentTransaction(provider: {getRequests: () => {method: string; params?: unknown[]}[]}) {
	const sendRequest = [...provider.getRequests()].reverse().find((r) => r.method === 'eth_sendTransaction');
	return sendRequest?.params?.[0] as Record<string, unknown> | undefined;
}

/**
 * The create2 factory info for the run, narrowed out of `DeterministicDeploymentInfo`.
 *
 * That type is a UNION of two shapes: the create2 info DIRECTLY (`{factory, deployer,
 * funding, signedTx}`), or a wrapper carrying optional `create2` / `create3` members.
 * `@rocketh/deploy` narrows it exactly this way, so a test asserting on the factory has
 * to do the same rather than reaching for one member and being right only because of
 * what the harness happens to supply.
 */
function create2Info(env: Environment): {factory: `0x${string}`; deployer: `0x${string}`} {
	const info = env.network.deterministicDeployment as {
		factory?: `0x${string}`;
		deployer?: `0x${string}`;
		create2?: {factory: `0x${string}`; deployer: `0x${string}`};
	};
	const create2 =
		info.create2 ?? (info.factory && info.deployer ? {factory: info.factory, deployer: info.deployer} : undefined);
	if (!create2) {
		throw new Error('this run has no create2 deterministic deployment info');
	}
	return create2;
}

describe('@rocketh/deploy - unsignable deployer reaches the unknown-signer seam', () => {
	describe('Story 5: the mechanism fires for a deploy, not only for a proxy upgrade', () => {
		it('raises UnknownSignerError carrying the deployment transaction', async () => {
			/**
			 * Example: the named account that must deploy is a Safe. You get back the exact
			 * transaction to execute: `from` is the Safe and `data` is the deployment calldata
			 * (creation bytecode + encoded constructor args).
			 *
			 * This spelling already reached the seam BEFORE the pre-guard was removed, because a
			 * named bare-address account does have an `addressSigners` entry. It is fenced here
			 * so removing the guard cannot regress it, and so the two spellings of "my deployer
			 * is a Safe" are documented as behaving identically.
			 */
			const {env} = await setup();
			const artifact = createMockArtifact('SafeDeployedContract');

			const error = await expectUnknownSignerError(() =>
				deploy(env)('SafeDeployedContract', {
					account: 'safeDeployer',
					artifact,
					args: [42n],
				}),
			);

			expect(error.data.from.toLowerCase()).toBe(SAFE_ADDRESS);
			expect(error.data.data?.startsWith(artifact.bytecode)).toBe(true);
			// a deploy has no `to` and no function to name, so `contract` stays unset
			expect(error.data.to).toBeUndefined();
			expect(error.data.contract).toBeUndefined();
			expect(error.message).not.toContain('cannot get signer');
		});

		it('does not save a deployment for the deploy it could not broadcast', async () => {
			/**
			 * Nothing is persisted by the mechanism: the user executes the surfaced
			 * transaction out-of-band and re-runs the idempotent script.
			 */
			const {env} = await setup();

			await expectUnknownSignerError(() =>
				deploy(env)('SafeDeployedContract', {
					account: 'safeDeployer',
					artifact: createMockArtifact('SafeDeployedContract'),
					args: [42n],
				}),
			);

			expect(env.getOrNull('SafeDeployedContract')).toBeNull();
		});

		it('surfaces the factory call when the deploy is deterministic', async () => {
			/**
			 * The deterministic paths funnel through the same choke point: what a human
			 * has to execute is the create2 factory call, so `to` is the factory.
			 */
			const {env} = await setup();

			const error = await expectUnknownSignerError(() =>
				deploy(env)(
					'DeterministicContract',
					{
						account: 'safeDeployer',
						artifact: createMockArtifact('DeterministicContract'),
						args: [42n],
					},
					{deterministic: true},
				),
			);

			expect(error.data.from.toLowerCase()).toBe(SAFE_ADDRESS);
			expect(error.data.to?.toLowerCase()).toBe(create2Info(env).factory.toLowerCase() as `0x${string}`);
		});

		it('surfaces the FUNDING transfer first when the create2 factory is missing and under-funded', async () => {
			/**
			 * The consequence of routing this path through the seam instead of stopping it at a
			 * pre-guard, and the one a user is most likely to be surprised by.
			 *
			 * A deterministic deploy needs the create2 factory to exist. If it does not, rocketh
			 * deploys it — and if the factory's own deployer is short of gas money, it FIRST
			 * sends a plain value transfer from the deployment account. When that account is the
			 * Safe, that funding transfer is the first thing to reach the seam, so the
			 * transaction the human is asked to execute is a 21000-gas ETH transfer, NOT the
			 * deployment they asked for. The deployment surfaces on a later run, once the factory
			 * exists; the idempotent re-run loop is what makes that acceptable.
			 *
			 * The default harness answers `eth_getBalance` with 1000 ETH, so every other
			 * deterministic test lands on the factory CALL and this branch was never exercised.
			 */
			const {env} = await createTestEnvironment({
				accounts: {deployer: NODE_ACCOUNT, safeDeployer: SAFE_ADDRESS},
				nodeAccounts: [NODE_ACCOUNT],
				executionParams: {autoImpersonate: false},
				providerConfig: {
					responses: {
						// no factory deployed yet
						eth_getCode: '0x',
						// and its deployer cannot pay for its own deployment
						eth_getBalance: '0x0',
					},
				},
			});

			const error = await expectUnknownSignerError(() =>
				deploy(env)(
					'DeterministicContract',
					{
						account: 'safeDeployer',
						artifact: createMockArtifact('DeterministicContract'),
						args: [42n],
					},
					{deterministic: true},
				),
			);

			// it is the FUNDING transfer, not the factory call and not the deployment
			expect(error.data.from.toLowerCase()).toBe(SAFE_ADDRESS);
			expect(error.data.to?.toLowerCase()).toBe(create2Info(env).deployer.toLowerCase() as `0x${string}`);
			expect(error.data.to?.toLowerCase()).not.toBe(create2Info(env).factory.toLowerCase());
			expect(BigInt(error.data.value ?? '0x0')).toBeGreaterThan(0n);
			// nothing was recorded for the deployment the user actually asked for
			expect(env.getOrNull('DeterministicContract')).toBeNull();
		});
	});

	describe('A deployer passed as a bare address, with no signer entry at all', () => {
		it('raises UnknownSignerError rather than the opaque "cannot get signer" error', async () => {
			/**
			 * Example: you pass the Safe address straight to `deploy` without declaring it as
			 * a named account. There is no `addressSigners` entry for it, which is exactly what
			 * the old pre-guard tripped over. It is `unsignable` like any other account the
			 * node cannot sign for, so it takes the same seam and yields the same payload.
			 */
			const {env} = await setup();
			const artifact = createMockArtifact('SafeDeployedContract');

			const error = await expectUnknownSignerError(() =>
				deploy(env)('SafeDeployedContract', {
					account: UNDECLARED_SAFE_ADDRESS,
					artifact,
					args: [42n],
				}),
			);

			expect(error.data.from.toLowerCase()).toBe(UNDECLARED_SAFE_ADDRESS);
			expect(error.data.data?.startsWith(artifact.bytecode)).toBe(true);
			expect(error.message).not.toContain('cannot get signer');
		});

		it('surfaces the factory call when that deploy is deterministic', async () => {
			const {env} = await setup();

			const error = await expectUnknownSignerError(() =>
				deploy(env)(
					'DeterministicContract',
					{
						account: UNDECLARED_SAFE_ADDRESS,
						artifact: createMockArtifact('DeterministicContract'),
						args: [42n],
					},
					{deterministic: true},
				),
			);

			expect(error.data.from.toLowerCase()).toBe(UNDECLARED_SAFE_ADDRESS);
			expect(error.data.to?.toLowerCase()).toBe(create2Info(env).factory.toLowerCase() as `0x${string}`);
		});
	});

	describe('It honours the effective onUnknownSigner policy, exactly as the seam does', () => {
		it('throws under an explicit onUnknownSigner: "throw"', async () => {
			const {env} = await setup({onUnknownSigner: 'throw'});

			await expectUnknownSignerError(() =>
				deploy(env)('SafeDeployedContract', {
					account: 'safeDeployer',
					artifact: createMockArtifact('SafeDeployedContract'),
					args: [42n],
				}),
			);
		});

		it('throws under "auto", which degrades to throw while no resolver exists', async () => {
			const {env} = await setup({onUnknownSigner: 'auto'});

			await expectUnknownSignerError(() =>
				deploy(env)('SafeDeployedContract', {
					account: 'safeDeployer',
					artifact: createMockArtifact('SafeDeployedContract'),
					args: [42n],
				}),
			);
		});

		it('throws inside a pushed policy frame (what catchUnknownSigner wraps a deploy with)', async () => {
			/**
			 * `catchUnknownSigner` (in `@rocketh/unknown-signer`) pushes a `'throw'` frame
			 * around its action. A deploy inside such a frame must reach the seam so the
			 * wrapper can catch it — that is what makes a deferred deploy work.
			 */
			const {env} = await setup();
			await env.runUnderUnknownSignerPolicy({policy: 'throw'}, async () => {
				await expectUnknownSignerError(() =>
					deploy(env)('SafeDeployedContract', {
						account: 'safeDeployer',
						artifact: createMockArtifact('SafeDeployedContract'),
						args: [42n],
					}),
				);
			});
		});

		it('never turns a SIGNABLE deployer into a throw, even inside a pushed frame', async () => {
			/**
			 * Story 6, the mixed run: inside one wrapper the signable deploys broadcast
			 * normally and only the unsignable one is caught. A frame forces `throw` over
			 * `ask`, NEVER over signability (ADR 0006).
			 */
			const {env} = await setup();
			await env.runUnderUnknownSignerPolicy({policy: 'throw'}, async () => {
				const deployment = await deploy(env)('SignableContract', {
					account: 'deployer',
					artifact: createMockArtifact('SignableContract'),
					args: [42n],
				});
				expect(deployment.newlyDeployed).toBe(true);
			});
		});
	});

	describe('A signable deployer is completely unaffected', () => {
		it('broadcasts a normal deploy from the node account', async () => {
			const {env, provider} = await setup();

			const deployment = await deploy(env)('SignableContract', {
				account: 'deployer',
				artifact: createMockArtifact('SignableContract'),
				args: [42n],
			});

			expect(deployment.newlyDeployed).toBe(true);
			expect(deployment.address).toBeDefined();
			expect((lastSentTransaction(provider)?.from as string)?.toLowerCase()).toBe(NODE_ACCOUNT);
		});

		it('still deploys deterministically through the create2 factory', async () => {
			const {env} = await setup();

			const deployment = await deploy(env)(
				'Create2Contract',
				{
					account: 'deployer',
					artifact: createMockArtifact('Create2Contract'),
					args: [42n],
				},
				{deterministic: true},
			);

			expect(deployment.newlyDeployed).toBe(true);
			// the address is the create2-predicted one, not the receipt's contractAddress
			expect(deployment.address).toBe(await expectedCreate2Address(env, 'Create2Contract'));
		});

		it('still deploys deterministically through the create3 factory', async () => {
			const {env} = await setup();

			const deployment = await deploy(env)(
				'Create3Contract',
				{
					account: 'deployer',
					artifact: createMockArtifact('Create3Contract'),
					args: [42n],
				},
				{deterministic: {type: 'create3'}},
			);

			expect(deployment.newlyDeployed).toBe(true);
			expect(deployment.address).toBeDefined();
		});
	});
});

/**
 * Recompute the create2 address the deploy above should have produced, from the same
 * inputs `deploy` uses, so the assertion does not hard-code a hash.
 */
async function expectedCreate2Address(env: Environment, name: string): Promise<`0x${string}`> {
	const {getCreate2Address, encodeDeployData, zeroHash} = await import('viem');
	const artifact = createMockArtifact(name);
	return getCreate2Address({
		from: create2Info(env).factory,
		salt: zeroHash,
		bytecode: encodeDeployData({abi: artifact.abi, bytecode: artifact.bytecode, args: [42n]} as any),
	});
}
