/**
 * Migration pairs 1 to 3: a plain deploy, linked libraries, a deterministic deploy.
 *
 * Each test runs the ROCKETH half of a pair (`deploy/<file>.ts`) and checks it did what the v1
 * half (`deploy/<file>.v1.ts`, next to it) did under hardhat-deploy v1. See `README.md`.
 */

import {describe, it, expect} from 'vitest';
import {decodeAbiParameters, getContractAddress, parseEther} from 'viem';
import type {deploy} from '@rocketh/deploy';

import {createWorld, run, runScript, sent, DEPLOYER, TOKEN_OWNER} from './harness.js';
import token from './deploy/01_token.js';
import calculator from './deploy/02_calculator.js';
import registry from './deploy/03_registry.js';
import {artifacts} from './mock-artifacts.js';

describe('migration pair 1: a plain deploy with constructor args and a named account', () => {
	it('deploys Token from `deployer`, with `tokenOwner` and the supply as constructor args', async () => {
		const {env, provider} = await run(createWorld());

		await runScript(token, env);

		const deployment = env.get('Token');
		const [owner, supply, name, symbol] = decodeAbiParameters(artifacts.Token.abi[0].inputs, deployment.argsData);
		expect(owner.toLowerCase()).toBe(TOKEN_OWNER);
		expect(supply).toBe(parseEther('1000000'));
		expect([name, symbol]).toEqual(['My Token', 'MTK']);
		expect(sent(provider).map((tx) => tx.from)).toEqual([DEPLOYER]);
	});
});

describe('migration pair 2: a deploy with linked libraries', () => {
	it('links the MathLib address into Calculator\u2019s bytecode at its link reference', async () => {
		const {env, provider} = await run(createWorld());

		await runScript(calculator, env);

		const mathLib = env.get('MathLib').address.toLowerCase();
		const [, calculatorCreation] = sent(provider);
		// the link reference is 20 bytes at byte offset 50 of the creation code
		expect(calculatorCreation.data?.slice(2 + 50 * 2, 2 + 70 * 2)).toBe(mathLib.slice(2));
		expect(env.get('Calculator').libraries).toEqual({MathLib: env.get('MathLib').address});
	});

	it('refuses `libraries` where v1 had it, inside the first object, at compile time', () => {
		/**
		 * The mechanical port that leaves `libraries` next to `args` does not compile: the
		 * construction object has no such field, the options (third argument) do.
		 */
		type Construction = Parameters<ReturnType<typeof deploy>>[1];
		const construction: Construction = {
			account: DEPLOYER,
			artifact: artifacts.Calculator,
			args: [10n],
			// @ts-expect-error `libraries` is an OPTION (the third argument), not part of the construction
			libraries: {MathLib: DEPLOYER},
		};
		expect(construction).toBeDefined();
	});
});

describe('migration pair 3: a deterministic (create2) deploy', () => {
	it('deploys Registry through the create2 factory, at the address the salt and bytecode give', async () => {
		const {env, provider} = await run(createWorld());

		await runScript(registry, env);

		const info = env.network.deterministicDeployment as {factory?: `0x${string}`; create2?: {factory: `0x${string}`}};
		const factory = (info.create2?.factory ?? info.factory) as `0x${string}`;
		expect(sent(provider).map((tx) => tx.to)).toContain(factory.toLowerCase());
		const salt = '0x0000000000000000000000000000000000000000000000000000000000000001';
		expect(env.get('Registry').address).toBe(
			getContractAddress({opcode: 'CREATE2', from: factory, salt, bytecode: artifacts.Registry.bytecode}),
		);
	});
});
