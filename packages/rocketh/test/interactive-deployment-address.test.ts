import {describe, it, expect, vi} from 'vitest';

import {resolveConfig, getChainIdForEnvironment, resolveExecutionParams} from '../src/executor/index.js';
import {createEnvironment} from '../src/environment/index.js';
import {privateKey} from '@rocketh/signer';
import type {
	DeploymentStore,
	PartialDeployment,
	PromptExecutor,
	TextPromptAnswer,
	UnknownSignerPolicy,
	UserConfig,
} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * Tests for the ADDRESS half of the interactive unknown-signer resolver: what a
 * DEPLOYMENT deferred to a Safe is allowed to record.
 *
 * An EXECUTION has no address to anchor on, so its accepted residual risk is that a
 * successful-but-unrelated hash is taken at face value (see
 * `interactive-unknown-signer.test.ts`). A DEPLOYMENT does have one, so it is held
 * to a stricter standard here: the address comes from the pasted transaction's own
 * receipt, or — when the address was computed BEFORE broadcast (a deterministic or
 * factory deploy, where the environment already PREFERS that expected address over
 * the receipt's) — it is confirmed by CODE being at it. Anything else fails loudly
 * and records nothing at all.
 *
 * Like the other tests in this folder these build a REAL environment
 * (`resolveConfig` → `getChainIdForEnvironment` → `resolveExecutionParams` →
 * `createEnvironment`) against a small local mock provider, and drive
 * `env.broadcastDeployment` — the funnel `@rocketh/deploy` itself uses — rather than
 * importing `@rocketh/deploy`, which would close an nx project-graph cycle.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111';

/** What the node would have returned had rocketh sent the transaction itself. */
const SENT_TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000011' as `0x${string}`;
/** What the human pastes back after executing the deployment on their Safe. */
const PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000aa' as `0x${string}`;
const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';

/** The address the pasted transaction's receipt says was created. */
const DEPLOYED_ADDRESS = '0x0000000000000000000000000000000000000abc' as `0x${string}`;
/** The address a deterministic deploy computed from bytecode + salt before broadcast. */
const EXPECTED_ADDRESS = '0x2222222222222222222222222222222222222222' as `0x${string}`;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

const DEPLOYMENT_NAME = 'MyContract';

type Call = {method: string; params?: unknown};

function createMockProvider(options?: {
	accounts?: string[];
	/** Per-hash receipt overrides, e.g. a missing contract address for the pasted hash. */
	receipts?: Record<string, Record<string, unknown>>;
	/** Code per address, as `eth_getCode` would answer. Anything absent has no code. */
	code?: Record<string, `0x${string}`>;
	/** Make `eth_getCode` FAIL, as a node having an outage would. */
	codeLookupError?: string;
}): {provider: EIP1193ProviderWithoutEvents; calls: Call[]} {
	const calls: Call[] = [];
	const code: Record<string, `0x${string}`> = {};
	for (const [address, value] of Object.entries(options?.code ?? {})) {
		code[address.toLowerCase()] = value;
	}
	const provider = {
		request: (async (args: {method: string; params?: unknown}) => {
			calls.push({method: args.method, params: args.params});
			switch (args.method) {
				case 'eth_chainId':
					return '0x7a69'; // 31337
				case 'eth_accounts':
					return options?.accounts ?? [];
				case 'eth_getBlockByNumber':
					return {number: '0x0', hash: GENESIS_HASH};
				case 'eth_signTransaction':
					return '0xf86b';
				case 'eth_sendRawTransaction':
				case 'eth_sendTransaction':
					return SENT_TX_HASH;
				case 'eth_getCode':
					if (options?.codeLookupError) {
						throw new Error(options.codeLookupError);
					}
					return code[(args.params as string[])[0].toLowerCase()] ?? '0x';
				case 'eth_getTransactionByHash': {
					const hash = (args.params as string[])[0];
					return {hash, nonce: '0x3', from: SAFE_ADDRESS, gasPrice: '0x1', type: '0x0'};
				}
				case 'eth_getTransactionReceipt': {
					const hash = (args.params as string[])[0];
					return {
						transactionHash: hash,
						blockHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
						blockNumber: '0x1',
						transactionIndex: '0x0',
						from: SAFE_ADDRESS,
						contractAddress: DEPLOYED_ADDRESS,
						gasUsed: '0x5208',
						status: '0x1',
						logs: [],
						...options?.receipts?.[hash],
					};
				}
				case 'eth_blockNumber':
					return '0x1';
				default:
					throw new Error(`mock provider: unsupported method ${args.method}`);
			}
		}) as EIP1193ProviderWithoutEvents['request'],
	};
	return {provider: provider as EIP1193ProviderWithoutEvents, calls};
}

function createInMemoryStore(): {store: DeploymentStore; writes: {name: string; content: string}[]} {
	const files: Record<string, string> = {};
	const writes: {name: string; content: string}[] = [];
	const store: DeploymentStore = {
		listFiles: vi.fn(async () => []),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_folder, _env, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_folder, _env, name, content) => {
			files[name] = content;
			writes.push({name, content});
		}),
		writeFileWithChainInfo: vi.fn(async (_info, _folder, _env, name, content) => {
			files[name] = content;
			writes.push({name, content});
		}),
		readFile: vi.fn(async (_folder, _env, name) => files[name]),
		deleteFile: vi.fn(async (_folder, _env, name) => {
			delete files[name];
		}),
	};
	return {store, writes};
}

