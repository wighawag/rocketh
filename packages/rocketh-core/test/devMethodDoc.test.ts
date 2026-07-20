import {describe, it, expect} from 'vitest';
import type {DevMethodDoc} from '../src/types.js';

describe('DevMethodDoc types', () => {
	it('should accept a `@custom:*` natspec key without casting (issue #44)', () => {
		// Assignability check: this must compile without `as` casts.
		const doc: DevMethodDoc = {
			details: 'An upgradeable implementation',
			params: {owner: 'The owner address'},
			returns: {_0: 'The stored value'},
			'@custom:oz-upgrades-unsafe-allow': 'external-library-linking',
			'@custom:another-tool': 'some-value',
		};

		expect(doc['@custom:oz-upgrades-unsafe-allow']).toBe('external-library-linking');
		expect(doc['@custom:another-tool']).toBe('some-value');
		expect(doc.details).toBe('An upgradeable implementation');
	});

	it('should still support existing details/params/returns fields', () => {
		const doc: DevMethodDoc = {
			details: 'd',
			params: {a: 'A'},
			returns: {_0: 'r', named: 'R'},
		};
		expect(doc.details).toBe('d');
		expect(doc.params?.a).toBe('A');
		expect(doc.returns?._0).toBe('r');
	});

	it('should reject non-`@custom:` unknown keys (negative type check)', () => {
		// @ts-expect-error - `randomKey` is not a permitted property on DevMethodDoc.
		const bad: DevMethodDoc = {randomKey: 'nope'};
		// runtime value still exists; the assertion is purely at the type layer.
		expect((bad as Record<string, string>).randomKey).toBe('nope');
	});
});
