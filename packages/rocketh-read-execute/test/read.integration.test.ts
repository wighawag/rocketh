/**
 * Integration Tests for @rocketh/read-execute - Retry Logic
 *
 * These tests demonstrate the retry mechanism for handling AbiDecodingZeroDataError
 * when contract calls return zero data temporarily.
 */

import {describe, it, expect} from 'vitest';
import {read, readByName} from '../src/index.js';
import {createMockEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('@rocketh/read-execute - Integration Tests', () => {
	describe('Read with Retry', () => {
		it('should succeed on basic read without retry', async () => {
			/**
			 * Example: Basic read operation succeeds without retry
			 * When the contract returns valid data immediately, no retry is needed.
			 */
			const {env, provider} = createMockEnvironment();
			const _read = read(env);

			provider.setResponse('eth_call', '0x000000000000000000000000000000000000000000000000000000000000002a');

			const artifact = createMockArtifact('TestContract');
			const deployment = await env.save('TestContract', {
				address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
				...artifact,
				argsData: '0x',
			});

			const result = await _read(deployment, {
				functionName: 'getValue',
			});

			expect(result).toBe(42n);
		});

		it('should retry on AbiDecodingZeroDataError when deployment exists', async () => {
			/**
			 * Example: Reading with automatic retry on zero data error
			 * This demonstrates the retry mechanism when a contract call
			 * temporarily returns zero data.
			 */
			const {env, provider} = createMockEnvironment();
			const _read = read(env);

			let callCount = 0;
			provider.setResponse('eth_call', () => {
				callCount++;
				return callCount === 1 ? '0x' : '0x000000000000000000000000000000000000000000000000000000000000002a';
			});

			const artifact = createMockArtifact('TestContract');
			const deployment = await env.save('TestContract', {
				address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
				...artifact,
				argsData: '0x',
			});

			const result = await _read(deployment, {
				functionName: 'getValue',
			});

			expect(result).toBe(42n);
			expect(callCount).toBe(2);
		});

		it('should not retry when deployment does not exist', async () => {
			/**
			 * Example: No retry when deployment is missing
			 * The retry mechanism checks for deployment existence.
			 * If the deployment doesn't exist in the environment, the error is thrown immediately.
			 */
			const {env, provider} = createMockEnvironment();
			const _read = read(env);

			provider.setResponse('eth_call', '0x');

			const artifact = createMockArtifact('TestContract');

			await expect(
				_read(
					{address: ('0x' + 'a'.repeat(40)) as `0x${string}`, ...artifact},
					{
						functionName: 'getValue',
					},
				),
			).rejects.toThrow();
		});

		it('should throw after max retries exceeded', async () => {
			/**
			 * Example: Error thrown after max retry attempts
			 * When the contract consistently returns zero data, the retry
			 * mechanism will eventually give up after maxRetries attempts.
			 */
			const {env, provider} = createMockEnvironment();
			const _read = read(env);

			let callCount = 0;
			provider.setResponse('eth_call', () => {
				callCount++;
				return '0x';
			});

			const artifact = createMockArtifact('TestContract');
			const deployment = await env.save('TestContract', {
				address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
				...artifact,
				argsData: '0x',
			});

			await expect(
				_read(deployment, {
					functionName: 'getValue',
				}),
			).rejects.toThrow();

			expect(callCount).toBe(4);
		});

		it('should use custom retry config from environment', async () => {
			/**
			 * Example: Custom retry configuration
			 * Users can configure retry behavior globally in their config.
			 * This test demonstrates custom maxRetries value.
			 */
			const {env, provider} = createMockEnvironment();

			(env.context as any).retry = {maxRetries: 2, delay: 100};

			const _read = read(env);

			let callCount = 0;
			provider.setResponse('eth_call', () => {
				callCount++;
				return '0x';
			});

			const artifact = createMockArtifact('TestContract');
			const deployment = await env.save('TestContract', {
				address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
				...artifact,
				argsData: '0x',
			});

			await expect(
				_read(deployment, {
					functionName: 'getValue',
				}),
			).rejects.toThrow();

			expect(callCount).toBe(3);
		});

		it('should not retry on other errors', async () => {
			/**
			 * Example: Other errors don't trigger retry
			 * Only AbiDecodingZeroDataError triggers the retry mechanism.
			 * Other errors are thrown immediately.
			 */
			const {env, provider} = createMockEnvironment();
			const _read = read(env);

			provider.setResponse('eth_call', () => {
				throw new Error('Contract execution reverted');
			});

			const artifact = createMockArtifact('TestContract');
			const deployment = await env.save('TestContract', {
				address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
				...artifact,
				argsData: '0x',
			});

			await expect(
				_read(deployment, {
					functionName: 'getValue',
				}),
			).rejects.toThrow('Contract execution reverted');
		});

		it('should demonstrate readByName inherits retry logic', async () => {
			/**
			 * Example: readByName automatically inherits retry logic
			 * Since readByName calls read internally, it benefits from the same
			 * retry mechanism without any additional configuration.
			 */
			const {env, provider} = createMockEnvironment();

			let callCount = 0;
			provider.setResponse('eth_call', () => {
				callCount++;
				return callCount === 1 ? '0x' : '0x000000000000000000000000000000000000000000000000000000000000002a';
			});

			const artifact = createMockArtifact('TestContract');
			await env.save('TestContract', {
				address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
				...artifact,
				argsData: '0x',
			});

			const _readByName = readByName(env);

			const result = await _readByName('TestContract', {
				functionName: 'getValue',
			});

			expect(result).toBe(42n);
			expect(callCount).toBe(2);
		});
	});
});