type ScriptedPrompt = PromptExecutor & {promptText: ReturnType<typeof vi.fn>};

/** A prompt driven by a SCRIPT of answers, so the interactive path runs with no TTY. */
function createScriptedPrompt(answers: TextPromptAnswer[]): ScriptedPrompt {
	const promptText = vi.fn(async () => {
		const next = answers.shift();
		if (next === undefined) {
			throw new Error('scripted prompt: asked more times than the test scripted answers for');
		}
		return next;
	});
	return {
		async prompt() {
			return {proceed: true};
		},
		promptText,
		exit() {},
	};
}

async function buildEnvironment(options: {
	accounts: UserConfig['accounts'];
	nodeAccounts?: string[];
	onUnknownSigner?: UnknownSignerPolicy;
	promptExecutor?: PromptExecutor;
	receipts?: Record<string, Record<string, unknown>>;
	code?: Record<string, `0x${string}`>;
	codeLookupError?: string;
}) {
	const {provider, calls} = createMockProvider({
		accounts: options.nodeAccounts,
		receipts: options.receipts,
		code: options.code,
		codeLookupError: options.codeLookupError,
	});
	const {store, writes} = createInMemoryStore();
	const config = resolveConfig({
		accounts: options.accounts,
		signerProtocols: {privateKey},
		defaultPollingInterval: 0.001,
	});
	const executionParams = {
		provider,
		environment: 'memory',
		saveDeployments: true,
		autoImpersonate: false,
		onUnknownSigner: options.onUnknownSigner,
		promptExecutor: options.promptExecutor,
	};
	const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
	const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
	const {external: env} = await createEnvironment(config, resolvedExecutionParams, store);
	return {env, calls, writes};
}

/** A minimal artifact-shaped partial deployment; only its `abi` reaches the record. */
const partialDeployment: PartialDeployment = {
	abi: [],
	bytecode: '0x60016000',
	metadata: '{}',
	argsData: '0x',
};

/** The deployment transaction a Safe owner would have to execute out-of-band. */
function deploymentTransaction(from: `0x${string}`) {
	return {
		type: 'object' as const,
		data: {type: '0x2' as const, from, data: '0x60016000' as `0x${string}`, chainId: '0x7a69' as `0x${string}`},
	};
}

const sendMethods = ['eth_sendTransaction', 'eth_sendRawTransaction'];

/** What was written for a named deployment record (as opposed to pending-transaction state). */
function deploymentWrites(writes: {name: string; content: string}[]) {
	return writes.filter((w) => w.name === `${DEPLOYMENT_NAME}.json`);
}

