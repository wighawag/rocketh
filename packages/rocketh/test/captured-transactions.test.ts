import {describe, it, expect, vi} from 'vitest';
import {LOCAL_SIGNING_RPC_RESPONSES} from './support/local-signing-responses.js';

import {
	resolveConfig,
	getChainIdForEnvironment,
	resolveExecutionParams,
	createExecutor,
	loadEnvironmentFromStore,
} from '../src/executor/index.js';
import {privateKey} from '@rocketh/signer';
import type {
	CapturedTransaction,
	DeploymentStore,
	PartialDeployment,
	PromptExecutor,
	UnknownSignerPolicy,
	UserConfig,
} from '@rocketh/core/types';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

/**
 * What a run REMEMBERS of what it sent: the ordered list of transactions this run
 * broadcast, exposed on the environment the run returns.
 *
 * Capture happens at the single broadcast choke point (`broadcastTransaction`, a
 * closure inside the environment module reached only through `broadcastExecution`
 * and `broadcastDeployment`), so these tests drive it through those two public
 * funnels exactly as `unknown-signer-seam.test.ts` does. Like every suite in this
 * folder they build a REAL environment (`resolveConfig` → `getChainIdForEnvironment`
 * → `resolveExecutionParams` → `createEnvironment`) against a small local mock
 * provider and deliberately do NOT use `@rocketh/test-utils`: `rocketh` must not
 * depend on it or the nx project graph closes a cycle.
 *
 * The load-bearing promise is ORDER, and the second one is that an entry holds the
 * INTENT plus who sent it and NOTHING a consumer should not replay: no gas, no fees,
 * no nonce, no hash, no receipt, and no account name. Both are pinned here.
 */

const PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

