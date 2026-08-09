import {describe, it, expect} from 'vitest';
import {UnknownSignerError} from '../src/index.js';

describe('UnknownSignerError', () => {
	it('constructs with only {from} and exposes payload + identity', () => {
		const err = new UnknownSignerError({from: '0xaaaa'});
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(UnknownSignerError);
		expect(err.name).toBe('UnknownSignerError');
		expect(err.data.from).toBe('0xaaaa');
		expect(err.data.to).toBeUndefined();
		expect(err.data.data).toBeUndefined();
		expect(err.data.value).toBeUndefined();
		expect(err.data.contract).toBeUndefined();
		expect(err.message).toContain('0xaaaa');
	});

	it('constructs with the full payload and round-trips every field', () => {
		const data = {
			from: '0xfrom',
			to: '0xto',
			data: '0xdeadbeef',
			value: 42n,
			contract: {name: 'MyProxy', method: 'upgradeTo', args: ['0xnewImpl', 7n] as const},
		};
		const err = new UnknownSignerError(data);
		expect(err.data).toEqual(data);
		expect(err.data.contract?.name).toBe('MyProxy');
		expect(err.data.contract?.method).toBe('upgradeTo');
		expect(err.data.contract?.args).toEqual(['0xnewImpl', 7n]);
	});

	it('is catchable via instanceof after throw', () => {
		try {
			throw new UnknownSignerError({from: '0xaaaa'});
		} catch (e) {
			expect(e).toBeInstanceOf(UnknownSignerError);
			expect((e as UnknownSignerError).data.from).toBe('0xaaaa');
			expect((e as Error).name).toBe('UnknownSignerError');
		}
	});

	it('default message mentions from, to, and contract when name is present', () => {
		const err = new UnknownSignerError({
			from: '0xfrom',
			to: '0xto',
			contract: {name: 'MyProxy', method: 'upgradeTo', args: ['0xnewImpl']},
		});
		expect(err.message).toContain('0xfrom');
		expect(err.message).toContain('0xto');
		expect(err.message).toContain('MyProxy.upgradeTo');
	});

	it('default message falls back to `to` when contract.name is absent', () => {
		const err = new UnknownSignerError({
			from: '0xfrom',
			to: '0xto',
			contract: {method: 'upgradeTo', args: ['0xnewImpl']},
		});
		expect(err.message).toContain('0xfrom');
		expect(err.message).toContain('0xto.upgradeTo');
		expect(err.message).not.toContain('undefined.upgradeTo');
	});

	it('accepts a custom message override', () => {
		const err = new UnknownSignerError({from: '0xfrom'}, 'custom message');
		expect(err.message).toBe('custom message');
	});
});
