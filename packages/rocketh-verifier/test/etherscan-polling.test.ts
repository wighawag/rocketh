/**
 * Tests for @rocketh/verifier - etherscan polling and submit paths.
 *
 * The etherscan verifier has a submit → poll loop with a hard-coded 10s `setTimeout`
 * between polls. These tests use `vi.useFakeTimers()` to advance the timer without
 * waiting. They cover: successful submission + polling → success, pending → retry →
 * success, and failed verification.
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {submitSourcesToEtherscan} from '../src/etherscan.js';
import type {UnknownDeployments} from '@rocketh/core/types';

function makeMetadata() {
	return JSON.stringify({
		language: 'Solidity',
		compiler: {version: '0.8.24+commit.e11b9ed9'},
		settings: {
			compilationTarget: {'contracts/Token.sol': 'Token'},
			optimizer: {enabled: false, runs: 200},
		},
		sources: {'contracts/Token.sol': {content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;'}},
	});
}

function makeDeployment(address: string) {
	return {address: address as `0x${string}`, abi: [], metadata: makeMetadata(), argsData: '0x'} as any;
}

const ADDR = '0x' + 'a'.repeat(40);

type FetchResponder = (url: string, init: RequestInit | undefined, callCount: number) => Response;

function mockFetch(responder: FetchResponder): {calls: {url: string; init?: RequestInit}[]; restore: () => void} {
	const calls: {url: string; init?: RequestInit}[] = [];
	let callCount = 0;
	const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		callCount++;
		calls.push({url, init});
		return responder(url, init, callCount);
	});
	const original = (global as any).fetch;
	(global as any).fetch = fake;
	return {calls, restore: () => ((global as any).fetch = original)};
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('@rocketh/verifier - etherscan polling', () => {
	it('polls until verification succeeds', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR)};
		let statusCallCount = 0;
		const {restore} = mockFetch((url, _init, callCount) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			if (url.includes('action=checkverifystatus')) {
				statusCallCount++;
				if (statusCallCount === 1) {
					return new Response(JSON.stringify({result: 'Pending in queue'}), {status: 200});
				}
				return new Response(JSON.stringify({status: '1', result: 'OK - Verified'}), {status: 200});
			}
			// POST to verifysourcecode
			if (callCount === 2) {
				return new Response(JSON.stringify({status: '1', result: 'test-guid'}), {status: 200});
			}
			return new Response(JSON.stringify({status: '0', message: 'unexpected'}), {status: 200});
		});

		const promise = submitSourcesToEtherscan(
			{
				deployments,
				networkName: 'mainnet',
				chainId: '1',
			},
			{type: 'etherscan', apiKey: 'test-key'},
		);

		// Advance past the 10s delay for the first poll
		await vi.advanceTimersByTimeAsync(10000);
		// Advance past the 10s delay for the second poll
		await vi.advanceTimersByTimeAsync(10000);

		await promise;
		expect(statusCallCount).toBe(2);
		restore();
	});

	it('reports failure when verification fails', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR)};
		let statusCallCount = 0;
		const {restore} = mockFetch((url, _init, callCount) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			if (url.includes('action=checkverifystatus')) {
				statusCallCount++;
				return new Response(JSON.stringify({status: '0', message: 'Fail', result: 'Fail - Unable to verify'}), {
					status: 200,
				});
			}
			if (callCount === 2) {
				return new Response(JSON.stringify({status: '1', result: 'test-guid'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		const promise = submitSourcesToEtherscan(
			{
				deployments,
				networkName: 'mainnet',
				chainId: '1',
			},
			{type: 'etherscan', apiKey: 'test-key'},
		);

		await vi.advanceTimersByTimeAsync(10000);
		await promise;

		expect(statusCallCount).toBe(1);
		restore();
	});

	it('handles a failed submission (status 0) without polling', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR)};
		let statusCallCount = 0;
		const {calls, restore} = mockFetch((url, _init, callCount) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			if (url.includes('action=checkverifystatus')) {
				statusCallCount++;
				return new Response('{}', {status: 200});
			}
			// POST returns failure
			if (callCount === 2) {
				return new Response(JSON.stringify({status: '0', message: 'error', result: 'bad code'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{
				deployments,
				networkName: 'mainnet',
				chainId: '1',
			},
			{type: 'etherscan', apiKey: 'test-key'},
		);

		// No polling should have occurred
		expect(statusCallCount).toBe(0);
		const statusUrls = calls.filter((c) => c.url.includes('checkverifystatus'));
		expect(statusUrls.length).toBe(0);
		restore();
	});

	it('handles a malformed submission response without polling', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR)};
		const {calls, restore} = mockFetch((url, _init, callCount) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			// POST returns non-JSON
			if (callCount === 2) {
				return new Response('not json', {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{
				deployments,
				networkName: 'mainnet',
				chainId: '1',
			},
			{type: 'etherscan', apiKey: 'test-key'},
		);

		const statusUrls = calls.filter((c) => c.url.includes('checkverifystatus'));
		expect(statusUrls.length).toBe(0);
		restore();
	});
});
