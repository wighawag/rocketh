import type {Environment, ModuleObject, UserConfig} from '@rocketh/core/types';
import {privateKey} from '@rocketh/signer';
import {createVFSDeploymentStore, createMemoryVFS, setupEnvironment, type VFS} from '@rocketh/web';
import {privateKeyToAccount} from 'viem/accounts';
import {createPlaygroundChain, type PlaygroundChain} from './chain.js';
import {captureConsole} from './console-capture.js';
import {createLogStream, type LogEntry, type LogStream} from './log-stream.js';

/** Named account -> the private key it signs with. */
export type PlaygroundAccounts = Record<string, `0x${string}`>;

export type PlaygroundExtensions = Record<string, (env: Environment<any, any, any>) => any>;

/**
 * Everything a runnable snippet needs. One of these plus a terminal is a complete widget, so a
 * caller that wants a different script supplies a different definition and reuses everything
 * else. This is the extension point the stepped tutorial will grow into: level 1 is
 * {@link greetingsRegistryPlayground}, later levels are further definitions, not further cores.
 */
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
	/**
	 * Already-imported deploy-script modules. `@rocketh/web` takes modules, not source text,
	 * so a playground's scripts are bundled at build time. That is why level 1 ships a fixed
	 * script: letting a reader edit one needs a compiler in the page, which is a later step.
	 */
	readonly modules: ModuleObject[];
};

/** A contract the run produced, with proof there is really code at its address. */
export type PlaygroundDeployment = {
	readonly name: string;
	readonly address: `0x${string}`;
	/** Runtime code size in BYTES. Zero means the address answers `0x`, which is a failed run. */
	readonly codeSize: number;
};

export type PlaygroundRunResult = {
	readonly status: 'success' | 'failure';
	readonly durationMs: number;
	readonly deployments: readonly PlaygroundDeployment[];
	/** Deployment-store paths present at the end, sorted. */
	readonly files: readonly string[];
	/** Every path written, in write order, duplicates included. This is the "watch it happen" feed. */
	readonly writes: readonly string[];
	readonly logs: readonly LogEntry[];
	/** Present only when `status` is `failure`. */
	readonly error?: string;
};

export type Playground = {
	readonly definition: PlaygroundDefinition;
	readonly logs: LogStream;
	/** The deployment store's file system, observable and snapshottable. */
	readonly vfs: VFS;
	isRunning(): boolean;
	/**
	 * Boot an EVM, execute the deploy scripts, and report what landed.
	 *
	 * Never rejects: a failed deploy is a normal outcome for a widget a reader is poking at,
	 * so it comes back as `status: 'failure'` with the error already in the log stream.
	 */
	run(): Promise<PlaygroundRunResult>;
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

	const logs = createLogStream();
	// The store is built ONCE and cleared per run, rather than rebuilt, so a UI can subscribe
	// to `vfs` at mount and keep that subscription across repeated Run presses.
	const vfs = createMemoryVFS();
	const deploymentStore = createVFSDeploymentStore(vfs);
	const config = buildUserConfig(definition);
	const initialBalance = definition.initialBalance ?? ONE_THOUSAND_ETH;

	const initialBalances: Record<string, bigint> = {};
	for (const key of Object.values(definition.accounts)) {
		initialBalances[privateKeyToAccount(key).address] = initialBalance;
	}

	let running = false;

	async function run(): Promise<PlaygroundRunResult> {
		if (running) {
			throw new Error('this playground is already running; console capture is process-global so runs are serialised');
		}
		running = true;
		const startedAt = Date.now();

		logs.clear();
		// A second Run must redeploy from scratch, not report the first run's deployments as
		// already-deployed and skip everything.
		vfs.restore({});

		const writes: string[] = [];
		const unsubscribe = vfs.subscribe((change) => {
			if (change.type === 'write') {
				writes.push(change.path);
			}
		});

		let chain: PlaygroundChain | undefined;
		const capture = captureConsole(logs);
		try {
			logs.append('playground', `booting an in-browser EVM (chain id ${definition.chainId})`);
			chain = await createPlaygroundChain({chainId: definition.chainId, initialBalances: initialBalances});

			const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, definition.extensions, {
				deploymentStore,
			});

			logs.append(
				'playground',
				`running ${definition.modules.length} deploy script${definition.modules.length === 1 ? '' : 's'}`,
			);
			const env = await loadAndExecuteDeploymentsFromModules(definition.modules, {
				provider: chain.provider,
				environment: definition.environment,
			});

			// The assertion that matters. A proxy over a missing implementation "deploys"
			// happily and then answers `0x` to every call, so a recorded address proves
			// nothing on its own; only code at that address does.
			const deployments: PlaygroundDeployment[] = [];
			for (const [name, deployment] of Object.entries(env.deployments)) {
				const code = await chain.getCode(deployment.address);
				const codeSize = Math.max(0, (code.length - 2) / 2);
				deployments.push({name, address: deployment.address, codeSize});
				if (codeSize === 0) {
					throw new Error(`${name} was recorded at ${deployment.address} but there is no code there`);
				}
			}

			const result: PlaygroundRunResult = {
				status: 'success',
				durationMs: Date.now() - startedAt,
				deployments,
				files: vfs.paths(),
				writes,
				logs: [...logs.entries()],
			};
			capture.release();
			logs.append(
				'success',
				`deployed ${deployments.length} contract${deployments.length === 1 ? '' : 's'} in ${result.durationMs}ms`,
			);
			return {...result, logs: [...logs.entries()]};
		} catch (err) {
			capture.release();
			const message = err instanceof Error ? err.message : String(err);
			logs.append('error', message);
			return {
				status: 'failure',
				durationMs: Date.now() - startedAt,
				deployments: [],
				files: vfs.paths(),
				writes,
				logs: [...logs.entries()],
				error: message,
			};
		} finally {
			capture.release();
			unsubscribe();
			await chain?.dispose();
			running = false;
		}
	}

	return {
		definition,
		logs,
		vfs,
		isRunning: () => running,
		run,
	};
}
