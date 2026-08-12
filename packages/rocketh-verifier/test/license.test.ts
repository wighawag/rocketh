/**
 * Tests for @rocketh/verifier - license type mapping and SPDX extraction.
 *
 * `getLicenseType` maps SPDX license identifiers to Etherscan's numeric license codes.
 * `extractLicenseFromSources` parses `// SPDX-License-Identifier: X` from Solidity source.
 * Both are pure functions, previously module-private and completely untested.
 *
 * The Etherscan license codes are documented at:
 * https://docs.etherscan.io/contract-verification/verifying-contract-code-compiler-versions
 * They are: 1=None, 2=UNLICENSED, 3=MIT, 4=GPL-2.0, 5=GPL-3.0, 6=LGPL-2.1,
 * 7=LGPL-3.0, 8=BSD-2-Clause, 9=BSD-3-Clause, 10=MPL-2.0, 11=OSL-3.0,
 * 12=Apache-2.0, 13=AGPL-3.0, 14=BUSL-1.1.
 */

import {describe, it, expect} from 'vitest';
import {getLicenseType, extractLicenseFromSources, extractOneLicenseFromSourceFile} from '../src/etherscan.js';

describe('getLicenseType - SPDX to Etherscan license code mapping', () => {
	it.each([
		['None', 1],
		['UNLICENSED', 2],
		['MIT', 3],
		['GPL-2.0', 4],
		['GPL-3.0', 5],
		['LGPL-2.1', 6],
		['LGPL-3.0', 7],
		['BSD-2-Clause', 8],
		['BSD-3-Clause', 9],
		['MPL-2.0', 10],
		['OSL-3.0', 11],
		['Apache-2.0', 12],
		['AGPL-3.0', 13],
		['BUSL-1.1', 14],
	])('maps %s to Etherscan code %i', (spdx, code) => {
		expect(getLicenseType(spdx)).toBe(code);
	});

	it('returns undefined for an unknown license', () => {
		expect(getLicenseType('GPL-4.0')).toBeUndefined();
		expect(getLicenseType('')).toBeUndefined();
		expect(getLicenseType('Custom-License')).toBeUndefined();
	});
});

describe('extractLicenseFromSources', () => {
	it('extracts a single SPDX license identifier', () => {
		const source = '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;';
		expect(extractLicenseFromSources(source)).toEqual(['MIT']);
	});

	it('extracts multiple different licenses and deduplicates', () => {
		const source = [
			'// SPDX-License-Identifier: MIT',
			'// SPDX-License-Identifier: Apache-2.0',
			'// SPDX-License-Identifier: MIT',
		].join('\n');
		const result = extractLicenseFromSources(source);
		expect(result).toEqual(['MIT', 'Apache-2.0']);
	});

	it('returns an empty array when no SPDX identifier is present', () => {
		expect(extractLicenseFromSources('pragma solidity ^0.8.0;')).toEqual([]);
		expect(extractLicenseFromSources('')).toEqual([]);
	});
});

describe('extractOneLicenseFromSourceFile', () => {
	it('returns the first license found', () => {
		const source = '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;';
		expect(extractOneLicenseFromSourceFile(source)).toBe('MIT');
	});

	it('returns undefined when no license is present', () => {
		expect(extractOneLicenseFromSourceFile('pragma solidity ^0.8.0;')).toBeUndefined();
		expect(extractOneLicenseFromSourceFile('')).toBeUndefined();
	});
});
