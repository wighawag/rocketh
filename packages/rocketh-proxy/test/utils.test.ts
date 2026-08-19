import {describe, it, expect} from 'vitest';

import {checkUpgradeIndex, replaceTemplateArgs} from '../src/utils.js';
import type {Deployment, Abi} from '@rocketh/core/types';

/**
 * `checkUpgradeIndex` and `replaceTemplateArgs` are the two pure helpers behind
 * `deployViaProxy`. `checkUpgradeIndex` decides, from an `upgradeIndex` and the
 * existing deployment's `numDeployments`, whether the proxy should skip the step
 * (return an existing `DeployResult`), proceed with it (return `undefined`), or throw
 * because earlier steps have not run. It is consumed at `src/index.ts:205-208`.
 *
 * `numDeployments` is the SOLE mechanism. v1 consults a `history` array first, and that
 * shape was ported here, but rocketh has never written `history`, so those branches were
 * unreachable and the tests covering them exercised dead code. Removed. `replaceTemplateArgs` expands the `{implementation}`,
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
	it('has no opinion when no upgradeIndex was given, so the caller proceeds', () => {
		expect(checkUpgradeIndex(null, undefined)).toBeUndefined();
		expect(checkUpgradeIndex(deployment(), undefined)).toBeUndefined();
	});

	/**
	 * The whole rule, in one place: `numDeployments` is how many steps of the story have
	 * run, so it is also the index of the step that is due next.
	 */
	describe('comparing steps run against the index asked for', () => {
		it('proceeds when this step is the one that is due', () => {
			// Nothing deployed yet, so step 0 is next.
			expect(checkUpgradeIndex(null, 0)).toBeUndefined();
			// Deployed once, so step 1 (the first upgrade) is next.
			expect(checkUpgradeIndex(deployment({numDeployments: 1}), 1)).toBeUndefined();
			// Deployed and upgraded once, so step 2 is next.
			expect(checkUpgradeIndex(deployment({numDeployments: 2}), 2)).toBeUndefined();
		});

		it('skips, returning the existing deployment, when this step already ran', () => {
			expect(checkUpgradeIndex(deployment({numDeployments: 1}), 0)?.newlyDeployed).toBe(false);
			expect(checkUpgradeIndex(deployment({numDeployments: 2}), 1)?.newlyDeployed).toBe(false);
			expect(checkUpgradeIndex(deployment({numDeployments: 5}), 2)?.newlyDeployed).toBe(false);
		});

		it('throws rather than apply a step whose predecessors have not run', () => {
			expect(() => checkUpgradeIndex(null, 1)).toThrow('upgradeIndex 1: this deployment has been recorded 0 time(s)');
			expect(() => checkUpgradeIndex(null, 3)).toThrow('upgradeIndex 3: this deployment has been recorded 0 time(s)');
			expect(() => checkUpgradeIndex(deployment({numDeployments: 1}), 2)).toThrow(
				'upgradeIndex 2: this deployment has been recorded 1 time(s)',
			);
		});

		it('says which step is missing, not just that something is wrong', () => {
			expect(() => checkUpgradeIndex(deployment({numDeployments: 2}), 4)).toThrow(
				'so step 2 has not run yet. Steps must run in order, so run the earlier ones first.',
			);
		});
	});

	/**
	 * A record written before `numDeployments` was persisted has no counter at all.
	 * Treating that as one step is what it is: deployed once, never upgraded. Getting
	 * this wrong would either redo the first upgrade on every run or throw on step 1
	 * for every project that predates the fix.
	 */
	it('counts a record with no numDeployments as exactly one step', () => {
		expect(checkUpgradeIndex(deployment(), 0)?.newlyDeployed).toBe(false);
		expect(checkUpgradeIndex(deployment(), 1)).toBeUndefined();
		expect(() => checkUpgradeIndex(deployment(), 2)).toThrow('has been recorded 1 time(s)');
	});

	/**
	 * `history` used to be consulted first and is gone. Anything that still carries the
	 * field, hand-written or left over from a v1 project, must be ignored rather than
	 * quietly changing the answer.
	 */
	it('ignores a leftover history field entirely', () => {
		const withHistory = deployment({history: [{}, {}, {}]} as Partial<Deployment<Abi>>);
		// v1 would have skipped here on history.length alone. The counter says step 1 is due.
		expect(checkUpgradeIndex(withHistory, 1)).toBeUndefined();
		expect(() => checkUpgradeIndex(withHistory, 2)).toThrow('has been recorded 1 time(s)');
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
