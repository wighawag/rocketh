import type {Environment, ModuleObject, UnknownDeployments, UserConfig} from '@rocketh/core/types';
import {privateKey} from '@rocketh/signer';
import {createMemoryVFS, createVFSDeploymentStore, setupEnvironment, type VFS} from '@rocketh/web';
import {privateKeyToAccount} from 'viem/accounts';
import {createPlaygroundChain, type PlaygroundChain} from './chain.js';
import {captureConsole} from './console-capture.js';
import {createLogStream, type LogEntry, type LogStream} from './log-stream.js';

/** Named account -> the private key it signs with. */
export type PlaygroundAccounts = Record<string, `0x${string}`>;

export type PlaygroundExtensions = Record<string, (env: Environment<any, any, any>) => any>;

/**
 * One move in a playground.
 *
 * A step is nothing but deploy-script modules, INCLUDING the ones that only make a call
 * (writing a greeting, say). That is deliberate: a deploy script really does interact with what
 * it deployed, so keeping one mechanism means the tutorial never shows the reader a kind of
 * code that rocketh does not actually have.
 */
export type PlaygroundStep = {
	readonly id: string;
	/** Shown on the button and in the log. */
	readonly label: string;
	/** One sentence on what this step is for, shown next to it. */
	readonly description?: string;
	/**
	 * Already-imported modules. `@rocketh/web` takes `ModuleObject[]`, not source text, so a
	 * playground's scripts are bundled at build time. Letting a reader EDIT one needs a
	 * compiler in the page, which is a separate problem.
	 */
	readonly modules: ModuleObject[];
};

export type PlaygroundDefinition = {
	/**
	 * The rocketh environment name, and NOT a free choice.
	 *
	 * It must not be `memory`, `hardhat` or `default`: `resolveExecutionParams` in rocketh's
	 * executor treats those three as ephemeral and forces `saveDeployments` OFF, which would
	 * silently produce an empty deployment store and a widget with nothing to render.
	 */
	readonly environment: string;
	readonly chainId: number;
	readonly accounts: PlaygroundAccounts;
	/** Genesis balance given to every account. Defaults to 1000 ETH. */
	readonly initialBalance?: bigint;
	readonly extensions: PlaygroundExtensions;
	/** Run in order, against ONE chain and ONE store. A single-step definition is fine. */
	readonly steps: readonly PlaygroundStep[];
};

/** How a deployment compares to the way it stood after the previous step. */
export type DeploymentChange =
	/** Did not exist before this step. */
	| 'new'
	/** Existed, and now points at a different address. This is what an upgrade looks like. */
	| 'changed'
	/** Existed at this same address already. For a proxy, this is the point. */
	| 'unchanged';

/** A contract in the store, with proof there is really code at its address. */
export type PlaygroundDeployment = {
	readonly name: string;
	readonly address: `0x${string}`;
	/** Runtime code size in BYTES. Zero means the address answers `0x`, which is a failed run. */
	readonly codeSize: number;
	/** How it compares to the step before this one. */
	readonly change: DeploymentChange;
	/**
	 * 1-based step at which this address last changed (or first appeared).
	 *
	 * Carried because `change` alone is transient: it is relative to the PREVIOUS step, so the
	 * implementation reads `changed` during the upgrade step and `unchanged` immediately after,
	 * and a reader who clicks on loses the one moment that made the point. With this, the panel
	 * can keep saying that the proxy has held its address since step 1 while the implementation
	 * has only held its own since step 3, which is the entire lesson stated at any point in the
	 * tutorial rather than during a single step.
	 */
	readonly changedAtStep: number;
};

export type StepResult = {
	readonly stepId: string;
	readonly status: 'success' | 'failure';
	readonly durationMs: number;
	/** Every deployment in the store after this step, not only the ones it touched. */
	readonly deployments: readonly PlaygroundDeployment[];
	/** Deployment-store paths present after this step, sorted. */
	readonly files: readonly string[];
	/** Paths written during THIS step, in write order. */
	readonly writes: readonly string[];
	/** The whole log so far, since a tutorial reads as one transcript. */
	readonly logs: readonly LogEntry[];
	/** Present only when `status` is `failure`. */
	readonly error?: string;
};

export type StepStatus = 'pending' | 'running' | 'done' | 'failed';

export type StepState = {
	readonly step: PlaygroundStep;
	readonly status: StepStatus;
	readonly result?: StepResult;
};

