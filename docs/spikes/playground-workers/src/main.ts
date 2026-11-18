/**
 * The spike: one page, two workers.
 *
 * 1. solc (soljson 0.8.30, fetched from binaries.soliditylang.org) compiles one contract in a
 *    classic worker.
 * 2. webevm runs in a module worker; the page drives it through `createWorkerNode`, whose
 *    `request` is the EIP-1193 provider rocketh is given.
 * 3. A real rocketh deploy script (src/deploy/001_deploy_greeter.ts) runs on the page through
 *    @rocketh/web, against that provider, and the deployment record it saved is printed.
 *
 * Every phase is timed and the timings are printed with the record, so the numbers in the
 * spike's README come from this page.
 */
import {createWorkerNode} from 'webevm/worker-client';
import {createVFSDeploymentStore, setupEnvironment} from '@rocketh/web';
import {privateKeyToAccount} from 'viem/accounts';
import {artifacts} from './artifacts.js';
import {CHAIN_ID, DEPLOYER_KEY, config, extensions} from './config.js';
import deployGreeter from './deploy/001_deploy_greeter.js';

const SOLJSON = 'https://binaries.soliditylang.org/bin/soljson-v0.8.30+commit.73712a01.js';

const SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Greeter {
	string public greeting;
	event GreetingChanged(address indexed by, string greeting);

	constructor(string memory initial) {
		greeting = initial;
	}

	function setGreeting(string calldata next) external {
		greeting = next;
		emit GreetingChanged(msg.sender, next);
	}
}
`;

const logElement = document.getElementById('log')!;
const recordElement = document.getElementById('record')!;
function log(line: string) {
	logElement.textContent += line + '\n';
	console.log(line);
}

type CompileReply = {id: number; output?: string; error?: string; timings?: Record<string, number>};

function compileInWorker(worker: Worker, input: object): Promise<CompileReply> {
	return new Promise((resolve) => {
		const id = Math.random();
		worker.addEventListener('message', function onMessage(event: MessageEvent<CompileReply>) {
			if (event.data.id !== id) return;
			worker.removeEventListener('message', onMessage);
			resolve(event.data);
		});
		worker.postMessage({id, soljsonURL: SOLJSON, input: JSON.stringify(input)});
	});
}

async function run() {
	const timings: Record<string, number> = {};
	const started = performance.now();

	// 1. compile
	const solcWorker = new Worker(new URL('./solc.worker.ts', import.meta.url));
	const input = {
		language: 'Solidity',
		sources: {'src/Greeter.sol': {content: SOURCE}},
		settings: {
			optimizer: {enabled: true, runs: 200},
			outputSelection: {'*': {'*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object', 'metadata']}},
		},
	};
	log('compiling src/Greeter.sol with solc 0.8.30 in a worker (first run downloads the compiler)...');
	const first = await compileInWorker(solcWorker, input);
	if (first.error) throw new Error(`solc worker: ${first.error}`);
	timings.solcLoad = first.timings?.load ?? 0;
	timings.compileFirst = first.timings?.compile ?? 0;
	const again = await compileInWorker(solcWorker, input);
	timings.compileWarm = again.timings?.compile ?? 0;

	const output = JSON.parse(first.output!);
	const errors = (output.errors ?? []).filter((e: {severity: string}) => e.severity === 'error');
	if (errors.length > 0) throw new Error(errors.map((e: {formattedMessage: string}) => e.formattedMessage).join('\n'));
	const compiled = output.contracts['src/Greeter.sol'].Greeter;
	artifacts.Greeter = {
		abi: compiled.abi,
		bytecode: `0x${compiled.evm.bytecode.object}`,
		deployedBytecode: `0x${compiled.evm.deployedBytecode.object}`,
		metadata: compiled.metadata,
		contractName: 'Greeter',
		sourceName: 'src/Greeter.sol',
	};
	log(`compiled: ${(compiled.evm.bytecode.object.length / 2) | 0} bytes of creation code`);

	// 2. the chain, in its own worker
	const t2 = performance.now();
	const nodeWorker = new Worker(new URL('./node.worker.ts', import.meta.url), {type: 'module'});
	const deployer = privateKeyToAccount(DEPLOYER_KEY).address;
	const node = await createWorkerNode({
		worker: nodeWorker,
		chainId: CHAIN_ID,
		miningConfig: {type: 'auto'},
		initialBalances: {[deployer]: 1000n * 10n ** 18n},
	});
	timings.nodeBoot = performance.now() - t2;
	log(`webevm booted in a worker (chain ${CHAIN_ID})`);
	const provider = {
		request: (args: {method: string; params?: unknown}) => node.request(args as never),
	} as never;

	// 3. the deploy script, through @rocketh/web
	const t3 = performance.now();
	const deploymentStore = createVFSDeploymentStore();
	const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(config, extensions, {deploymentStore});
	const env = await loadAndExecuteDeploymentsFromModules(
		[{id: '001_deploy_greeter.ts', module: deployGreeter as never}],
		{provider, environment: 'playground'},
	);
	timings.deploy = performance.now() - t3;
	timings.total = performance.now() - started;

	const deployment = env.get('Greeter');
	log(`deployed Greeter at ${deployment.address}`);
	const files = deploymentStore.vfs.paths();
	log(`files in the deployment store: ${files.join(', ') || '(none)'}`);
	// the record as rocketh SAVED it: the file a project would commit under deployments/
	const recordPath = files.find((path) => path.endsWith('/Greeter.json'));
	recordElement.textContent = recordPath
		? `${recordPath}\n${deploymentStore.vfs.read(recordPath)}`
		: JSON.stringify(deployment, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
	log(
		'timings (ms): ' +
			Object.entries(timings)
				.map(([k, v]) => `${k}=${v.toFixed(0)}`)
				.join(' '),
	);
	(window as unknown as {spikeResult: unknown}).spikeResult = {timings, address: deployment.address, files};
	solcWorker.terminate();
	await node.dispose();
	nodeWorker.terminate();
}

document.getElementById('run')!.addEventListener('click', () => {
	run().catch((error) => {
		log(`FAILED: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
		(window as unknown as {spikeResult: unknown}).spikeResult = {error: String(error)};
	});
});
