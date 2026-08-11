import {describe, it, expect} from 'vitest';

import {generateDocumentationData} from '../src/index.js';
import type {Abi} from 'abitype';
import type {Artifact, Deployment} from '@rocketh/core/types';

/**
 * `generateDocumentationData` is the pure heart of `@rocketh/doc`: it takes a deployment
 * (or artifact) and produces a `DocumentationData` object by indexing the ABI by name and
 * iterating ONLY through `userdoc` entries (so an ABI member with no userdoc is invisible,
 * and a userdoc entry with no matching ABI member is skipped). It handles errors, events
 * and methods, splits `\`-delimited notices, extracts param names with a `_${index}`
 * fallback, and emits `bytes4` selectors for functions but not constructors.
 */

const ABI = [
	{
		type: 'constructor',
		inputs: [{type: 'uint256', name: 'initialValue'}],
		stateMutability: 'nonpayable',
	},
	{
		type: 'function',
		name: 'getValue',
		inputs: [],
		outputs: [{type: 'uint256', name: 'value'}],
		stateMutability: 'view',
	},
	{
		type: 'function',
		name: 'setValue',
		inputs: [{type: 'uint256', name: ''}],
		outputs: [],
		stateMutability: 'nonpayable',
	},
	{
		type: 'event',
		name: 'ValueChanged',
		inputs: [
			{type: 'address', name: 'from'},
			{type: 'uint256', name: 'newValue'},
		],
		anonymous: false,
	},
	{
		type: 'error',
		name: 'ValueTooLow',
		inputs: [{type: 'uint256', name: 'value'}],
	},
] as const satisfies Abi;

function artifact(overrides: Partial<Deployment<Abi>> = {}): Artifact<Abi> & Partial<Deployment<Abi>> {
	return {
		contractName: 'TestContract',
		abi: ABI,
		bytecode: '0x' as `0x${string}`,
		deployedBytecode: '0x' as `0x${string}`,
		linkReferences: {},
		metadata: '{}',
		address: ('0x' + 'a'.repeat(40)) as `0x${string}`,
		...overrides,
	} as any;
}

describe('generateDocumentationData - basic structure', () => {
	it('returns the name, address, abi and top-level devdoc/userdoc fields', () => {
		const data = generateDocumentationData(
			'MyContract',
			artifact({
				devdoc: {methods: {}, author: 'Alice', title: 'Test Contract'},
				userdoc: {methods: {}, notice: 'A test contract'},
			}),
		);

		expect(data.name).toBe('MyContract');
		expect(data.address).toBe('0x' + 'a'.repeat(40));
		expect(data.abi).toBe(ABI);
		expect(data.author).toBe('Alice');
		expect(data.title).toBe('Test Contract');
		expect(data.notice).toBe('A test contract');
	});

	it('returns empty arrays when no userdoc methods/events/errors are present', () => {
		const data = generateDocumentationData('Test', artifact());
		expect(data.errors).toEqual([]);
		expect(data.events).toEqual([]);
		expect(data.methods).toEqual([]);
	});
});

describe('generateDocumentationData - methods', () => {
	it('documents a function with a bytes4 selector', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {'getValue()': {notice: 'Get the current value'}}},
			}),
		);

		expect(data.methods).toHaveLength(1);
		expect(data.methods[0].type).toBe('function');
		expect(data.methods[0].name).toBe('getValue');
		expect((data.methods[0] as any).bytes4).toBeDefined();
		expect(data.methods[0].notice).toBe('Get the current value');
	});

	it('documents a constructor without a bytes4 selector', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {constructor: {notice: 'Initialize the contract'}}},
			}),
		);

		expect(data.methods).toHaveLength(1);
		expect(data.methods[0].type).toBe('constructor');
		expect((data.methods[0] as any).bytes4).toBeUndefined();
	});

	it('skips a userdoc method entry with no matching ABI member', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {'nonExistent()': {notice: 'ghost'}}},
			}),
		);

		expect(data.methods).toEqual([]);
	});

	it('uses param names from devdoc, with _${index} fallback for unnamed params', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {'setValue(uint256)': {notice: 'Set the value'}}},
				devdoc: {methods: {'setValue(uint256)': {params: {_0: 'The new value'}}}},
			}),
		);

		expect(data.methods).toHaveLength(1);
		expect(data.methods[0].params).toEqual([{name: '_0', description: 'The new value'}]);
	});

	it('includes return docs from devdoc', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {'getValue()': {notice: 'Get'}}},
				devdoc: {methods: {'getValue()': {returns: {value: 'The current value'}}}},
			}),
		);

		expect(data.methods[0].returns).toEqual([{name: 'value', description: 'The current value'}]);
	});

	it('extracts the method name from a signature with parentheses', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {'getValue()': {notice: 'x'}}},
			}),
		);

		expect(data.methods[0].name).toBe('getValue');
	});
});

describe('generateDocumentationData - events', () => {
	it('documents an event from userdoc', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {}, events: {'ValueChanged(address,uint256)': {notice: 'Emitted when value changes'}}},
			}),
		);

		expect(data.events).toHaveLength(1);
		expect(data.events[0].name).toBe('ValueChanged');
		expect(data.events[0].notice).toBe('Emitted when value changes');
	});

	it('skips a userdoc event entry with no matching ABI member', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {}, events: {'GhostEvent()': {notice: 'ghost'}}},
			}),
		);

		expect(data.events).toEqual([]);
	});

	it('includes event param docs from devdoc', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {}, events: {'ValueChanged(address,uint256)': {notice: 'x'}}},
				devdoc: {
					methods: {},
					events: {'ValueChanged(address,uint256)': {params: {from: 'The caller', newValue: 'The new value'}}},
				},
			}),
		);

		expect(data.events[0].params).toEqual([
			{name: 'from', description: 'The caller'},
			{name: 'newValue', description: 'The new value'},
		]);
	});
});

describe('generateDocumentationData - errors', () => {
	it('documents an error from userdoc and splits \\-delimited notices', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {}, errors: {'ValueTooLow(uint256)': [{notice: 'Value too low.\\Try again.'}]}},
			}),
		);

		expect(data.errors).toHaveLength(1);
		expect(data.errors[0].name).toBe('ValueTooLow');
		expect(data.errors[0].notice).toEqual(['Value too low.', 'Try again.']);
	});

	it('skips a userdoc error entry with no matching ABI member', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {}, errors: {'GhostError()': [{notice: 'ghost'}]}},
			}),
		);

		expect(data.errors).toEqual([]);
	});

	it('includes error param docs from devdoc', () => {
		const data = generateDocumentationData(
			'Test',
			artifact({
				userdoc: {methods: {}, errors: {'ValueTooLow(uint256)': [{notice: 'x'}]}},
				devdoc: {methods: {}, errors: {'ValueTooLow(uint256)': [{params: {value: 'The value that was too low'}}]}},
			}),
		);

		expect(data.errors[0].params).toEqual([{name: 'value', description: 'The value that was too low'}]);
	});
});
