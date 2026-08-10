import {describe, it, expect, afterEach} from 'vitest';
import os from 'node:os';
import path from 'node:path';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';
import type {PromptExecutor, UserConfig} from '@rocketh/core/types';

import {setupEnvironmentFromFiles} from '../src/index.js';

/**
 * hardhat-deploy reaches an environment through `@rocketh/node`'s
 * `loadEnvironmentFromFiles` → `loadEnvironmentFromFilesWithSpecificConfig` →
 * `loadEnvironmentFromStore`, a path with NO executor in scope. Before the prompt rode
 * the run parameters, that meant a hardhat user could never be interactive, silently
 * and with no way to opt in (ADR 0007). This drives that exact path (with an explicit
 * config, so no `rocketh.ts` on disk is needed) and asserts the capability is there BY
 * DEFAULT on a run with a terminal, because `@rocketh/node` supplies its own prompt on
 * it, and ABSENT without one, which is what keeps a hardhat-deploy run in CI on the
 * throw path.
 */

const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';
const NODE_ACCOUNT = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

function createMockProvider(): EIP1193ProviderWithoutEvents {
	return {
		request: (async (args: {method: string; params?: unknown}) => {
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69'; // 31337
				case 'eth_accounts':
					return [NODE_ACCOUNT];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				default:
					throw new Error(`mock provider: unsupported method ${args.method}`);
			}
		}) as EIP1193ProviderWithoutEvents['request'],
	} as EIP1193ProviderWithoutEvents;
}

const config: UserConfig = {
	accounts: {deployer: 0},
	defaultPollingInterval: 0.001,
	// point the (filesystem) deployment store at a folder that does not exist, so loading
	//  finds nothing and this test writes nowhere
	deployments: path.join(os.tmpdir(), 'rocketh-node-prompt-capability-test-deployments'),
};

const executionParams = {
	provider: createMockProvider(),
	environment: 'memory',
	saveDeployments: false,
} as const;

/**
 * The loader builds `@rocketh/node`'s prompt itself, so what stdin looks like at that
 * moment decides the capability. The test process's own stdin is not a terminal, so
 * both directions are driven by setting the flag the runtime reads.
 */
function pretendStdinIsATTY(isTTY: boolean | undefined) {
	(process.stdin as {isTTY?: boolean}).isTTY = isTTY as boolean;
}

const realStdinIsTTY = process.stdin.isTTY;

describe('@rocketh/node - text-prompt capability through the loader', () => {
	afterEach(() => {
		pretendStdinIsATTY(realStdinIsTTY);
	});

	it('gives the environment the capability by default on the hardhat-deploy path', async () => {
		pretendStdinIsATTY(true);
		const {loadEnvironmentFromFilesWithConfig} = setupEnvironmentFromFiles({});

		const env = await loadEnvironmentFromFilesWithConfig({...executionParams}, config);

		expect(env.canPromptForText()).toBe(true);
	});

	/**
	 * THE CI CASE, and the reason the gate is in the RUNTIME rather than in
	 * `canPromptForText()`: a hardhat-deploy run whose stdin is not a terminal gets NO
	 * text ability, so the unknown-signer policy degrades to `throw` rather than pausing
	 * on a prompt nobody can answer (`prompts` would never settle, see
	 * `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`).
	 */
	it('withholds the capability when stdin is not a TTY, so CI degrades instead of prompting', async () => {
		pretendStdinIsATTY(false);
		const {loadEnvironmentFromFilesWithConfig} = setupEnvironmentFromFiles({});

		const env = await loadEnvironmentFromFilesWithConfig({...executionParams}, config);

		expect(env.canPromptForText()).toBe(false);
	});

	it('lets a caller-supplied prompt override the default (a capability-less one degrades)', async () => {
		// The same route a test or an embedder with its own UI takes. A confirm-only prompt is
		//  what `@rocketh/web` ships: present, but unable to ask a human for text.
		const confirmOnly: PromptExecutor = {
			async prompt() {
				return {proceed: true};
			},
			exit() {},
		};
		pretendStdinIsATTY(true);
		const {loadEnvironmentFromFilesWithConfig} = setupEnvironmentFromFiles({});

		const env = await loadEnvironmentFromFilesWithConfig({...executionParams, promptExecutor: confirmOnly}, config);

		expect(env.canPromptForText()).toBe(false);
	});
});
