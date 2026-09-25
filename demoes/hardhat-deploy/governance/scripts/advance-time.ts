import hre from 'hardhat';
import {loadEnvironmentFromHardhat} from '../rocketh/environment.js';

/**
 * Move the LOCAL node's clock forward and mine a block. Demo scaffolding for scenario
 * 004 (the timelock), and nothing a real chain needs.
 *
 * Why it exists: `TimelockController.isOperationReady` compares the operation's ready
 * time with `block.timestamp`, and a read sees the timestamp of the LATEST block. A
 * local node in automine mode only mines when it receives a transaction, so after the
 * `schedule()` is executed the chain's clock simply stops. Waiting 60 real seconds
 * changes nothing: the deploy script keeps reporting "scheduled and waiting" until
 * something mines a new block. On a real network blocks keep coming and you just wait.
 *
 * This bumps the clock by the given number of seconds (default 60, the demo timelock's
 * delay) and mines one block, so the operation is ready immediately.
 *
 * Usage:
 *   pnpm advance-time          # +60 seconds
 *   pnpm advance-time 120      # +120 seconds
 */
type RawProvider = {
	request(args: {method: string; params?: unknown[]}): Promise<unknown>;
};

async function main() {
	const raw = process.argv[2] ?? '60';
	const seconds = Number(raw);
	if (!Number.isInteger(seconds) || seconds < 0) {
		console.error(
			`usage: pnpm advance-time [seconds], got ${JSON.stringify(raw)}`,
		);
		process.exit(1);
	}

	const env = await loadEnvironmentFromHardhat({hre});
	// `evm_increaseTime` / `evm_mine` are node-specific methods the typed EIP-1193
	//  request union does not list, hence the narrow structural view.
	const provider = env.network.provider as unknown as RawProvider;

	await provider.request({method: 'evm_increaseTime', params: [seconds]});
	await provider.request({method: 'evm_mine', params: []});

	const block = (await provider.request({
		method: 'eth_getBlockByNumber',
		params: ['latest', false],
	})) as {number: string; timestamp: string};
	console.log(
		`Advanced the node clock by ${seconds}s and mined block ${BigInt(block.number)} (timestamp ${BigInt(block.timestamp)}).`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
