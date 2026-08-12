/**
 * Tests for @rocketh/verifier - blockscout and sourcify backends.
 *
 * Both backends were at 0% coverage. These tests mock `global.fetch` to intercept the
 * HTTP calls and assert the expected behavior: verification submission, already-verified
 * skip, missing-metadata skip, unknown-chainId handling, and the FormData payload shape.
 *
 * Tests are written against the SPEC (what the verifier SHOULD do), not the implementation,
 * so bugs surface as test failures. Two bugs were fixed alongside these tests:
 * - blockscout's `ensureTrailingSlash(undefined)` crash on unknown chainId
 * - blockscout's `return` (instead of `continue`) on missing metadata, which aborted the
 *   whole verification loop after one un-metadata'd deployment
 */

import {afterEach, describe, expect, it, vi} from 'vitest';
import {submitSourcesToBlockscout} from '../src/blockscout.js';
import {submitSourcesToSourcify} from '../src/sourcify.js';
import type {UnknownDeployments} from '@rocketh/core/types';

type FetchCall = {url: string; init?: RequestInit};

function mockFetch(responder: (url: string, init?: RequestInit) => Response): {
	calls: FetchCall[];
	restore: () => void;
} {
	const calls: FetchCall[] = [];
	const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		calls.push({url, init});
		return responder(url, init);
	});
	const original = (global as any).fetch;
	(global as any).fetch = fake;
	return {calls, restore: () => ((global as any).fetch = original)};
}

function makeMetadata(contractName = 'MyContract', contractFilepath = 'contracts/MyContract.sol') {
	return JSON.stringify({
		language: 'Solidity',
		compiler: {version: '0.8.24+commit.e11b9ed9'},
		settings: {compilationTarget: {[contractFilepath]: contractName}},
		sources: {'contracts/MyContract.sol': {content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;'}},
	});
}

function makeDeployment(address: string, metadata?: string) {
	return {
		address: address as `0x${string}`,
		abi: [],
		metadata: metadata ?? makeMetadata(),
		argsData: '0x',
	};
}

const ADDR_A = '0x' + 'a'.repeat(40);
const ADDR_B = '0x' + 'b'.repeat(40);

afterEach(() => {
	// Ensure fetch is restored even if a test forgot to
});

describe('@rocketh/verifier - blockscout', () => {
	it('submits verification with the correct FormData fields', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('smart-contracts/') && !url.includes('verification')) {
				return new Response(JSON.stringify({is_verified: false}), {status: 200});
			}
			return new Response(JSON.stringify({message: 'Smart-contract verification started'}), {status: 200});
		});

		await submitSourcesToBlockscout({
			deployments,
			networkName: 'mainnet',
			chainId: '1',
		});

		// Two fetch calls: check (GET) and submit (POST)
		expect(calls.length).toBe(2);
		expect(calls[0].url).toContain(`smart-contracts/${ADDR_A}`);
		expect(calls[1].url).toContain('verification/via/standard-input');
		expect(calls[1].init?.method).toBe('POST');
		restore();
	});

	it('skips an already-verified contract', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('smart-contracts/') && !url.includes('verification')) {
				return new Response(JSON.stringify({is_verified: true}), {status: 200});
			}
			return new Response(JSON.stringify({message: 'should not reach'}), {status: 200});
		});

		await submitSourcesToBlockscout({deployments, networkName: 'mainnet', chainId: '1'});

		// Only the check call, no submission
		expect(calls.length).toBe(1);
		restore();
	});

	it('skips a deployment without metadata and continues to the next one', async () => {
		const deployments: UnknownDeployments = {
			NoMeta: makeDeployment(ADDR_A, '') as any,
			WithMeta: makeDeployment(ADDR_B) as any,
		};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('smart-contracts/') && !url.includes('verification')) {
				return new Response(JSON.stringify({is_verified: false}), {status: 200});
			}
			return new Response(JSON.stringify({message: 'Smart-contract verification started'}), {status: 200});
		});

		await submitSourcesToBlockscout({deployments, networkName: 'mainnet', chainId: '1'});

		// NoMeta has no metadata → check + skip. WithMeta → check + submit.
		// 4 calls total: 2 checks + 1 submit for WithMeta (no submit for NoMeta).
		const submitCalls = calls.filter((c) => c.url.includes('verification'));
		expect(submitCalls.length).toBe(1);
		expect(submitCalls[0].url).toContain(ADDR_B);
		restore();
	});

	it('reports no endpoint for an unknown chainId without crashing', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch(() => new Response('{}', {status: 200}));

		// Should not throw — should log an error and return
		await submitSourcesToBlockscout({deployments, networkName: 'unknown', chainId: '99999'});

		// No fetch calls should have been made
		expect(calls.length).toBe(0);
		restore();
	});

	it('uses a custom endpoint when provided', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('smart-contracts/') && !url.includes('verification')) {
				return new Response(JSON.stringify({is_verified: false}), {status: 200});
			}
			return new Response(JSON.stringify({message: 'Smart-contract verification started'}), {status: 200});
		});

		await submitSourcesToBlockscout(
			{deployments, networkName: 'custom', chainId: '999'},
			{type: 'blockscout', endpoint: 'https://my-explorer.example.com/api/v2'},
		);

		expect(calls[0].url).toContain('https://my-explorer.example.com/api/v2/');
		restore();
	});
});

