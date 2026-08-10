import {describe, it, expect} from 'vitest';
import {UnknownSignerError} from '@rocketh/core';
import type {Environment, PromptExecutor} from '@rocketh/core/types';
import {createMockPromptExecutor, createTestEnvironment} from '@rocketh/test-utils';

/**
 * Driving the INTERACTIVE unknown-signer path from an EXTENSION package, with no TTY.
 *
 * This is the documentation example for `createMockPromptExecutor`: the shared fake
 * prompt from `@rocketh/test-utils`. It is injected through the harness's EXISTING
 * run-parameter pass-through (`executionParams.promptExecutor`) — the capability rides
 * `ExecutionParams` exactly as `autoImpersonate` does (ADR 0007), so no harness option
 * exists or is needed for it.
 *
 * The environment is the real one (`createTestEnvironment`), the seam is the real
 * broadcast choke point, and only the human is faked. Three shapes are shown, which are
 * the three a test ever needs:
 *
 * 1. a prompt that answers with a canned transaction hash — the run CONTINUES;
 * 2. a prompt that answers `"cannot sign"` — the run DEFERS (`UnknownSignerError`);
 * 3. a prompt with NO text ability at all — `'ask'` degrades to `'throw'` and the
 *    prompt is never consulted (what `@rocketh/web`'s confirm-only prompt looks like,
 *    and what a CI run looks like).
 */

/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';
/** An address the mock node lists in `eth_accounts`, so it is signable. */
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001';

/** What the human pastes back after executing the transaction on their Safe. */
const PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000aa' as `0x${string}`;

/** A privileged call from the Safe: the tx a human has to execute out-of-band. */
function upgradeCall(env: Environment, from: `0x${string}`) {
	return env.broadcastExecution({
		type: 'object',
		data: {
			type: '0x2',
			from,
			to: TARGET_CONTRACT,
			data: '0xdeadbeef',
			value: '0x1f4',
			chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
		},
	});
}

/**
 * An environment whose named `admin` is unsignable (no signer material, no
 * impersonation), running under the `'ask'` policy with `promptExecutor` as its only
 * way to reach a human.
 *
 * The mock node must KNOW the pasted hash, since the interactive path looks the pasted
 * transaction up (`eth_getTransactionByHash`) before it records anything; the harness
 * default answers `null` (nothing has been sent).
 */
async function askingSafeOwnerEnvironment(promptExecutor: PromptExecutor) {
	return createTestEnvironment({
		accounts: {deployer: NODE_ACCOUNT, admin: SAFE_ADDRESS},
		nodeAccounts: [NODE_ACCOUNT],
		executionParams: {autoImpersonate: false, onUnknownSigner: 'ask', promptExecutor},
		providerConfig: {
			responses: {
				eth_getTransactionByHash: (params?: unknown[]) => ({
					hash: params?.[0] as `0x${string}`,
					nonce: '0x3',
					from: SAFE_ADDRESS,
					gasPrice: '0x1',
					type: '0x0',
				}),
			},
		},
	});
}

describe('@rocketh/unknown-signer - interactive path with an injected fake prompt', () => {
	it('continues the run from a canned transaction hash', async () => {
		/**
		 * Example: rehearsing the Safe flow in a test. The prompt answers with the hash
		 * of the transaction "executed on the Safe", and the run continues in the same
		 * execution — returning a real receipt for THAT transaction, with no send RPC
		 * ever attempted.
		 */
		const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
		const {env, provider} = await askingSafeOwnerEnvironment(promptExecutor);

		const receipt = await upgradeCall(env, SAFE_ADDRESS);

		expect(receipt.transactionHash).toBe(PASTED_HASH);

		// the human was asked exactly once, and the question named the account rocketh
		// could not sign for
		expect(promptExecutor.textRequests).toHaveLength(1);
		expect(promptExecutor.textRequests[0].message).toContain(SAFE_ADDRESS);

		// nothing was sent: the transaction was executed out-of-band
		const sends = provider
			.getRequests()
			.filter((request) => request.method === 'eth_sendTransaction' || request.method === 'eth_sendRawTransaction');
		expect(sends).toEqual([]);
	});

	it('defers when the prompt answers "cannot sign"', async () => {
		/**
		 * Example: the human cannot execute the transaction right now. The interactive
		 * path degrades to the defer path, throwing the very same `UnknownSignerError`
		 * `catchUnknownSigner` catches.
		 */
		const promptExecutor = createMockPromptExecutor({textAnswers: ['cannot sign']});
		const {env} = await askingSafeOwnerEnvironment(promptExecutor);

		await expect(upgradeCall(env, SAFE_ADDRESS)).rejects.toBeInstanceOf(UnknownSignerError);

		expect(promptExecutor.textRequests).toHaveLength(1);
	});

	it('degrades to throw, unconsulted, when the prompt cannot ask for text', async () => {
		/**
		 * Example: the same script under a runtime that cannot ask a human for text (a
		 * browser, or CI). `createMockPromptExecutor()` without `textAnswers` builds
		 * exactly that shape — a prompt object with NO `promptText` method — and the
		 * ABSENCE of that method IS the capability signal (ADR 0007). Asking for `'ask'`
		 * cannot make such a run interactive: it throws, and nobody is asked anything.
		 */
		const promptExecutor = createMockPromptExecutor();
		const {env} = await askingSafeOwnerEnvironment(promptExecutor);

		expect(env.canPromptForText()).toBe(false);

		await expect(upgradeCall(env, SAFE_ADDRESS)).rejects.toBeInstanceOf(UnknownSignerError);

		// the run never even tried to reach a human
		expect(promptExecutor.requests).toEqual([]);
	});
});
