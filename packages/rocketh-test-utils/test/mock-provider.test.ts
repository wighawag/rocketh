/**
 * Tests for the mock provider helpers in @rocketh/test-utils.
 *
 * These import from `../src/index.js` directly to cover the source (tests that
 * import from the package entry point resolve to dist, which the coverage tool
 * does not attribute to src).
 */

import {describe, it, expect} from 'vitest';
import {
	createMockProvider,
	createMockArtifact,
	createExampleArtifact,
	createMockArtifactWithLibrary,
} from '../src/index.js';

describe('createMockProvider', () => {
	it('returns canned responses for default methods', async () => {
		const provider = createMockProvider() as any;
		expect(await provider.request({method: 'eth_chainId'} as any)).toBe('0x7a69');
		expect(await provider.request({method: 'eth_blockNumber'})).toBe('0x1');
		expect(await provider.request({method: 'eth_gasPrice'})).toBe('0x3b9aca00');
	}) as any;

	it('returns null and warns for unmocked methods', async () => {
		const originalWarn = console.warn;
		const warnings: string[] = [];
		console.warn = (msg: string) => warnings.push(msg);
		const provider = createMockProvider() as any;
		const result = (await provider.request({method: 'eth_unknown'})) as any;
		console.warn = originalWarn;
		expect(result).toBeNull();
		expect(warnings.some((w) => w.includes('eth_unknown'))).toBe(true);
	}) as any;

	it('calls onUnmockedMethod when provided', async () => {
		const provider = createMockProvider({
			onUnmockedMethod: (method) => `custom-${method}`,
		}) as any;
		expect(await provider.request({method: 'eth_custom'})).toBe('custom-eth_custom');
	}) as any;

	it('setResponse overrides a single method', async () => {
		const provider = createMockProvider() as any;
		provider.setResponse('eth_chainId', '0x1');
		expect(await provider.request({method: 'eth_chainId'} as any)).toBe('0x1');
	}) as any;

	it('setConfig replaces all custom responses', async () => {
		const provider = createMockProvider() as any;
		provider.setConfig({responses: {eth_chainId: '0x89'}}) as any;
		expect(await provider.request({method: 'eth_chainId'} as any)).toBe('0x89');
		// Default responses are still available for methods not in the custom config
		expect(await provider.request({method: 'eth_blockNumber'})).toBe('0x1');
	}) as any;

	it('records all requests', async () => {
		const provider = createMockProvider() as any;
		await provider.request({method: 'eth_chainId'} as any);
		(await provider.request({method: 'eth_blockNumber', params: ['latest']})) as any;
		const requests = provider.getRequests();
		expect(requests.length).toBe(2);
		expect(requests[0].method).toBe('eth_chainId');
		expect(requests[1].method).toBe('eth_blockNumber');
	}) as any;

	it('clearRequests resets the request log', async () => {
		const provider = createMockProvider() as any;
		await provider.request({method: 'eth_chainId'} as any);
		provider.clearRequests();
		expect(provider.getRequests().length).toBe(0);
	}) as any;

	it('on and removeListener are no-ops that return the provider', () => {
		const provider = createMockProvider() as any;
		const listener = () => {};
		expect(provider.on('chainChanged', listener)).toBe(provider);
		expect(provider.removeListener('chainChanged', listener)).toBe(provider);
	}) as any;

	it('eth_sendTransaction returns unique hashes per call', async () => {
		const provider = createMockProvider() as any;
		const hash1 = (await provider.request({method: 'eth_sendTransaction', params: [{}]})) as any;
		const hash2 = (await provider.request({method: 'eth_sendTransaction', params: [{}]})) as any;
		expect(hash1).not.toBe(hash2);
	}) as any;

	it('custom function responses receive params', async () => {
		const provider = createMockProvider({
			responses: {
				eth_getBalance: (params: unknown[]) => ((params?.[0] as string).startsWith('0xa') ? '0x1000' : '0x0'),
			},
		}) as any;
		expect(await provider.request({method: 'eth_getBalance', params: ['0x' + 'a'.repeat(40), 'latest']})).toBe(
			'0x1000',
		);
		expect(await provider.request({method: 'eth_getBalance', params: ['0x' + 'b'.repeat(40), 'latest']})).toBe('0x0');
	}) as any;
}) as any;

describe('createMockArtifact', () => {
	it('creates an artifact with the given name and default ABI', () => {
		const artifact = createMockArtifact('TestContract');
		expect(artifact.contractName).toBe('TestContract');
		expect(artifact.abi).toBeDefined();
		expect(artifact.bytecode).toMatch(/^0x/);
		expect(artifact.linkReferences).toEqual({}) as any;
	}) as any;

	it('creates an artifact with a custom ABI', () => {
		const customAbi = [{type: 'function', name: 'foo', inputs: [], outputs: [], stateMutability: 'view'}] as any;
		const artifact = createMockArtifact('Custom', customAbi);
		expect(artifact.abi).toBe(customAbi);
	}) as any;
}) as any;

describe('createExampleArtifact', () => {
	it('creates template 0 with getValue0 function', () => {
		const artifact = createExampleArtifact('Template0', 0);
		const fn = (artifact.abi as any[]).find((a) => a.type === 'function');
		expect(fn.name).toBe('getValue0');
	}) as any;

	it('creates template 1 with getValue1 function', () => {
		const artifact = createExampleArtifact('Template1', 1);
		const fn = (artifact.abi as any[]).find((a) => a.type === 'function');
		expect(fn.name).toBe('getValue1');
	}) as any;

	it('creates template 2 with getValue2 function', () => {
		const artifact = createExampleArtifact('Template2', 2);
		const fn = (artifact.abi as any[]).find((a) => a.type === 'function');
		expect(fn.name).toBe('getValue2');
	}) as any;

	it('each template has distinct bytecode', () => {
		const t0 = createExampleArtifact('T', 0);
		const t1 = createExampleArtifact('T', 1);
		const t2 = createExampleArtifact('T', 2);
		expect(t0.bytecode).not.toBe(t1.bytecode);
		expect(t1.bytecode).not.toBe(t2.bytecode);
		expect(t0.bytecode).not.toBe(t2.bytecode);
	}) as any;

	it('throws for an unknown template number', () => {
		expect(() => createExampleArtifact('Bad', 99)).toThrow(/no template 99/);
	}) as any;
}) as any;

describe('createMockArtifactWithLibrary', () => {
	it('creates an artifact with link references for the given library', () => {
		const artifact = createMockArtifactWithLibrary('Calculator', 'MathLib');
		expect(artifact.linkReferences).toBeDefined();
		expect(artifact.linkReferences!['contracts/libraries.sol']).toBeDefined();
		expect(artifact.linkReferences!['contracts/libraries.sol']['MathLib']).toBeDefined();
		expect(artifact.linkReferences!['contracts/libraries.sol']['MathLib'][0]).toEqual({length: 20, start: 50}) as any;
	}) as any;

	it('has bytecode long enough for the link reference fixup', () => {
		const artifact = createMockArtifactWithLibrary('Calculator', 'MathLib');
		// bytecode is 0x + 160 hex chars = 80 bytes. Link ref at start=50, length=20 needs 70 bytes.
		expect(artifact.bytecode.length).toBeGreaterThanOrEqual(2 + 70 * 2);
	}) as any;
}) as any;