describe('interactive deployment - the address comes from the pasted transaction', () => {
	/**
	 * Story 6, the ordinary case: a deploy from an unsignable `from` pauses, takes the
	 * hash of the transaction the human executed on their Safe, and records the
	 * deployment under its name at the address THAT transaction's receipt reports as
	 * created — through the same state-saving path a normal broadcast uses, with no
	 * send RPC ever attempted.
	 */
	it('saves the deployment at the receipt`s contract address, with NO send', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, calls, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const deployment = await env.broadcastDeployment(
			DEPLOYMENT_NAME,
			deploymentTransaction(env.resolveAccount('admin')),
			partialDeployment,
		);

		expect(deployment.address).toBe(DEPLOYED_ADDRESS);
		expect(deployment.transaction?.hash).toBe(PASTED_HASH);
		// saved under its name, through the normal pipeline
		expect(JSON.parse(deploymentWrites(writes)[0].content).address).toBe(DEPLOYED_ADDRESS);
		expect(env.get(DEPLOYMENT_NAME).address).toBe(DEPLOYED_ADDRESS);
		// THE POINT: nothing was ever sent
		expect(calls.map((c) => c.method).filter((m) => sendMethods.includes(m))).toEqual([]);
		// and the externally-executed transaction is still counted for gas reporting
		expect(env.network.provider.transactionHashes).toEqual([PASTED_HASH]);
	});

	/**
	 * The deterministic / factory case. The address was computed from bytecode and salt
	 * BEFORE broadcast, and the environment prefers it over the receipt's (a factory
	 * deploy's receipt names the FACTORY call, not the created contract). So the
	 * confirmation is CODE AT THAT ADDRESS, never parsing the transaction — pinned here
	 * by making the receipt report a DIFFERENT address: if the saved address followed
	 * the receipt, or the code check looked at the receipt's address, this fails.
	 */
	it('confirms a deterministic deployment by code at the EXPECTED address', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, calls, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			receipts: {[PASTED_HASH]: {contractAddress: DEPLOYED_ADDRESS}},
			code: {[EXPECTED_ADDRESS]: '0x60016000'},
		});

		const deployment = await env.broadcastDeployment(
			DEPLOYMENT_NAME,
			deploymentTransaction(env.resolveAccount('admin')),
			partialDeployment,
			{expectedAddress: EXPECTED_ADDRESS},
		);

		expect(deployment.address).toBe(EXPECTED_ADDRESS);
		expect(JSON.parse(deploymentWrites(writes)[0].content).address).toBe(EXPECTED_ADDRESS);
		// the confirmation is on-chain code at the expected address
		const codeCalls = calls.filter((c) => c.method === 'eth_getCode');
		expect(codeCalls).toHaveLength(1);
		expect((codeCalls[0].params as string[])[0]).toBe(EXPECTED_ADDRESS);
	});
});

describe('interactive deployment - a bad hash fails loudly and saves nothing', () => {
	/**
	 * The deterministic half of the failure: the pasted transaction succeeded, but it
	 * did not put code where this deployment was supposed to land. Recording it would
	 * produce a deployment record pointing at an empty address — exactly what this
	 * whole task exists to prevent.
	 */
	it('fails when there is no code at the expected address', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			// no code anywhere
		});

		const from = env.resolveAccount('admin');
		const error = await env
			.broadcastDeployment(DEPLOYMENT_NAME, deploymentTransaction(from), partialDeployment, {
				expectedAddress: EXPECTED_ADDRESS,
			})
			.then(
				() => undefined,
				(e) => e,
			);

		expect(error).toBeInstanceOf(Error);
		const message = (error as Error).message;
		expect(message).toContain(DEPLOYMENT_NAME);
		expect(message).toContain(PASTED_HASH);
		expect(message).toContain(EXPECTED_ADDRESS);
		// nothing at all was recorded: no deployment, no pending state, no gas entry
		expect(deploymentWrites(writes)).toEqual([]);
		expect(writes.filter((w) => w.name === '.pending_transactions.json')).toEqual([]);
		// not even in memory: asking for it says there is no such deployment
		expect(() => env.get(DEPLOYMENT_NAME)).toThrow(`no deployment named "${DEPLOYMENT_NAME}" found`);
		expect(env.network.provider.transactionHashes).toEqual([]);
	});

	/**
	 * The node could not ANSWER the code question. Unable to confirm is not the same as
	 * confirmed, and this whole path exists so that an unconfirmed deployment is never
	 * recorded — so an RPC failure fails the run rather than being read as "no code"
	 * (which would blame the user's hash for the node's outage) or as "assume fine"
	 * (which silently reopens the hole). The message names all three things needed to
	 * work out what happened: the deployment, the address, and the RPC error itself.
	 */
	it('fails when the node cannot answer the code lookup', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			codeLookupError: 'upstream node unavailable',
		});

		const from = env.resolveAccount('admin');
		const error = await env
			.broadcastDeployment(DEPLOYMENT_NAME, deploymentTransaction(from), partialDeployment, {
				expectedAddress: EXPECTED_ADDRESS,
			})
			.then(
				() => undefined,
				(e) => e,
			);

		expect(error).toBeInstanceOf(Error);
		const message = (error as Error).message;
		expect(message).toContain(DEPLOYMENT_NAME);
		expect(message).toContain(EXPECTED_ADDRESS);
		// the node's own error is carried through, so the outage is not misread as a bad paste
		expect(message).toContain('upstream node unavailable');
		// and nothing was recorded, exactly as with the other refusals
		expect(deploymentWrites(writes)).toEqual([]);
		expect(writes.filter((w) => w.name === '.pending_transactions.json')).toEqual([]);
		expect(() => env.get(DEPLOYMENT_NAME)).toThrow(`no deployment named "${DEPLOYMENT_NAME}" found`);
		expect(env.network.provider.transactionHashes).toEqual([]);
	});

	/**
	 * The ordinary half, shape one: the pasted transaction created no contract at all,
	 * so its receipt carries NO contract address.
	 */
	it('fails when the receipt carries no contract address', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			receipts: {[PASTED_HASH]: {contractAddress: undefined}},
		});

		const from = env.resolveAccount('admin');
		const error = await env.broadcastDeployment(DEPLOYMENT_NAME, deploymentTransaction(from), partialDeployment).then(
			() => undefined,
			(e) => e,
		);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toContain(DEPLOYMENT_NAME);
		expect((error as Error).message).toContain(PASTED_HASH);
		expect(deploymentWrites(writes)).toEqual([]);
		expect(writes.filter((w) => w.name === '.pending_transactions.json')).toEqual([]);
		expect(env.network.provider.transactionHashes).toEqual([]);
	});

	/**
	 * The ordinary half, shape two, and the one an "absent" test alone would miss: the
	 * ZERO address. It is a perfectly truthy string, so every `if (!contractAddress)`
	 * check waves it through — and mock receipts (including the shared harness's
	 * default) fall back to exactly it, which is how a wrong hash would most plausibly
	 * end up saved at `0x000...0`.
	 */
	it('fails when the receipt reports the zero address as the created contract', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			receipts: {[PASTED_HASH]: {contractAddress: ZERO_ADDRESS}},
		});

		const from = env.resolveAccount('admin');
		const error = await env.broadcastDeployment(DEPLOYMENT_NAME, deploymentTransaction(from), partialDeployment).then(
			() => undefined,
			(e) => e,
		);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toContain(DEPLOYMENT_NAME);
		expect((error as Error).message).toContain(PASTED_HASH);
		expect(deploymentWrites(writes)).toEqual([]);
		expect(writes.filter((w) => w.name === '.pending_transactions.json')).toEqual([]);
		expect(env.network.provider.transactionHashes).toEqual([]);
	});

	/**
	 * The shared receipt invariant, asserted HERE rather than inherited on trust from
	 * the execution path: a REVERTED pasted transaction cannot record a deployment
	 * either, so the deployment funnel cannot bypass the status check.
	 */
	it('fails on a reverted receipt, on the deployment path', async () => {
		const promptExecutor = createScriptedPrompt([{value: PASTED_HASH}]);
		const {env, writes} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			onUnknownSigner: 'ask',
			promptExecutor,
			receipts: {[PASTED_HASH]: {status: '0x0'}},
		});

		const from = env.resolveAccount('admin');
		const error = await env.broadcastDeployment(DEPLOYMENT_NAME, deploymentTransaction(from), partialDeployment).then(
			() => undefined,
			(e) => e,
		);

		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toContain(PASTED_HASH);
		expect(deploymentWrites(writes)).toEqual([]);
		expect(writes.filter((w) => w.name === '.pending_transactions.json')).toEqual([]);
		expect(env.network.provider.transactionHashes).toEqual([]);
	});
});

