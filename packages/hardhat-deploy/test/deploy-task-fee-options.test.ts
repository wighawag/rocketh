/**
 * `npx hardhat deploy --gas-price`, `--max-fee-per-gas`, `--max-priority-fee-per-gas`: the
 * run-level fee defaults, in wei, for every transaction whose call states no fee option.
 *
 * Hardhat derives each option's flag from its camelCase name (`gasPrice` is `--gas-price`), the
 * same spellings as the `rocketh` CLI. hardhat-deploy v1's `--gasprice` / `--maxfee` /
 * `--priorityfee` are not accepted: a hardhat task option has one name and no alias.
 *
 * Covered in two steps: the options the task DECLARES, then what the task's action HANDS to
 * `loadAndExecuteDeploymentsFromFiles` (mocked so the parameters can be inspected; the value
 * parser stays the real one from `@rocketh/node`). What those parameters then do to the
 * transactions is pinned in `@rocketh/deploy` and `@rocketh/read-execute`.
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ArgumentType} from 'hardhat/types/arguments';

const captured = vi.hoisted(() => ({params: undefined as Record<string, unknown> | undefined}));

vi.mock('@rocketh/node', async (importOriginal) => {
	const original = await importOriginal<typeof import('@rocketh/node')>();
	return {
		...original,
		loadAndExecuteDeploymentsFromFiles: vi.fn(async (params: Record<string, unknown>) => {
			captured.params = params;
			return {} as never;
		}),
	};
});

vi.mock('../src/helpers.js', () => ({
	generateForkConfig: vi.fn(async () => ({
		connection: {networkConfig: {type: 'http'}},
		environment: 'sepolia',
		isFork: false,
		provider: {},
	})),
}));

const {default: hardhatPlugin} = await import('../src/index.js');
const {default: runDeployTask, resolveRunFeeOptions} = await import('../src/tasks/deploy.js');

const BASE_ARGS = {skipPrompts: true, reportGasUsed: false, noCompile: true};

async function runWith(fees: {gasPrice?: string; maxFeePerGas?: string; maxPriorityFeePerGas?: string}) {
	captured.params = undefined;
	await (runDeployTask as unknown as (args: unknown, hre: unknown) => Promise<void>)({...BASE_ARGS, ...fees}, {});
	return captured.params!;
}

describe('hardhat-deploy `deploy` task: run-level fee options', () => {
	beforeEach(() => {
		captured.params = undefined;
	});

	it('declares --gas-price, --max-fee-per-gas and --max-priority-fee-per-gas, optional strings', () => {
		const deployTask = hardhatPlugin.tasks!.find((task) => task.id.join(' ') === 'deploy')!;
		const options = (deployTask as unknown as {options: Record<string, {type: ArgumentType; defaultValue: unknown}>})
			.options;
		for (const name of ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']) {
			expect(options[name]).toMatchObject({type: ArgumentType.STRING_WITHOUT_DEFAULT, defaultValue: undefined});
		}
	});

	it('hands each value on its own to the run as a bigint in wei', async () => {
		expect((await runWith({gasPrice: '2000000000'})).gasPrice).toBe(2_000_000_000n);
		expect((await runWith({maxFeePerGas: '30'})).maxFeePerGas).toBe(30n);
		expect((await runWith({maxPriorityFeePerGas: '7'})).maxPriorityFeePerGas).toBe(7n);
	});

	it('hands the two EIP-1559 values together', async () => {
		const params = await runWith({maxFeePerGas: '30', maxPriorityFeePerGas: '7'});
		expect(params).toMatchObject({maxFeePerGas: 30n, maxPriorityFeePerGas: 7n});
		expect('gasPrice' in params).toBe(false);
	});

	it('hands no fee key at all when none is given', async () => {
		const params = await runWith({});
		expect('gasPrice' in params).toBe(false);
		expect('maxFeePerGas' in params).toBe(false);
		expect('maxPriorityFeePerGas' in params).toBe(false);
	});

	it('refuses a value that is not a non-negative integer in wei, naming the flag, before running', async () => {
		await expect(runWith({gasPrice: '2gwei'})).rejects.toThrow(
			'invalid --gas-price value: "2gwei". Expected a non-negative integer amount in wei',
		);
		expect(captured.params).toBeUndefined();
	});

	it('refuses --gas-price together with an EIP-1559 value, naming both, before running', async () => {
		await expect(runWith({gasPrice: '1', maxPriorityFeePerGas: '2'})).rejects.toThrow(
			'run-level fees: "gasPrice" cannot be combined with "maxPriorityFeePerGas"',
		);
		expect(captured.params).toBeUndefined();
	});

	it('reads values exactly as the rocketh CLI does', () => {
		expect(resolveRunFeeOptions({maxFeePerGas: ' 12 '})).toEqual({maxFeePerGas: 12n});
		expect(() => resolveRunFeeOptions({maxFeePerGas: '-1'})).toThrow('invalid --max-fee-per-gas value: "-1"');
	});
});