export type Playground = {
	readonly definition: PlaygroundDefinition;
	readonly logs: LogStream;
	/** The deployment store's file system, observable and snapshottable. */
	readonly vfs: VFS;
	steps(): readonly StepState[];
	/** Index of the next step to run. Equals `steps().length` when the tutorial is finished. */
	nextStepIndex(): number;
	isRunning(): boolean;
	isFinished(): boolean;
	/**
	 * Run the next step against the SAME chain and store as the previous ones.
	 *
	 * Never rejects: a failed step is a normal outcome for something a reader is poking at, so
	 * it comes back as `status: 'failure'` with the error already in the log. A failed step
	 * does not advance, so pressing again retries it.
	 */
	runNextStep(): Promise<StepResult>;
	/** Throw the chain away and start from step one. */
	reset(): Promise<void>;
	dispose(): Promise<void>;
};

const ONE_THOUSAND_ETH = 10n ** 21n;

/**
 * rocketh names these three environments ephemeral and turns `saveDeployments` off for them.
 * Naming a playground after one is a silent failure (an empty store, a blank widget), so it is
 * refused loudly at construction instead.
 *
 * Source: `resolveExecutionParams`, `packages/rocketh/src/executor/index.ts`.
 */
const EPHEMERAL_ENVIRONMENT_NAMES = ['memory', 'hardhat', 'default'];

export function buildUserConfig(definition: PlaygroundDefinition): UserConfig {
	const accounts: Record<string, {default: string}> = {};
	for (const [name, key] of Object.entries(definition.accounts)) {
		// `privateKey:` is what makes this work against an execution-only node: rocketh signs
		// locally and sends a raw transaction, instead of asking the node to sign for an index
		// it would have to expose through `eth_accounts`.
		accounts[name] = {default: `privateKey:${key}`};
	}

	// Declaring the chain is not decoration. `getChainConfigFromUserConfig`
	// (packages/rocketh/src/environment/chains.ts) writes
	// `chain with id <id> has no public info` to console.ERROR for any chain it does not
	// recognise, and the playground captures the console, so an undeclared chain would paint a
	// red failure line in the middle of a successful run. The playground knows exactly what
	// chain it just booted, so it says so rather than letting rocketh guess and complain.
	const chains = {
		[definition.chainId]: {
			info: {
				id: definition.chainId,
				name: 'In-browser EVM',
				nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
				// No RPC endpoint exists: the chain lives in this tab and is reached through the
				// provider passed to the run, never over the network.
				rpcUrls: {default: {http: []}},
				testnet: true,
			},
		},
	};

	return {accounts, chains, data: {}, signerProtocols: {privateKey}} as UserConfig;
}

