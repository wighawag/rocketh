/**
 * Integration Tests for @rocketh/verifier — linked-library payload shape.
 *
 * These tests document and lock in the fix for issue #49: the `libraries`
 * block of the Etherscan `solidity-standard-json-input` payload must be keyed
 * by the source file where each library is DEFINED (matching the Solidity
 * standard-json spec and what `@nomicfoundation/hardhat-verify` sends), not
 * by the consuming contract's `contractNamePath`.
 *
 * Scenario mirrors https://github.com/tuler/hardhat-deploy-etherscan-library:
 *   Math (library) -> Util (library, links Math) -> Greeter (contract, links Util)
 *
 * The tests mock `global.fetch` to intercept the POST payload submitted to
 * Etherscan and assert the shape of `solcInput.settings.libraries`.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {submitSourcesToEtherscan} from '../src/etherscan.js';
import {findLibrarySourcePath} from '../src/library-source.js';

type FetchCall = {url: string; init?: RequestInit};

function makeMetadata(opts: {
	contractFilepath: string;
	contractName: string;
	sources: Record<string, {content: string}>;
}) {
	return JSON.stringify({
		language: 'Solidity',
		compiler: {version: '0.8.24+commit.e11b9ed9'},
		settings: {
			compilationTarget: {[opts.contractFilepath]: opts.contractName},
			optimizer: {enabled: false, runs: 200},
		},
		sources: opts.sources,
	});
}

function mockFetch(): {calls: FetchCall[]; restore: () => void} {
	const calls: FetchCall[] = [];
	const fake = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		calls.push({url, init});

		// First call in submit(): getabi. Return "not verified" so submit proceeds.
		if (url.includes('action=getabi')) {
			return new Response(
				JSON.stringify({status: '0', message: 'NOTOK', result: 'Contract source code not verified'}),
				{
					status: 200,
				},
			);
		}

		// The POST to verifysourcecode: return a non-success so the flow exits
		// early (no polling loop) — we only care about capturing the payload.
		return new Response(JSON.stringify({status: '0', message: 'stubbed', result: 'stubbed'}), {status: 200});
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const original = (global as any).fetch;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(global as any).fetch = fake;
	return {
		calls,
		restore: () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(global as any).fetch = original;
		},
	};
}

function decodePostedSolcInput(call: FetchCall): {settings: {libraries?: Record<string, Record<string, string>>}} {
	const body = call.init?.body;
	if (!(body instanceof URLSearchParams)) {
		throw new Error('expected URLSearchParams body');
	}
	const sourceCode = body.get('sourceCode');
	if (!sourceCode) {
		throw new Error('missing sourceCode field in POST body');
	}
	return JSON.parse(sourceCode);
}

describe('@rocketh/verifier - Etherscan linked-library payload (issue #49)', () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Silence chalk-colored console noise from the verifier during tests.
		consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});
	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	describe('findLibrarySourcePath', () => {
		it('resolves the defining source via a `library <Name>` declaration in content', () => {
			const sources = {
				'contracts/Math.sol': {
					content:
						'// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nlibrary Math { function add(uint a, uint b) internal pure returns (uint) { return a + b; } }\n',
				},
				'contracts/Greeter.sol': {
					content:
						'// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "./Math.sol";\ncontract Greeter { uint x; }\n',
				},
			};
			expect(findLibrarySourcePath('Math', sources)).toBe('contracts/Math.sol');
		});

		it('prefers structured AST data when present', () => {
			const sources = {
				'src/lib/Math.sol': {
					content: 'placeholder — content should NOT be needed when AST is present',
					ast: {
						nodes: [
							{nodeType: 'PragmaDirective'},
							{nodeType: 'ContractDefinition', contractKind: 'library', name: 'Math'},
						],
					},
				},
			};
			expect(findLibrarySourcePath('Math', sources)).toBe('src/lib/Math.sol');
		});

		it('returns undefined when no source declares the library', () => {
			const sources = {
				'contracts/Greeter.sol': {content: 'contract Greeter {}'},
			};
			expect(findLibrarySourcePath('Math', sources)).toBeUndefined();
		});
	});

	describe('submitSourcesToEtherscan payload shape', () => {
		it('keys settings.libraries by the DEFINING source path, not the consuming contract', async () => {
			/**
			 * Example: Greeter links to library Util, which itself links to library Math.
			 * The payload for Greeter must place `Util` under `contracts/Util.sol`
			 * (not under `contracts/Greeter.sol`).
			 */
			const {calls, restore} = mockFetch();
			try {
				const metadata = makeMetadata({
					contractFilepath: 'contracts/Greeter.sol',
					contractName: 'Greeter',
					sources: {
						'contracts/Math.sol': {
							content:
								'// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nlibrary Math { function add(uint a, uint b) internal pure returns (uint) { return a + b; } }\n',
						},
						'contracts/Util.sol': {
							content:
								'// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "./Math.sol";\nlibrary Util { function double(uint a) internal pure returns (uint) { return Math.add(a, a); } }\n',
						},
						'contracts/Greeter.sol': {
							content:
								'// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\nimport "./Util.sol";\ncontract Greeter { function d(uint a) external pure returns (uint) { return Util.double(a); } }\n',
						},
					},
				});

				await submitSourcesToEtherscan(
					{
						chainId: '1',
						networkName: 'mainnet',
						deployments: {
							Greeter: {
								address: '0x000000000000000000000000000000000000dEaD',
								metadata,
								libraries: {
									Util: '0x1111111111111111111111111111111111111111',
								},
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
							} as any,
						},
					},
					{type: 'etherscan', apiKey: 'STUB', endpoint: 'https://api.example.invalid/api'},
				);

				const postCall = calls.find((c) => c.init?.method === 'POST');
				expect(postCall, 'expected a POST to verifysourcecode').toBeDefined();
				const solcInput = decodePostedSolcInput(postCall!);
				expect(solcInput.settings.libraries).toEqual({
					'contracts/Util.sol': {
						Util: '0x1111111111111111111111111111111111111111',
					},
				});
				// Regression guard: the OLD (buggy) shape keyed by the consuming
				// contract's `<file>:<name>` path must NOT appear.
				expect(solcInput.settings.libraries).not.toHaveProperty('contracts/Greeter.sol:Greeter');
			} finally {
				restore();
			}
		});

		it('groups multiple libraries under their respective defining source files', async () => {
			const {calls, restore} = mockFetch();
			try {
				const metadata = makeMetadata({
					contractFilepath: 'contracts/Consumer.sol',
					contractName: 'Consumer',
					sources: {
						'contracts/Math.sol': {content: 'library Math { }'},
						'contracts/Str.sol': {content: 'library Str { }'},
						'contracts/Consumer.sol': {
							content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Consumer { }\n',
						},
					},
				});

				await submitSourcesToEtherscan(
					{
						chainId: '1',
						networkName: 'mainnet',
						deployments: {
							Consumer: {
								address: '0x000000000000000000000000000000000000bEEF',
								metadata,
								libraries: {
									Math: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
									Str: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
								},
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
							} as any,
						},
					},
					{type: 'etherscan', apiKey: 'STUB', endpoint: 'https://api.example.invalid/api'},
				);

				const postCall = calls.find((c) => c.init?.method === 'POST');
				const solcInput = decodePostedSolcInput(postCall!);
				expect(solcInput.settings.libraries).toEqual({
					'contracts/Math.sol': {Math: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
					'contracts/Str.sol': {Str: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'},
				});
			} finally {
				restore();
			}
		});

		it('omits settings.libraries entirely when the deployment has no linked libraries', async () => {
			const {calls, restore} = mockFetch();
			try {
				const metadata = makeMetadata({
					contractFilepath: 'contracts/Plain.sol',
					contractName: 'Plain',
					sources: {
						'contracts/Plain.sol': {
							content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Plain { }\n',
						},
					},
				});

				await submitSourcesToEtherscan(
					{
						chainId: '1',
						networkName: 'mainnet',
						deployments: {
							Plain: {
								address: '0x000000000000000000000000000000000000cAFE',
								metadata,
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
							} as any,
						},
					},
					{type: 'etherscan', apiKey: 'STUB', endpoint: 'https://api.example.invalid/api'},
				);

				const postCall = calls.find((c) => c.init?.method === 'POST');
				const solcInput = decodePostedSolcInput(postCall!);
				expect(solcInput.settings.libraries).toBeUndefined();
			} finally {
				restore();
			}
		});

		it('reports a clear error (and does not POST) when a linked library cannot be resolved', async () => {
			const {calls, restore} = mockFetch();
			const errorSpy = vi.spyOn(console, 'log');
			try {
				const metadata = makeMetadata({
					contractFilepath: 'contracts/Greeter.sol',
					contractName: 'Greeter',
					sources: {
						// Note: no source declaring `library Util` — resolution must fail.
						'contracts/Greeter.sol': {
							content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Greeter { }\n',
						},
					},
				});

				await submitSourcesToEtherscan(
					{
						chainId: '1',
						networkName: 'mainnet',
						deployments: {
							Greeter: {
								address: '0x000000000000000000000000000000000000dEaD',
								metadata,
								libraries: {
									Util: '0x1111111111111111111111111111111111111111',
								},
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
							} as any,
						},
					},
					{type: 'etherscan', apiKey: 'STUB', endpoint: 'https://api.example.invalid/api'},
				);

				expect(
					calls.some((c) => c.init?.method === 'POST'),
					'must not POST a malformed payload',
				).toBe(false);

				const loggedMessage = errorSpy.mock.calls
					.map((args) => args.map(String).join(' '))
					.find((line) => line.includes('Util'));
				expect(loggedMessage, 'expected a clear error mentioning the unresolved library').toBeDefined();
				expect(loggedMessage).toMatch(/Util/);
				expect(loggedMessage).toMatch(/source path|metadata\.sources/);
			} finally {
				restore();
			}
		});
	});
});