describe('interactive deployment - a normally-broadcast deployment is untouched', () => {
	/**
	 * ANTI-REGRESSION. The address invariants belong to the INTERACTIVE path only. A
	 * deterministic deploy from a signable account keeps taking its expected address on
	 * trust, exactly as before: rocketh sent that very transaction itself, so there is
	 * nothing to distrust, and adding a code check here would be a new failure mode for
	 * every existing deterministic deploy (a chain whose node lags a block, say). The
	 * absence of `eth_getCode` is the assertion.
	 */
	it('adds no code check to a deterministic deploy from a signable account', async () => {
		const promptExecutor = createScriptedPrompt([]);
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			onUnknownSigner: 'ask',
			promptExecutor,
			// deliberately NO code at the expected address
		});

		const deployment = await env.broadcastDeployment(
			DEPLOYMENT_NAME,
			deploymentTransaction(env.resolveAccount('deployer')),
			partialDeployment,
			{expectedAddress: EXPECTED_ADDRESS},
		);

		expect(deployment.address).toBe(EXPECTED_ADDRESS);
		expect(calls.filter((c) => c.method === 'eth_getCode')).toEqual([]);
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});

	/** And an ordinary deploy still records the receipt's contract address, unprompted. */
	it('records an ordinary deploy from a signable account unchanged', async () => {
		const promptExecutor = createScriptedPrompt([]);
		const {env, calls} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY},
			onUnknownSigner: 'ask',
			promptExecutor,
		});

		const deployment = await env.broadcastDeployment(
			DEPLOYMENT_NAME,
			deploymentTransaction(env.resolveAccount('deployer')),
			partialDeployment,
		);

		expect(deployment.address).toBe(DEPLOYED_ADDRESS);
		expect(deployment.transaction?.hash).toBe(SENT_TX_HASH);
		expect(calls.map((c) => c.method)).toContain('eth_sendRawTransaction');
		expect(promptExecutor.promptText).not.toHaveBeenCalled();
	});
});
