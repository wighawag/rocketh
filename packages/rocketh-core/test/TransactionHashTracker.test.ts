import {describe, it, expect, beforeEach, vi} from 'vitest';
import {TransactionHashTrackerProvider} from '../src/providers/TransactionHashTracker.js';
import type {EIP1193ProviderWithoutEvents} from 'eip-1193';

describe('TransactionHashTrackerProvider', () => {
	let mockProvider: EIP1193ProviderWithoutEvents;
	let tracker: TransactionHashTrackerProvider;

	beforeEach(() => {
		// Create a mock provider
		mockProvider = {
			request: vi.fn(),
		};
		tracker = new TransactionHashTrackerProvider(mockProvider);
	});

	describe('constructor', () => {
		it('should create an instance with empty transactionHashes array', () => {
			const newTracker = new TransactionHashTrackerProvider(mockProvider);
			expect(newTracker.transactionHashes).toEqual([]);
		});

		it('should store the provided provider', () => {
			const newTracker = new TransactionHashTrackerProvider(mockProvider);
			expect(newTracker).toBeDefined();
		});
	});

	describe('request method', () => {
		it('should forward non-transaction requests to the underlying provider', async () => {
			const mockResult = {result: '0x123'};
			(mockProvider.request as any).mockResolvedValue(mockResult);

			const result = await tracker.request({method: 'eth_getBalance', params: ['0x123', 'latest']});

			expect(mockProvider.request).toHaveBeenCalledWith({
				method: 'eth_getBalance',
				params: ['0x123', 'latest'],
			});
			expect(result).toEqual(mockResult);
		});

		it('should forward eth_blockNumber requests', async () => {
			const mockResult = '0x123456';
			(mockProvider.request as any).mockResolvedValue(mockResult);

			const result = await tracker.request({method: 'eth_blockNumber'});

			expect(mockProvider.request).toHaveBeenCalledWith({method: 'eth_blockNumber'});
			expect(result).toBe(mockResult);
		});

		it('should forward eth_chainId requests', async () => {
			const mockResult = '0x1';
			(mockProvider.request as any).mockResolvedValue(mockResult);

			const result = await tracker.request({method: 'eth_chainId'});

			expect(mockProvider.request).toHaveBeenCalledWith({method: 'eth_chainId'});
			expect(result).toBe(mockResult);
		});

		it('should forward eth_getBlockByNumber requests', async () => {
			const mockResult = {number: '0x1'};
			(mockProvider.request as any).mockResolvedValue(mockResult);

			const result = await tracker.request({method: 'eth_getBlockByNumber', params: ['latest', false]});

			expect(mockProvider.request).toHaveBeenCalledWith({
				method: 'eth_getBlockByNumber',
				params: ['latest', false],
			});
			expect(result).toEqual(mockResult);
		});

		it('should forward eth_call requests', async () => {
			const mockResult = '0x0000000000000000000000000000000000000000000000000000000000000001';
			(mockProvider.request as any).mockResolvedValue(mockResult);

			const result = await tracker.request({
				method: 'eth_call',
				params: [{to: '0x123'}, 'latest'],
			});

			expect(mockProvider.request).toHaveBeenCalledWith({
				method: 'eth_call',
				params: [{to: '0x123'}, 'latest'],
			});
			expect(result).toBe(mockResult);
		});

		it('should forward eth_estimateGas requests', async () => {
			const mockResult = '0x5208';
			(mockProvider.request as any).mockResolvedValue(mockResult);

			const result = await tracker.request({
				method: 'eth_estimateGas',
				params: [{to: '0x123'}],
			});

			expect(mockProvider.request).toHaveBeenCalledWith({
				method: 'eth_estimateGas',
				params: [{to: '0x123'}],
			});
			expect(result).toBe(mockResult);
		});
	});

	describe('transaction hash tracking', () => {
		it('should track eth_sendRawTransaction responses', async () => {
			const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
			(mockProvider.request as any).mockResolvedValue(mockTxHash);

			const result = await tracker.request({
				method: 'eth_sendRawTransaction',
				params: ['0x123456'],
			});

			expect(result).toBe(mockTxHash);
			expect(tracker.transactionHashes).toHaveLength(1);
			expect(tracker.transactionHashes[0]).toBe(mockTxHash);
		});

		it('should track eth_sendTransaction responses', async () => {
			const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
			(mockProvider.request as any).mockResolvedValue(mockTxHash);

			const result = await tracker.request({
				method: 'eth_sendTransaction',
				params: [{from: '0x123', to: '0x456'}],
			});

			expect(result).toBe(mockTxHash);
			expect(tracker.transactionHashes).toHaveLength(1);
			expect(tracker.transactionHashes[0]).toBe(mockTxHash);
		});

		it('should track multiple transaction hashes', async () => {
			const txHash1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
			const txHash2 = '0x2222222222222222222222222222222222222222222222222222222222222222';
			const txHash3 = '0x3333333333333333333333333333333333333333333333333333333333333333';

			(mockProvider.request as any)
				.mockResolvedValueOnce(txHash1)
				.mockResolvedValueOnce(txHash2)
				.mockResolvedValueOnce(txHash3);

			await tracker.request({method: 'eth_sendRawTransaction', params: ['0x123']});
			await tracker.request({method: 'eth_sendTransaction', params: [{from: '0x123', to: '0x456'}]});
			await tracker.request({method: 'eth_sendRawTransaction', params: ['0x789']});

			expect(tracker.transactionHashes).toHaveLength(3);
			expect(tracker.transactionHashes[0]).toBe(txHash1);
			expect(tracker.transactionHashes[1]).toBe(txHash2);
			expect(tracker.transactionHashes[2]).toBe(txHash3);
		});

		it('should maintain order of transaction hashes', async () => {
			const txHash1 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
			const txHash2 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
			const txHash3 = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

			(mockProvider.request as any)
				.mockResolvedValueOnce(txHash1)
				.mockResolvedValueOnce(txHash2)
				.mockResolvedValueOnce(txHash3);

			await tracker.request({method: 'eth_sendTransaction', params: [{from: '0x1'}]});
			await tracker.request({method: 'eth_sendRawTransaction', params: ['0x2']});
			await tracker.request({method: 'eth_sendTransaction', params: [{from: '0x3'}]});

			expect(tracker.transactionHashes[0]).toBe(txHash1);
			expect(tracker.transactionHashes[1]).toBe(txHash2);
			expect(tracker.transactionHashes[2]).toBe(txHash3);
		});

		it('should not track non-transaction requests', async () => {
			(mockProvider.request as any).mockResolvedValue('0x123456');

			await tracker.request({method: 'eth_getBalance', params: ['0x123', 'latest']});
			await tracker.request({method: 'eth_blockNumber'});
			await tracker.request({method: 'eth_chainId'});

			expect(tracker.transactionHashes).toHaveLength(0);
		});

		it('should mix tracked and non-tracked requests correctly', async () => {
			const txHash1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
			const txHash2 = '0x2222222222222222222222222222222222222222222222222222222222222222';

			(mockProvider.request as any)
				.mockResolvedValueOnce('0x123456') // eth_getBalance
				.mockResolvedValueOnce(txHash1) // eth_sendTransaction
				.mockResolvedValueOnce('0x789') // eth_blockNumber
				.mockResolvedValueOnce(txHash2) // eth_sendRawTransaction
				.mockResolvedValueOnce('0xabcdef'); // eth_chainId

			await tracker.request({method: 'eth_getBalance', params: ['0x123', 'latest']});
			await tracker.request({method: 'eth_sendTransaction', params: [{from: '0x123'}]});
			await tracker.request({method: 'eth_blockNumber'});
			await tracker.request({method: 'eth_sendRawTransaction', params: ['0x456']});
			await tracker.request({method: 'eth_chainId'});

			expect(tracker.transactionHashes).toHaveLength(2);
			expect(tracker.transactionHashes[0]).toBe(txHash1);
			expect(tracker.transactionHashes[1]).toBe(txHash2);
		});
	});

	describe('edge cases', () => {
		it('should handle empty params array', async () => {
			const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
			(mockProvider.request as any).mockResolvedValue(mockTxHash);

			const result = await tracker.request({
				method: 'eth_sendTransaction',
				params: [] as any,
			});

			expect(result).toBe(mockTxHash);
			expect(tracker.transactionHashes).toHaveLength(1);
		});

		it('should handle undefined params', async () => {
			const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
			(mockProvider.request as any).mockResolvedValue(mockTxHash);

			const result = await tracker.request({
				method: 'eth_sendRawTransaction',
				params: undefined as any,
			});

			expect(result).toBe(mockTxHash);
			expect(tracker.transactionHashes).toHaveLength(1);
		});

		it('should handle provider errors', async () => {
			const error = new Error('Provider error');
			(mockProvider.request as any).mockRejectedValue(error);

			await expect(tracker.request({method: 'eth_sendTransaction', params: [{from: '0x123'}]})).rejects.toThrow(
				'Provider error',
			);
			expect(tracker.transactionHashes).toHaveLength(0);
		});

		it('should handle provider rejections for non-transaction methods', async () => {
			const error = new Error('Network error');
			(mockProvider.request as any).mockRejectedValue(error);

			await expect(tracker.request({method: 'eth_getBalance', params: ['0x123', 'latest']})).rejects.toThrow(
				'Network error',
			);
			expect(tracker.transactionHashes).toHaveLength(0);
		});

		it('should handle null transaction hash', async () => {
			(mockProvider.request as any).mockResolvedValue(null);

			const result = await tracker.request({
				method: 'eth_sendTransaction',
				params: [{from: '0x123', to: '0x456'}],
			});

			expect(result).toBe(null);
			// Even if null, it should be tracked if the method is transaction-related
			expect(tracker.transactionHashes).toHaveLength(1);
			expect(tracker.transactionHashes[0]).toBe(null);
		});

		it('should handle invalid transaction hash format', async () => {
			const invalidHash = 'not-a-hash';
			(mockProvider.request as any).mockResolvedValue(invalidHash);

			const result = await tracker.request({
				method: 'eth_sendRawTransaction',
				params: ['0x123'],
			});

			expect(result).toBe(invalidHash);
			expect(tracker.transactionHashes).toHaveLength(1);
			expect(tracker.transactionHashes[0]).toBe(invalidHash);
		});
	});

	describe('reset and clear functionality', () => {
		it('should allow manual clearing of transactionHashes', async () => {
			const txHash1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
			const txHash2 = '0x2222222222222222222222222222222222222222222222222222222222222222';

			(mockProvider.request as any).mockResolvedValueOnce(txHash1).mockResolvedValueOnce(txHash2);

			await tracker.request({method: 'eth_sendTransaction', params: [{from: '0x123'}]});
			await tracker.request({method: 'eth_sendRawTransaction', params: ['0x456']});

			expect(tracker.transactionHashes).toHaveLength(2);

			// Manually clear
			tracker.transactionHashes = [];
			expect(tracker.transactionHashes).toHaveLength(0);
		});

		it('should continue tracking after clearing', async () => {
			const txHash1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
			const txHash2 = '0x2222222222222222222222222222222222222222222222222222222222222222';

			(mockProvider.request as any).mockResolvedValueOnce(txHash1).mockResolvedValueOnce(txHash2);

			await tracker.request({method: 'eth_sendTransaction', params: [{from: '0x123'}]});

			tracker.transactionHashes = [];

			await tracker.request({method: 'eth_sendRawTransaction', params: ['0x456']});

			expect(tracker.transactionHashes).toHaveLength(1);
			expect(tracker.transactionHashes[0]).toBe(txHash2);
		});
	});

	describe('integration scenarios', () => {
		it('should track transactions in a deployment scenario', async () => {
			const deploymentTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
			const setupTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

			(mockProvider.request as any)
				.mockResolvedValueOnce('0x1') // chainId
				.mockResolvedValueOnce('0x123') // balance
				.mockResolvedValueOnce(deploymentTxHash) // deployment
				.mockResolvedValueOnce(setupTxHash); // setup

			// Simulate a typical deployment flow
			await tracker.request({method: 'eth_chainId'});
			await tracker.request({method: 'eth_getBalance', params: ['0x123', 'latest']});
			await tracker.request({method: 'eth_sendRawTransaction', params: ['0xdeployment']});
			await tracker.request({method: 'eth_sendTransaction', params: [{from: '0x123', to: '0x456'}]});

			expect(tracker.transactionHashes).toHaveLength(2);
			expect(tracker.transactionHashes[0]).toBe(deploymentTxHash);
			expect(tracker.transactionHashes[1]).toBe(setupTxHash);
		});

		it('should handle batch of transactions', async () => {
			const txHashes = Array.from({length: 5}, (_, i) => `0x${i.toString().repeat(64)}` as `0x${string}`);

			for (const hash of txHashes) {
				(mockProvider.request as any).mockResolvedValueOnce(hash);
			}

			for (let i = 0; i < 5; i++) {
				await tracker.request({
					method: i % 2 === 0 ? 'eth_sendRawTransaction' : 'eth_sendTransaction',
					params: [`0x${i}`],
				});
			}

			expect(tracker.transactionHashes).toHaveLength(5);
			txHashes.forEach((hash, i) => {
				expect(tracker.transactionHashes[i]).toBe(hash);
			});
		});
	});
});
