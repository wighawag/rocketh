import {describe, it, expect} from 'vitest';

import {checkUpgradeIndex, replaceTemplateArgs} from '../src/utils.js';
import type {Deployment, Abi} from '@rocketh/core/types';

/**
 * `checkUpgradeIndex` and `replaceTemplateArgs` are the two pure helpers behind
 * `deployViaProxy`. `checkUpgradeIndex` decides, from an `upgradeIndex` and the
 * existing deployment's `history` / `numDeployments`, whether the proxy should skip
 * the upgrade (return an existing `DeployResult`) or proceed (return `undefined`),
 * throwing when the index is ahead of recorded history. It is consumed at
 * `src/index.ts:205-208`. `replaceTemplateArgs` expands the `{implementation}`,
 * `{admin}`, `{data}` and `{proxy}` placeholders in a proxy-constructor args template
 * into concrete values; it is the only place a custom `proxyContract.args` template
 * is interpreted.
 *
 * Both are pure and need no provider or environment, so this file is a unit test.
 */

const ABI = [] as unknown as Abi;

function deployment(fields: Partial<Deployment<Abi>> = {}): Deployment<Abi> {
	return {
		abi: ABI,
		address: '0x' + 'a'.repeat(40),
		...fields,
	} as Deployment<Abi>;
}

describe('checkUpgradeIndex', () => {
	describe('upgradeIndex undefined', () => {
		it('returns undefined (no opinion — the caller proceeds with its own logic)', () => {
			expect(checkUpgradeIndex(null, undefined)).toBeUndefined();
			expect(checkUpgradeIndex(deployment(), undefined)).toBeUndefined();
		});
	});

	describe('upgradeIndex === 0', () => {
		it('returns the existing deployment as not-newly-deployed when one exists', () => {
			const old = deployment({numDeployments: 1});
			const result = checkUpgradeIndex(old, 0);
			expect(result).toBeDefined();
			expect(result!.newlyDeployed).toBe(false);
			expect(result!.address).toBe(old.address);
		});

		it('returns undefined when there is no existing deployment', () => {
			expect(checkUpgradeIndex(null, 0)).toBeUndefined();
		});
	});

	describe('upgradeIndex === 1', () => {
		it('throws when no deployment exists yet', () => {
			expect(() => checkUpgradeIndex(null, 1)).toThrow('upgradeIndex === 1 : expects Deployments to already exists');
		});

		it('returns the existing deployment when history is non-empty', () => {
			const old = deployment({history: [{}] as any[]});
			expect(checkUpgradeIndex(old, 1)?.newlyDeployed).toBe(false);
		});

		it('returns the existing deployment when numDeployments > 1', () => {
			const old = deployment({numDeployments: 2});
			expect(checkUpgradeIndex(old, 1)?.newlyDeployed).toBe(false);
		});

		it('returns undefined (proceed with upgrade) when history is empty and numDeployments <= 1', () => {
			expect(checkUpgradeIndex(deployment({numDeployments: 1}), 1)).toBeUndefined();
			expect(checkUpgradeIndex(deployment({history: [] as any[]}), 1)).toBeUndefined();
		});
	});

	describe('upgradeIndex > 1', () => {
		it('throws when no deployment exists yet', () => {
			expect(() => checkUpgradeIndex(null, 2)).toThrow('upgradeIndex === 2 : expects Deployments to already exists');
		});

		describe('with no history, relying on numDeployments', () => {
			it('returns the existing deployment when numDeployments > upgradeIndex', () => {
				const old = deployment({numDeployments: 3});
				expect(checkUpgradeIndex(old, 2)?.newlyDeployed).toBe(false);
			});

			it('throws when numDeployments < upgradeIndex', () => {
				const old = deployment({numDeployments: 2});
				expect(() => checkUpgradeIndex(old, 3)).toThrow(
					'upgradeIndex === 3 : expects Deployments numDeployments to be at least 3',
				);
			});

			it('returns undefined when numDeployments === upgradeIndex (proceed)', () => {
				const old = deployment({numDeployments: 2});
				expect(checkUpgradeIndex(old, 2)).toBeUndefined();
			});

			it('throws when numDeployments is not greater than 1', () => {
				const old = deployment({numDeployments: 1});
				expect(() => checkUpgradeIndex(old, 2)).toThrow(
					'upgradeIndex > 1 : expects Deployments history to exists, or numDeployments to be greater than 1',
				);
			});

			it('throws when neither history nor numDeployments is present', () => {
				expect(() => checkUpgradeIndex(deployment(), 2)).toThrow(
					'upgradeIndex > 1 : expects Deployments history to exists, or numDeployments to be greater than 1',
				);
			});
		});

		describe('with history', () => {
			it('returns the existing deployment when history.length > upgradeIndex - 1', () => {
				const old = deployment({history: [{}, {}, {}] as any[]});
				expect(checkUpgradeIndex(old, 2)?.newlyDeployed).toBe(false);
			});

			it('throws when history.length < upgradeIndex - 1', () => {
				const old = deployment({history: [{}] as any[]});
				expect(() => checkUpgradeIndex(old, 3)).toThrow(
					'upgradeIndex === 3 : expects Deployments history length to be at least 2',
				);
			});

			it('returns undefined when history.length === upgradeIndex - 1 (proceed)', () => {
				const old = deployment({history: [{}] as any[]});
				expect(checkUpgradeIndex(old, 2)).toBeUndefined();
			});
		});
	});
});

describe('replaceTemplateArgs', () => {
	const ctx = {
		implementationAddress: '0x' + '1'.repeat(40),
		proxyAdmin: '0x' + '2'.repeat(40),
		data: '0xdeadbeef',
	};

	it('expands {implementation}, {admin} and {data} placeholders', () => {
		const args = replaceTemplateArgs(['{implementation}', '{admin}', '{data}'], ctx);
		expect(args).toEqual([ctx.implementationAddress, ctx.proxyAdmin, ctx.data]);
	});

	it('passes literal values through unchanged', () => {
		const args = replaceTemplateArgs(['{data}', 'literal-string', 42] as any[], ctx);
		expect(args).toEqual([ctx.data, 'literal-string', 42]);
	});

	it('expands the {proxy} placeholder when a proxy address is provided', () => {
		const proxyAddress = '0x' + '3'.repeat(40);
		const args = replaceTemplateArgs(['{proxy}'], {...ctx, proxyAddress});
		expect(args).toEqual([proxyAddress]);
	});

	it('throws on {proxy} when no proxy address was specified', () => {
		expect(() => replaceTemplateArgs(['{proxy}'], ctx)).toThrow('Expected proxy address but none was specified');
	});

	it('returns an empty array for an empty template', () => {
		expect(replaceTemplateArgs([], ctx)).toEqual([]);
	});
});
