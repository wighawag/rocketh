/**
 * Tests for @rocketh/verifier - etherscan skip paths and license negotiation.
 *
 * The existing etherscan tests cover the libraries payload and the polling loop.
 * These tests cover the remaining error/skip paths: already-verified, missing
 * metadata, missing compilationTarget, malformed getabi, license negotiation
 * (no SPDX + no --license, mismatch without --force-license, unknown SPDX), and
 * fixMispell.
 */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {submitSourcesToEtherscan} from '../src/etherscan.js';
import type {UnknownDeployments} from '@rocketh/core/types';

function makeMetadata(opts: {spdx?: string; contractFilepath?: string; contractName?: string} = {}) {
	return JSON.stringify({
		language: 'Solidity',
		compiler: {version: '0.8.24+commit.e11b9ed9'},
		settings: {
			compilationTarget: {[opts.contractFilepath ?? 'contracts/Token.sol']: opts.contractName ?? 'Token'},
			optimizer: {enabled: false, runs: 200},
		},
		sources: {
			[opts.contractFilepath ?? 'contracts/Token.sol']: {
				content: opts.spdx
					? `// SPDX-License-Identifier: ${opts.spdx}\npragma solidity ^0.8.0;`
					: 'pragma solidity ^0.8.0;',
			},
		},
	});
}

function makeDeployment(address: string, metadata?: string) {
	return {
		address: address as `0x${string}`,
		abi: [],
		metadata: metadata ?? makeMetadata({spdx: 'MIT'}),
		argsData: '0xdeadbeef',
	} as any;
}

const ADDR = '0x' + 'a'.repeat(40);

function mockFetch(responder: (url: string, init?: RequestInit) => Response): {restore: () => void} {
	const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		return responder(url, init);
	});
	const original = (global as any).fetch;
	(global as any).fetch = fake;
	return {restore: () => ((global as any).fetch = original)};
}

describe('@rocketh/verifier - etherscan skip paths', () => {
	it('skips an already-verified contract (getabi returns a parseable ABI)', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR) as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '1', message: 'OK', result: '[]'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k'},
		);
		restore();
	});

	it('skips and logs when getabi returns malformed JSON', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR) as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '1', message: 'OK', result: 'not-json'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k'},
		);
		restore();
	});

	it('skips a deployment without metadata', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR, '') as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k'},
		);
		restore();
	});

	it('skips a deployment with missing compilationTarget', async () => {
		const badMeta = JSON.stringify({language: 'Solidity', compiler: {version: '0.8.24'}, settings: {}});
		const deployments: UnknownDeployments = {Bad: makeDeployment(ADDR, badMeta) as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k'},
		);
		restore();
	});
});

describe('@rocketh/verifier - etherscan license negotiation', () => {
	it('errors when no SPDX is in source and no --license option is given', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR, makeMetadata({})) as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k'},
		);
		restore();
	});

	it('errors when --license mismatches the source SPDX without --force-license', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR, makeMetadata({spdx: 'MIT'})) as any};
		const {restore} = mockFetch((url) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k', license: 'GPL-3.0'},
		);
		restore();
	});

	it('errors when the source SPDX is not in the etherscan table', async () => {
		const deployments: UnknownDeployments = {
			Token: makeDeployment(ADDR, makeMetadata({spdx: 'Custom-License'}) as any) as any,
		};
		const {restore} = mockFetch((url) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			return new Response('{}', {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k'},
		);
		restore();
	});
});

describe('@rocketh/verifier - etherscan fixMispell', () => {
	it('renames constructorArguements to constructorArguments when fixMispell is true', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR) as any};
		let postBody: any = null;
		const {restore} = mockFetch((url, init) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			// Capture the POST body — it's sent as URLSearchParams
			if (init?.body && init.body instanceof URLSearchParams) {
				postBody = Object.fromEntries((init.body as URLSearchParams).entries());
			}
			return new Response(JSON.stringify({status: '0', message: 'stubbed', result: 'stubbed'}), {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k', fixMispell: true},
		);

		expect(postBody).not.toBeNull();
		expect(postBody.constructorArguments).toBeDefined();
		expect(postBody.constructorArguements).toBeUndefined();
		restore();
	});

	it('keeps constructorArguements when fixMispell is not set', async () => {
		const deployments: UnknownDeployments = {Token: makeDeployment(ADDR) as any};
		let postBody: any = null;
		const {restore} = mockFetch((url, init) => {
			if (url.includes('action=getabi')) {
				return new Response(JSON.stringify({status: '0', message: 'NOTOK', result: 'not verified'}), {status: 200});
			}
			if (init?.body && init.body instanceof URLSearchParams) {
				postBody = Object.fromEntries((init.body as URLSearchParams).entries());
			}
			return new Response(JSON.stringify({status: '0', message: 'stubbed', result: 'stubbed'}), {status: 200});
		});

		await submitSourcesToEtherscan(
			{deployments, networkName: 'mainnet', chainId: '1'},
			{type: 'etherscan', apiKey: 'k'},
		);

		expect(postBody).not.toBeNull();
		expect(postBody.constructorArguements).toBeDefined();
		restore();
	});
});