/** An address the node lists in `eth_accounts`, CHECKSUMMED as a user would write it. */
const NODE_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`;
/** Stands in for the Safe/multisig owner: a named account the node does not hold. */
const SAFE_ADDRESS = '0x1111111111111111111111111111111111111111' as `0x${string}`;
/** Whoever pressed the button on the Safe: not the `from` rocketh asked for, by design. */
const SAFE_OWNER = '0x9999999999999999999999999999999999999999';
/** The Nick's-method relayer of the deterministic-deployment factory: never a run account. */
const FACTORY_DEPLOYER = '0x3fab184622dc19b6109349b94811493bf2a45362' as `0x${string}`;
const FACTORY_SIGNED_TX = '0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe' as `0x${string}`;
const TARGET_CONTRACT = '0x0000000000000000000000000000000000000001' as `0x${string}`;

const GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000042';
const DEPLOYED_ADDRESS = '0x0000000000000000000000000000000000000abc' as `0x${string}`;
/** What the human pastes back after executing on their Safe. */
const PASTED_HASH = '0x00000000000000000000000000000000000000000000000000000000000000aa' as `0x${string}`;

type Call = {method: string; params?: unknown};

function hashFor(index: number): `0x${string}` {
	return `0x${index.toString(16).padStart(64, '0')}` as `0x${string}`;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMockProvider(options?: {
	accounts?: string[];
	impersonate?: 'accept' | 'reject';
	/** The node refuses to accept the transaction: the send RPC throws. */
	failSend?: boolean;
	/**
	 * Milliseconds to hold a send whose transaction `data` matches the key. This is how a
	 * test forces two concurrent broadcasts to COMPLETE in a chosen order.
	 */
	sendDelaysByData?: Record<string, number>;
}): {provider: EIP1193ProviderWithoutEvents; calls: Call[]} {
	const calls: Call[] = [];
	const impersonate = options?.impersonate ?? 'accept';
	let sent = 0;
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
				case 'hardhat_impersonateAccount':
					if (impersonate === 'accept') return null;
					throw new Error('impersonation rejected by policy');
				case 'eth_signTransaction':
					return '0xf86b';
				case 'eth_sendTransaction':
				case 'eth_sendRawTransaction': {
					if (options?.failSend) {
						throw new Error('node refused the transaction');
					}
					const data = (args.params as {data?: string}[] | undefined)?.[0]?.data;
					const held = data ? options?.sendDelaysByData?.[data] : undefined;
					if (held) {
						await delay(held);
					}
					return hashFor(++sent);
				}
				case 'eth_getTransactionByHash': {
					const hash = (args.params as string[])[0];
					if (hash.toLowerCase() !== PASTED_HASH) {
						return null;
					}
					// The transaction the human executed out-of-band, made IDENTICAL to what rocketh
					//  asked for so the evidence classifier reports `direct` and nothing is confirmed
					//  interactively (that path has its own suite).
					return {
						hash,
						nonce: '0x3',
						from: SAFE_OWNER,
						to: TARGET_CONTRACT,
						input: '0xdeadbeef',
						value: '0x1f4',
						gasPrice: '0x1',
						type: '0x0',
					};
				}
				case 'eth_getTransactionReceipt': {
					const hash = (args.params as string[])[0];
					return {
						transactionHash: hash,
						blockHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
						blockNumber: '0x1',
						transactionIndex: '0x0',
						contractAddress: DEPLOYED_ADDRESS,
						status: '0x1',
						logs: [],
					};
				}
				case 'eth_blockNumber':
					return '0x1';
				default: {
					const prepared = LOCAL_SIGNING_RPC_RESPONSES[args.method];
					if (prepared) return prepared();
					throw new Error(`mock provider: unsupported method ${args.method}`);
				}
			}
		}) as EIP1193ProviderWithoutEvents['request'],
	};
	return {provider: provider as EIP1193ProviderWithoutEvents, calls};
}

function createInMemoryStore(): DeploymentStore {
	const files: Record<string, string> = {};
	return {
		listFiles: vi.fn(async () => []),
		deleteAll: vi.fn(async () => {
			for (const key of Object.keys(files)) delete files[key];
		}),
		hasFile: vi.fn(async (_folder, _env, name) => files[name] !== undefined),
		writeFile: vi.fn(async (_folder, _env, name, content) => {
			files[name] = content;
		}),
		writeFileWithChainInfo: vi.fn(async (_info, _folder, _env, name, content) => {
			files[name] = content;
		}),
		readFile: vi.fn(async (_folder, _env, name) => files[name] ?? ''),
		deleteFile: vi.fn(async (_folder, _env, name) => {
			delete files[name];
		}),
	};
}

/** What `@rocketh/web` ships: a prompt object with no text ability at all. */
function createConfirmOnlyPromptExecutor(): PromptExecutor {
	return {
		async prompt() {
			return {proceed: true};
		},
		exit() {},
	};
}

/** A prompt that answers the unknown-signer question with one scripted hash. */
function createPastingPrompt(hash: `0x${string}`): PromptExecutor {
	return {
		async prompt() {
			return {proceed: true};
		},
		async promptText() {
			return {value: hash};
		},
		exit() {},
	};
}

async function buildEnvironment(options: {
	accounts: UserConfig['accounts'];
	nodeAccounts?: string[];
	autoImpersonate?: boolean;
	impersonate?: 'accept' | 'reject';
	onUnknownSigner?: UnknownSignerPolicy;
	promptExecutor?: PromptExecutor;
	failSend?: boolean;
	sendDelaysByData?: Record<string, number>;
	/** What this run SIMULATES. Present makes it a fork run (ADR 0014). */
	fork?: string;
}) {
	const {provider, calls} = createMockProvider({
		accounts: options.nodeAccounts,
		impersonate: options.impersonate,
		failSend: options.failSend,
		sendDelaysByData: options.sendDelaysByData,
	});
	const env = await loadEnvironmentFromStore(
		{
			accounts: options.accounts,
			signerProtocols: {privateKey},
			defaultPollingInterval: 0.001,
		},
		{
			provider,
			// A FORK RUN is one attached to a node somebody else forked (ADR 0014): it is named by
			//  what it SIMULATES, while the connected node keeps reporting its own id.
			environment: options.fork ? {fork: options.fork, chainId: 1} : 'memory',
			saveDeployments: false,
			autoImpersonate: options.autoImpersonate,
			onUnknownSigner: options.onUnknownSigner,
			promptExecutor: options.promptExecutor,
		},
		createInMemoryStore(),
	);
	return {env, calls};
}

/** A minimal artifact-shaped partial deployment; nothing here reads its contents. */
const partialDeployment: PartialDeployment = {
	abi: [],
	bytecode: '0x60016000',
	metadata: '{}',
	argsData: '0x',
};

/** The keys an entry may carry, per arm. Anything else is a field a consumer might replay. */
const INTENT_KEYS = ['data', 'from', 'signability', 'to', 'type', 'value'];
const RAW_KEYS = ['from', 'raw', 'type'];

function keysOf(entry: CapturedTransaction): string[] {
	return Object.keys(entry).sort();
}

describe('captured transactions - order', () => {
	/** Nothing broadcast, nothing captured: the list exists from the start of the run. */
	it('starts empty', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}});

		expect(env.capturedTransactions).toEqual([]);
	});

	/**
	 * THE HEADLINE: a mixed run (a deploy, then an execute, then a value transfer, then the
	 * pre-signed factory relay) is remembered in the order it was broadcast, through BOTH
	 * public funnels. Order is the only promise the list makes, and it is the one every
	 * consumer rests on.
	 */
	it('records every funnel that reaches the choke point, in broadcast order', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});

		await env.broadcastDeployment(
			'MyContract',
			{type: 'object', data: {type: '0x2', from: NODE_ACCOUNT, data: '0x60016000', chainId: '0x7a69'}},
			partialDeployment,
		);
		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
		});
		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: FACTORY_DEPLOYER, value: '0x1f4', chainId: '0x7a69'},
		});
		await env.broadcastExecution({type: 'raw', from: FACTORY_DEPLOYER, raw: FACTORY_SIGNED_TX});

		expect(env.capturedTransactions).toEqual([
			{type: 'intent', from: NODE_ACCOUNT, data: '0x60016000', signability: 'node'},
			{type: 'intent', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', signability: 'node'},
			{type: 'intent', from: NODE_ACCOUNT, to: FACTORY_DEPLOYER, value: '0x1f4', signability: 'node'},
			{type: 'raw', from: FACTORY_DEPLOYER, raw: FACTORY_SIGNED_TX},
		]);
	});

	/**
	 * Capture sits on the SUCCESS path of each arm, so two broadcasts issued concurrently
	 * (a deploy script may `Promise.all` them) are recorded in the order the run OBSERVED
	 * them complete, which is all a success-path capture can honestly claim. Here the FIRST
	 * one issued is the SLOWER one, so completion order is the reverse of issue order.
	 */
	it('records concurrent broadcasts in the order the run observed them complete', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
			sendDelaysByData: {'0xaaaa': 30},
		});

		await Promise.all([
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xaaaa', chainId: '0x7a69'},
			}),
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xbbbb', chainId: '0x7a69'},
			}),
		]);

		expect(env.capturedTransactions.map((entry) => (entry.type === 'intent' ? entry.data : undefined))).toEqual([
			'0xbbbb',
			'0xaaaa',
		]);
	});

	/**
	 * The list is reachable from a caller that ran the deployment IN PROCESS: the executor
	 * returns the same environment object, with no file and no path agreed in advance.
	 */
	it('is on the environment the run returns', async () => {
		const {provider} = createMockProvider({accounts: [NODE_ACCOUNT]});
		const config = resolveConfig({
			accounts: {deployer: NODE_ACCOUNT},
			signerProtocols: {privateKey},
			defaultPollingInterval: 0.001,
		});
		const executionParams = {provider, environment: 'memory', saveDeployments: false};
		const chainId = await getChainIdForEnvironment(config, 'memory', executionParams);
		const resolvedExecutionParams = resolveExecutionParams(config, executionParams, chainId);
		const script = (async (env: {broadcastExecution: Function}) => {
			await env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
			});
		}) as any;
		script.id = 'broadcaster';

		const env = await createExecutor(
			createInMemoryStore(),
			createConfirmOnlyPromptExecutor(),
		).executeDeployScriptModules([{id: 'broadcaster', module: script}], config, resolvedExecutionParams);

		expect(env.capturedTransactions).toEqual([
			{type: 'intent', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', signability: 'node'},
		]);
	});
});

describe('captured transactions - the entry shape', () => {
	/**
	 * An INTENT entry carries the intent plus who sent it, and NOTHING else: no gas, no
	 * fees, no nonce, no hash, no receipt, no account name. Pinned as an exact key set so a
	 * fee cannot become an accidental contract later.
	 */
	it('carries exactly from, to, value, data and signability, and no account name', async () => {
		const {env} = await buildEnvironment({
			// two named accounts on ONE address: a name is a join a consumer can redo from the
			//  address, and would be ambiguous here anyway
			accounts: {deployer: NODE_ACCOUNT, admin: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});

		await env.broadcastExecution({
			type: 'object',
			data: {
				type: '0x2',
				from: NODE_ACCOUNT,
				to: TARGET_CONTRACT,
				data: '0xdeadbeef',
				value: '0x1f4',
				gas: '0x5208',
				nonce: '0x3',
				maxFeePerGas: '0x1',
				maxPriorityFeePerGas: '0x1',
				chainId: '0x7a69',
			},
		});

		const [entry] = env.capturedTransactions;
		expect(keysOf(entry)).toEqual(INTENT_KEYS);
		expect(entry).not.toHaveProperty('account');
	});

	/** A contract creation has no `to`, and the key is ABSENT rather than `undefined`. */
	it('omits `to` for a contract creation', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});

		await env.broadcastDeployment(
			'MyContract',
			{type: 'object', data: {type: '0x2', from: NODE_ACCOUNT, data: '0x60016000', chainId: '0x7a69'}},
			partialDeployment,
		);

		const [entry] = env.capturedTransactions;
		expect(keysOf(entry)).toEqual(['data', 'from', 'signability', 'type']);
		expect('to' in entry).toBe(false);
	});

	/**
	 * The deterministic-factory FUNDING transfer genuinely carries no calldata, so its entry
	 * has no `data` key at all: absent fields stay absent rather than becoming `null` or
	 * `'0x'`, which a replay would send as an empty call instead of a plain transfer.
	 */
	it('omits `data` for a value transfer that carries none', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});

		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: FACTORY_DEPLOYER, value: '0x2386f26fc10000', chainId: '0x7a69'},
		});

		const [entry] = env.capturedTransactions;
		expect(keysOf(entry)).toEqual(['from', 'signability', 'to', 'type', 'value']);
		expect('data' in entry).toBe(false);
	});

	/**
	 * `value` stays the 0x QUANTITY the choke point saw. A bigint would make the list
	 * non-serialisable by a plain `JSON.stringify`, which an in-process consumer hits long
	 * before any file exists.
	 */
	it('keeps `value` as a 0x quantity, so the list survives JSON.stringify', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});

		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, value: '0xde0b6b3a7640000', chainId: '0x7a69'},
		});

		const [entry] = env.capturedTransactions;
		expect(entry.type === 'intent' && entry.value).toBe('0xde0b6b3a7640000');
		expect(() => JSON.stringify(env.capturedTransactions)).not.toThrow();
		expect(JSON.parse(JSON.stringify(env.capturedTransactions))).toEqual(env.capturedTransactions);
	});

	/**
	 * A locally-signed (`signerOnly`) broadcast captures the INTENT rocketh composed, NOT
	 * the transaction it signed: `prepareForLocalSigning` fills nonce, gas and fees before
	 * signing, and none of that may reach the entry.
	 */
	it('captures the intent of a locally signed transaction, not what was signed', async () => {
		const {env} = await buildEnvironment({accounts: {deployer: PRIVATE_KEY}, nodeAccounts: []});
		const from = env.namedAccounts.deployer;

		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
		});

		expect(env.capturedTransactions).toEqual([
			{type: 'intent', from, to: TARGET_CONTRACT, data: '0xdeadbeef', signability: 'local'},
		]);
	});

	/**
	 * `from` is kept AS THE TRANSACTION CARRIED IT, not as the lowercased lookup key: an
	 * internal KEY normalises so lookups work, a user-facing VALUE keeps what was resolved
	 * (`CONTEXT.md`). The signability lookup still lowercases, which this proves by reading
	 * `node` off a checksummed address.
	 */
	it('keeps `from` as the transaction carried it, and still resolves signability', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT.toLowerCase()],
		});

		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
		});

		const [entry] = env.capturedTransactions;
		expect(entry.from).toBe(NODE_ACCOUNT);
		expect(entry.from).not.toBe(NODE_ACCOUNT.toLowerCase());
		expect(entry.type === 'intent' && entry.signability).toBe('node');
	});

	/**
	 * A RAW entry is captured AS ITSELF and carries `from` and `raw` and NOTHING else,
	 * `signability` INCLUDED. That absence is deliberate and load-bearing: the factory
	 * relayer is not a run account, so `addressSignability` (a Proxy) reports `unsignable`
	 * for it, and this system reads `unsignable` as _a human already sent it out of band, do
	 * not replay it_. Said of the pre-signed factory transaction it would tell every fixture
	 * consumer to skip the one entry it MUST replay on a fresh node.
	 */
	it('carries from and raw and nothing else for a pre-signed relay', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
		});
		// what a signability lookup WOULD have said about the relayer
		expect(env.addressSignability[FACTORY_DEPLOYER]).toBe('unsignable');

		await env.broadcastExecution({type: 'raw', from: FACTORY_DEPLOYER, raw: FACTORY_SIGNED_TX});

		const [entry] = env.capturedTransactions;
		expect(keysOf(entry)).toEqual(RAW_KEYS);
		expect(entry).toEqual({type: 'raw', from: FACTORY_DEPLOYER, raw: FACTORY_SIGNED_TX});
		expect(entry).not.toHaveProperty('signability');
	});
});

describe('captured transactions - which transactions become entries', () => {
	/**
	 * A DEFERRED transaction (the `throw` policy) produces NO entry. It never happened: this
	 * list is what the run DID, not what it still owes, and that boundary is what stops the
	 * feature becoming the transaction collector it replaced.
	 */
	it('captures nothing for a transaction deferred under the throw policy', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: PRIVATE_KEY, admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
			onUnknownSigner: 'throw',
		});

		await expect(
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: SAFE_ADDRESS, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
			}),
		).rejects.toThrow();

		expect(env.capturedTransactions).toEqual([]);
	});

	/**
	 * A transaction resolved through `ask` IS captured, exactly once, carrying the intent
	 * rocketh asked for and `signability: 'unsignable'`. On a real network that step is part
	 * of what the run accomplished, and `unsignable` is what tells a batch consumer a human
	 * already sent it out of band, so it is never re-proposed.
	 */
	it('captures exactly one unsignable entry for a transaction resolved through ask', async () => {
		const {env} = await buildEnvironment({
			accounts: {admin: SAFE_ADDRESS},
			nodeAccounts: [],
			autoImpersonate: false,
			onUnknownSigner: 'ask',
			promptExecutor: createPastingPrompt(PASTED_HASH),
		});

		await env.broadcastExecution({
			type: 'object',
			data: {
				type: '0x2',
				from: SAFE_ADDRESS,
				to: TARGET_CONTRACT,
				data: '0xdeadbeef',
				value: '0x1f4',
				chainId: '0x7a69',
			},
		});

		expect(env.capturedTransactions).toEqual([
			{
				type: 'intent',
				from: SAFE_ADDRESS,
				to: TARGET_CONTRACT,
				value: '0x1f4',
				data: '0xdeadbeef',
				signability: 'unsignable',
			},
		]);
	});

	/** A send the node REFUSED never happened either, so it leaves no entry. */
	it('captures nothing for a send that fails', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
			failSend: true,
		});

		await expect(
			env.broadcastExecution({
				type: 'object',
				data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
			}),
		).rejects.toThrow();

		expect(env.capturedTransactions).toEqual([]);
	});

	/** The same for a pre-signed relay the node refused. */
	it('captures nothing for a raw send that fails', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
			failSend: true,
		});

		await expect(
			env.broadcastExecution({type: 'raw', from: FACTORY_DEPLOYER, raw: FACTORY_SIGNED_TX}),
		).rejects.toThrow();

		expect(env.capturedTransactions).toEqual([]);
	});
});

describe('captured transactions - capture is unconditional', () => {
	/**
	 * Capture is NOT a fork feature: the two consumers are two RUN MODES (a fork of a real
	 * network with a Safe impersonated, and a memory node fresh from genesis), so a memory
	 * run captures exactly as a fork run does, with no flag and no fork descriptor involved.
	 */
	it.each([
		['a memory run', undefined],
		['a fork run', 'mainnet'],
	])('captures on %s', async (_label, fork) => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT},
			nodeAccounts: [NODE_ACCOUNT],
			fork,
		});
		expect(!!env.network.fork).toBe(fork !== undefined);

		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', chainId: '0x7a69'},
		});

		expect(env.capturedTransactions).toEqual([
			{type: 'intent', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xdeadbeef', signability: 'node'},
		]);
	});

	/**
	 * WHERE A BATCH HAS TO BE SPLIT, read from the list alone: an impersonated sender is one
	 * the node faked, which on a fork rehearsal is exactly what the Safe has to execute, and
	 * a node-held sender is one rocketh sent normally. A consumer segments where the field
	 * changes between consecutive entries; rocketh never has to be correct about
	 * segmentation, only honest about ordering.
	 */
	it('distinguishes an impersonated sender from a node-held one', async () => {
		const {env} = await buildEnvironment({
			accounts: {deployer: NODE_ACCOUNT, safe: SAFE_ADDRESS},
			nodeAccounts: [NODE_ACCOUNT],
			autoImpersonate: true,
			impersonate: 'accept',
		});

		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xaaaa', chainId: '0x7a69'},
		});
		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: SAFE_ADDRESS, to: TARGET_CONTRACT, data: '0xbbbb', chainId: '0x7a69'},
		});
		await env.broadcastExecution({
			type: 'object',
			data: {type: '0x2', from: NODE_ACCOUNT, to: TARGET_CONTRACT, data: '0xcccc', chainId: '0x7a69'},
		});

		expect(env.capturedTransactions.map((entry) => (entry.type === 'intent' ? entry.signability : 'raw'))).toEqual([
			'node',
			'impersonated',
			'node',
		]);
	});
});
