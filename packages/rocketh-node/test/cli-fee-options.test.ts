/**
 * `rocketh --gas-price`, `--max-fee-per-gas`, `--max-priority-fee-per-gas`: the run-level fee
 * defaults, in wei, for every transaction whose call states no fee option.
 *
 * hardhat-deploy v1's spellings (`--gasprice`, `--maxfee`, `--priorityfee`) are accepted as
 * aliases. Values are decimal integers in wei; anything else is refused at the boundary with a
 * message naming the flag, and so is `--gas-price` together with an EIP-1559 one. An absent flag
 * becomes NO key on the run parameters, so a run without them sends what it always did.
 */

import {describe, it, expect} from 'vitest';
import {buildCLIProgram, parseFeeOption, toExecutionParams, type RockethCLIOptions} from '../src/cli-options.js';
import {parseFeeOption as exportedParseFeeOption} from '../src/index.js';

function optionsFor(argv: string[]): RockethCLIOptions {
	const program = buildCLIProgram('0.0.0-test');
	program.exitOverride();
	program.configureOutput({writeOut: () => {}, writeErr: () => {}});
	program.parse(argv, {from: 'user'});
	return program.opts<RockethCLIOptions>();
}

function executionParamsFor(argv: string[]) {
	return toExecutionParams(optionsFor(['-e', 'memory', ...argv]));
}

describe('run-level fee options of the `rocketh` CLI', () => {
	it('reads each value on its own, in wei, as a bigint', () => {
		expect(executionParamsFor(['--gas-price', '2000000000']).gasPrice).toBe(2_000_000_000n);
		expect(executionParamsFor(['--max-fee-per-gas', '30000000000']).maxFeePerGas).toBe(30_000_000_000n);
		expect(executionParamsFor(['--max-priority-fee-per-gas', '1000000000']).maxPriorityFeePerGas).toBe(1_000_000_000n);
	});

	it('reads the two EIP-1559 values together', () => {
		const params = executionParamsFor(['--max-fee-per-gas=30', '--max-priority-fee-per-gas=7']);
		expect(params).toMatchObject({maxFeePerGas: 30n, maxPriorityFeePerGas: 7n});
		expect('gasPrice' in params).toBe(false);
	});

	it("accepts hardhat-deploy v1's spellings as aliases", () => {
		expect(executionParamsFor(['--gasprice', '5']).gasPrice).toBe(5n);
		expect(executionParamsFor(['--maxfee', '6', '--priorityfee', '7'])).toMatchObject({
			maxFeePerGas: 6n,
			maxPriorityFeePerGas: 7n,
		});
	});

	it('adds no fee key at all when none is given', () => {
		const params = executionParamsFor([]);
		expect('gasPrice' in params).toBe(false);
		expect('maxFeePerGas' in params).toBe(false);
		expect('maxPriorityFeePerGas' in params).toBe(false);
	});

	it('accepts zero, and ignores surrounding whitespace', () => {
		expect(executionParamsFor(['--gas-price', '0']).gasPrice).toBe(0n);
		expect(executionParamsFor(['--gas-price', ' 12 ']).gasPrice).toBe(12n);
	});

	it.each(['-1', '1.5', '1e9', '2gwei', '0x10', '', 'abc'])('refuses %j, naming the flag', (value) => {
		expect(() => executionParamsFor([`--max-fee-per-gas=${value}`])).toThrow(
			`invalid --max-fee-per-gas value: ${JSON.stringify(value)}. Expected a non-negative integer amount in wei, in decimal digits (for example 2000000000 for 2 gwei).`,
		);
	});

	it('refuses --gas-price together with an EIP-1559 value, naming both', () => {
		expect(() => executionParamsFor(['--gas-price', '1', '--max-fee-per-gas', '2'])).toThrow(
			'run-level fees: "gasPrice" cannot be combined with "maxFeePerGas"',
		);
		expect(() => executionParamsFor(['--gasprice', '1', '--priorityfee', '2'])).toThrow(
			'run-level fees: "gasPrice" cannot be combined with "maxPriorityFeePerGas"',
		);
	});

	it('exports the same value parser from the package root, for hardhat-deploy', () => {
		expect(exportedParseFeeOption).toBe(parseFeeOption);
		expect(parseFeeOption('--x', undefined)).toBeUndefined();
	});
});