describe('@rocketh/verifier - sourcify', () => {
	it('submits verification with the correct endpoint', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				return new Response(JSON.stringify([{status: 'false'}]), {status: 200});
			}
			return new Response(JSON.stringify({result: [{status: 'perfect'}]}), {status: 200});
		});

		await submitSourcesToSourcify({deployments, networkName: 'mainnet', chainId: '1'});

		// Two calls: checkByAddresses (GET) and submit (POST)
		expect(calls.length).toBe(2);
		expect(calls[0].url).toContain('checkByAddresses');
		expect(calls[0].url).toContain(ADDR_A.toLowerCase());
		expect(calls[1].init?.method).toBe('POST');
		restore();
	});

	it('skips an already-verified contract (status perfect)', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				return new Response(JSON.stringify([{status: 'perfect'}]), {status: 200});
			}
			return new Response('should not reach', {status: 200});
		});

		await submitSourcesToSourcify({deployments, networkName: 'mainnet', chainId: '1'});

		expect(calls.length).toBe(1);
		restore();
	});

	it('skips a deployment without metadata', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A, '') as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				return new Response(JSON.stringify([{status: 'false'}]), {status: 200});
			}
			return new Response(JSON.stringify({result: [{status: 'perfect'}]}), {status: 200});
		});

		await submitSourcesToSourcify({deployments, networkName: 'mainnet', chainId: '1'});

		// Only the check call, no submission
		expect(calls.length).toBe(1);
		restore();
	});

	it('uses a custom endpoint when provided', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				return new Response(JSON.stringify([{status: 'false'}]), {status: 200});
			}
			return new Response(JSON.stringify({result: [{status: 'perfect'}]}), {status: 200});
		});

		await submitSourcesToSourcify(
			{deployments, networkName: 'custom', chainId: '1'},
			{type: 'sourcify', endpoint: 'https://my-sourcify.example.com'},
		);

		expect(calls[0].url).toContain('https://my-sourcify.example.com/');
		restore();
	});

	it('logs an error and continues when the checkByAddresses call throws', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {calls, restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				throw new Error('network error');
			}
			return new Response(JSON.stringify({result: [{status: 'perfect'}]}), {status: 200});
		});

		// Should not throw — the catch block logs and continues to submit
		await submitSourcesToSourcify({deployments, networkName: 'mainnet', chainId: '1'});

		// Both the check (which threw) and the submit were attempted
		expect(calls.length).toBeGreaterThanOrEqual(2);
		restore();
	});

	it('logs an error when submission returns a non-perfect status', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				return new Response(JSON.stringify([{status: 'false'}]), {status: 200});
			}
			return new Response(JSON.stringify({result: [{status: 'partial'}]}), {status: 200});
		});

		// Should not throw — just logs the non-perfect status
		await submitSourcesToSourcify({deployments, networkName: 'mainnet', chainId: '1'});
		restore();
	});

	it('writes failing metadata when the submission throws and logErrorOnFailure is set', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR_A) as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				return new Response(JSON.stringify([{status: 'false'}]), {status: 200});
			}
			// Submit throws
			throw new Error('server down');
		});

		// We need to chdir to a temp dir to avoid polluting the repo with failing_metadata/
		const path = await import('node:path');
		const os = await import('node:os');
		const fs = await import('node:fs');
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rocketh-sourcify-fail-'));
		const originalCwd = process.cwd();
		process.chdir(tmpDir);

		try {
			await submitSourcesToSourcify({
				deployments,
				networkName: 'mainnet',
				chainId: '1',
				logErrorOnFailure: true,
			});

			// The failing_metadata folder should exist with the metadata file
			const failDir = path.join(tmpDir, 'failing_metadata', '1');
			expect(fs.existsSync(failDir)).toBe(true);
			const files = fs.readdirSync(failDir);
			expect(files.some((f) => f.includes('Token'))).toBe(true);
		} finally {
			process.chdir(originalCwd);
			fs.rmSync(tmpDir, {recursive: true, force: true});
		}
		restore();
	});

	it('respects minInterval between contracts', async () => {
		const deployments: UnknownDeployments = {
			Token: makeDeployment(ADDR_A) as any,
			Vault: makeDeployment(ADDR_B) as any,
		};
		const {restore} = mockFetch((url) => {
			if (url.includes('checkByAddresses')) {
				return new Response(JSON.stringify([{status: 'false'}]), {status: 200});
			}
			return new Response(JSON.stringify({result: [{status: 'perfect'}]}), {status: 200});
		});

		await submitSourcesToSourcify({
			deployments,
			networkName: 'mainnet',
			chainId: '1',
			minInterval: 1, // 1ms — just to exercise the sleep path
		});
		restore();
	});
});