export function createPlayground(definition: PlaygroundDefinition): Playground {
	if (EPHEMERAL_ENVIRONMENT_NAMES.includes(definition.environment)) {
		throw new Error(
			`playground environment must not be one of ${EPHEMERAL_ENVIRONMENT_NAMES.join(', ')}: rocketh treats those as ephemeral and disables saveDeployments, so the run would record nothing. Pick any other name.`,
		);
	}
	if (definition.steps.length === 0) {
		throw new Error('a playground needs at least one step');
	}

	const logs = createLogStream();
	// Built ONCE and cleared on reset rather than rebuilt, so a UI can subscribe to `vfs` at
	// mount and keep that subscription for the whole tutorial.
	const vfs = createMemoryVFS();
	const deploymentStore = createVFSDeploymentStore(vfs);
	const config = buildUserConfig(definition);
	const initialBalance = definition.initialBalance ?? ONE_THOUSAND_ETH;

	const initialBalances: Record<string, bigint> = {};
	for (const key of Object.values(definition.accounts)) {
		initialBalances[privateKeyToAccount(key).address] = initialBalance;
	}

	const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, definition.extensions, {
		deploymentStore,
	});

	let statuses: StepStatus[] = definition.steps.map(() => 'pending');
	let results: (StepResult | undefined)[] = definition.steps.map(() => undefined);
	let running = false;
	let nextIndex = 0;
	/**
	 * The chain OUTLIVES a step. That is the whole difference between this and a one-shot run,
	 * and it is what lets step 3 upgrade the proxy that step 1 deployed instead of deploying a
	 * fresh one onto an empty chain.
	 */
	let chain: PlaygroundChain | undefined;
	/** Address per deployment name at the end of the previous step, plus when it last moved. */
	let previousAddresses = new Map<string, {address: string; changedAtStep: number}>();

	async function ensureChain(): Promise<PlaygroundChain> {
		if (!chain) {
			logs.append('playground', `booting an in-browser EVM (chain id ${definition.chainId})`);
			chain = await createPlaygroundChain({chainId: definition.chainId, initialBalances});
		}
		return chain;
	}

	async function describeDeployments(
		activeChain: PlaygroundChain,
		deployments: UnknownDeployments,
		stepNumber: number,
	): Promise<PlaygroundDeployment[]> {
		const described: PlaygroundDeployment[] = [];
		for (const [name, deployment] of Object.entries(deployments)) {
			const code = await activeChain.getCode(deployment.address);
			const codeSize = Math.max(0, (code.length - 2) / 2);
			// The assertion that matters. A proxy over a missing implementation "deploys"
			// happily and then answers `0x` to every call, so a recorded address proves
			// nothing on its own; only code at that address does.
			if (codeSize === 0) {
				throw new Error(`${name} was recorded at ${deployment.address} but there is no code there`);
			}
			const before = previousAddresses.get(name);
			const change: DeploymentChange =
				before === undefined ? 'new' : before.address === deployment.address ? 'unchanged' : 'changed';
			described.push({
				name,
				address: deployment.address,
				codeSize,
				change,
				changedAtStep: change === 'unchanged' ? (before?.changedAtStep ?? stepNumber) : stepNumber,
			});
		}
		return described;
	}

	async function runNextStep(): Promise<StepResult> {
		if (running) {
			throw new Error('this playground is already running a step; console capture is process-global');
		}
		const index = nextIndex;
		const step = definition.steps[index];
		if (!step) {
			throw new Error('every step has already run; call reset() to start again');
		}

		running = true;
		statuses[index] = 'running';
		const startedAt = Date.now();

		const writes: string[] = [];
		const unsubscribe = vfs.subscribe((change) => {
			if (change.type === 'write') {
				writes.push(change.path);
			}
		});

		const capture = captureConsole(logs);
		try {
			// Appended BEFORE the capture matters, but after `running` is set, so a UI that
			// re-renders on the log sees the step already in flight.
			const activeChain = await ensureChain();
			logs.append('step', `Step ${index + 1} of ${definition.steps.length}: ${step.label}`);

			const env = await loadAndExecuteDeploymentsFromModules(step.modules, {
				provider: activeChain.provider,
				environment: definition.environment,
			});

			const deployments = await describeDeployments(activeChain, env.deployments, index + 1);

			capture.release();
			const durationMs = Date.now() - startedAt;
			logs.append('success', `${step.label} finished in ${durationMs}ms`);

			const result: StepResult = {
				stepId: step.id,
				status: 'success',
				durationMs,
				deployments,
				files: vfs.paths(),
				writes,
				logs: [...logs.entries()],
			};
			previousAddresses = new Map(
				deployments.map((d) => [d.name, {address: d.address, changedAtStep: d.changedAtStep}]),
			);
			statuses[index] = 'done';
			results[index] = result;
			nextIndex = index + 1;
			return result;
		} catch (err) {
			capture.release();
			const message = err instanceof Error ? err.message : String(err);
			logs.append('error', message);
			const result: StepResult = {
				stepId: step.id,
				status: 'failure',
				durationMs: Date.now() - startedAt,
				deployments: [],
				files: vfs.paths(),
				writes,
				logs: [...logs.entries()],
				error: message,
			};
			// Deliberately does NOT advance: pressing the button again retries this step.
			statuses[index] = 'failed';
			results[index] = result;
			return result;
		} finally {
			capture.release();
			unsubscribe();
			running = false;
		}
	}

	async function reset(): Promise<void> {
		await chain?.dispose();
		chain = undefined;
		vfs.restore({});
		logs.clear();
		statuses = definition.steps.map(() => 'pending');
		results = definition.steps.map(() => undefined);
		previousAddresses = new Map();
		nextIndex = 0;
	}

	return {
		definition,
		logs,
		vfs,
		steps() {
			return definition.steps.map((step, index) => ({
				step,
				status: statuses[index] ?? 'pending',
				result: results[index],
			}));
		},
		nextStepIndex: () => nextIndex,
		isRunning: () => running,
		isFinished: () => nextIndex >= definition.steps.length,
		runNextStep,
		reset,
		async dispose() {
			await chain?.dispose();
			chain = undefined;
		},
	};
}
