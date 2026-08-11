import {describe, it, expect} from 'vitest';
import {UnknownSignerError} from '../src/index.js';

const FROM_ADDR = '0x1111111111111111111111111111111111111111';
const TO_ADDR = '0x2222222222222222222222222222222222222222';

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

	it('renders NESTED bigints in contract args without throwing', () => {
		// Regression: the arg renderer once guarded bigints only at the TOP level, so any
		//  `uint256[]` or tuple argument (a diamondCut, a batch call) made JSON.stringify
		//  throw and the constructor produced a TypeError INSTEAD of the deferral error —
		//  replacing the message the user needs with the opaque failure this type exists
		//  to remove. Rendering must never be able to throw.
		const cases: readonly unknown[][] = [[5n], [[1n, 2n]], [{amount: 5n}], [{nested: [{deep: 7n}]}]];
		for (const args of cases) {
			const err = new UnknownSignerError({from: FROM_ADDR, contract: {method: 'batch', args}});
			expect(err).toBeInstanceOf(UnknownSignerError);
			expect(err.message).toContain('batch(');
		}
	});

	it('adds an auto-impersonation note when impersonation was attempted for this account', () => {
		// The impersonation helper deliberately SWALLOWS an unsupported/failed
		//  `hardhat_impersonateAccount`, so a user who enabled the feature against a node that
		//  does not implement it gets no signal at all. The error is where that silence is paid
		//  back: it names WHAT was tried and WHY it did not resolve the account, rather than
		//  repeating "could not sign", which the user already knew.
		const err = new UnknownSignerError({from: FROM_ADDR, to: TO_ADDR, autoImpersonation: 'attempted'});
		expect(err.message).toContain('auto-impersonation');
		expect(err.message).toContain('hardhat_impersonateAccount');
		expect(err.data.autoImpersonation).toBe('attempted');
	});

	it('adds a different note when the account was never an impersonation candidate', () => {
		// Enabled but never tried FOR THIS ACCOUNT is a different diagnosis from tried-and-
		//  refused, and it has a different fix (name the account in the config), so the two
		//  shapes must not collapse into one message.
		const err = new UnknownSignerError({from: FROM_ADDR, to: TO_ADDR, autoImpersonation: 'not-a-candidate'});
		expect(err.message).toContain('auto-impersonation');
		expect(err.message).toContain('NAMED');
		expect(err.message).not.toContain('hardhat_impersonateAccount');
	});

	it('says nothing about impersonation when the field is absent', () => {
		// The common path (auto-impersonation off) keeps EXACTLY the message it had: no new
		//  noise for the mainnet Safe user, who never asked for impersonation at all.
		const err = new UnknownSignerError({from: FROM_ADDR, to: TO_ADDR});
		expect(err.message.toLowerCase()).not.toContain('impersonat');
	});

	it('puts EVERY populated payload field in the default message', () => {
		// The unwrapped throw is the primary deferral workflow (spec story 4): a user who
		//  wrapped nothing reads this message, walks to their Safe, and executes it. A
		//  field missing here strands them, so assert each one explicitly.
		const err = new UnknownSignerError({
			from: FROM_ADDR,
			to: TO_ADDR,
			value: 1000000000000000000n,
			data: '0xdeadbeef',
			contract: {name: 'MyProxy', method: 'upgradeTo', args: ['0xabc']},
		});
		expect(err.message).toContain(FROM_ADDR);
		expect(err.message).toContain(TO_ADDR);
		expect(err.message).toContain('1000000000000000000');
		expect(err.message).toContain('0xdeadbeef');
		expect(err.message).toContain('MyProxy.upgradeTo(');
		expect(err.message).toContain('Execute the following transaction out-of-band');
	});
});
