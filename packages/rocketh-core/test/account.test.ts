import {describe, it, expect} from 'vitest';
import {resolveAccount, resolveAccountOrUndefined} from '../src/account.js';
import type {Environment} from '../src/types.js';
import type {EIP1193Account} from 'eip-1193';

describe('Account Resolution', () => {
	describe('resolveAccount', () => {
		describe('hex address resolution', () => {
			it('should return hex address as-is when it starts with 0x', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x1234567890123456789012345678901234567890' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0x1234567890123456789012345678901234567890');
			});

			it('should handle lowercase hex addresses', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x1234567890abcdef1234567890abcdef12345678' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0x1234567890abcdef1234567890abcdef12345678');
			});

			it('should handle uppercase hex addresses', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x1234567890ABCDEF1234567890ABCDEF12345678' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0x1234567890abcdef1234567890abcdef12345678');
			});

			it('should handle mixed case hex addresses', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x1234567890AbCdEf1234567890aBcDeF12345678' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0x1234567890abcdef1234567890abcdef12345678');
			});

			it('should handle 20-byte hex addresses (40 chars + 0x)', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
			});

			it('should not lookup namedAccounts when account is hex address', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
			});
		});

		describe('named account resolution', () => {
			it('should resolve named account from namedAccounts', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
						user: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EIP1193Account,
					},
				};
				const account = 'deployer';
				const result = resolveAccount(account, env);
				expect(result).toBe('0x1234567890123456789012345678901234567890');
			});

			it('should resolve multiple named accounts', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1111111111111111111111111111111111111111' as EIP1193Account,
						user1: '0x2222222222222222222222222222222222222222' as EIP1193Account,
						user2: '0x3333333333333333333333333333333333333333' as EIP1193Account,
					},
				};

				expect(resolveAccount('deployer', env)).toBe('0x1111111111111111111111111111111111111111');
				expect(resolveAccount('user1', env)).toBe('0x2222222222222222222222222222222222222222');
				expect(resolveAccount('user2', env)).toBe('0x3333333333333333333333333333333333333333');
			});

			it('should handle named account with typical hardhat-style addresses', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as EIP1193Account,
						alice: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as EIP1193Account,
						bob: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' as EIP1193Account,
					},
				};

				expect(resolveAccount('deployer', env)).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
				expect(resolveAccount('alice', env)).toBe('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');
				expect(resolveAccount('bob', env)).toBe('0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc');
			});

			it('should throw error when named account does not exist', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = 'unknown';

				expect(() => resolveAccount(account, env)).toThrow('no address for unknown');
			});

			it('should throw error when namedAccounts is empty', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = 'deployer';

				expect(() => resolveAccount(account, env)).toThrow('no address for deployer');
			});
		});

		describe('error handling', () => {
			it('should throw error when namedAccounts is undefined', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: undefined as any,
				};
				const account = 'deployer';

				expect(() => resolveAccount(account, env)).toThrow('no accounts setup, cannot get address for deployer');
			});

			it('should throw descriptive error for missing named account', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = 'nonexistent';

				expect(() => resolveAccount(account, env)).toThrow('no address for nonexistent');
			});

			it('should throw error when account name is a string but not a hex address', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = 'notanaddress';

				expect(() => resolveAccount(account, env)).toThrow('no address for notanaddress');
			});
		});

		describe('edge cases', () => {
			it('should handle zero address', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x0000000000000000000000000000000000000000' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0x0000000000000000000000000000000000000000');
			});

			it('should handle address starting with 0x but not named account', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = '0x9876543210987654321098765432109876543210' as EIP1193Account;
				const result = resolveAccount(account, env);
				expect(result).toBe('0x9876543210987654321098765432109876543210');
			});

			it('should not modify the environment object', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = 'deployer';
				resolveAccount(account, env);
				expect(env.namedAccounts).toEqual({
					deployer: '0x1234567890123456789012345678901234567890',
				});
			});
		});
	});

	describe('resolveAccountOrUndefined', () => {
		describe('hex address resolution', () => {
			it('should return hex address as-is when it starts with 0x', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x1234567890123456789012345678901234567890' as EIP1193Account;
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe('0x1234567890123456789012345678901234567890');
			});

			it('should handle lowercase hex addresses', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x1234567890abcdef1234567890abcdef12345678' as EIP1193Account;
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe('0x1234567890abcdef1234567890abcdef12345678');
			});

			it('should not lookup namedAccounts when account is hex address', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EIP1193Account;
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
			});
		});

		describe('named account resolution', () => {
			it('should resolve named account from namedAccounts', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
						user: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as EIP1193Account,
					},
				};
				const account = 'deployer';
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe('0x1234567890123456789012345678901234567890');
			});

			it('should resolve multiple named accounts', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1111111111111111111111111111111111111111' as EIP1193Account,
						user1: '0x2222222222222222222222222222222222222222' as EIP1193Account,
						user2: '0x3333333333333333333333333333333333333333' as EIP1193Account,
					},
				};

				expect(resolveAccountOrUndefined('deployer', env)).toBe('0x1111111111111111111111111111111111111111');
				expect(resolveAccountOrUndefined('user1', env)).toBe('0x2222222222222222222222222222222222222222');
				expect(resolveAccountOrUndefined('user2', env)).toBe('0x3333333333333333333333333333333333333333');
			});
		});

		describe('undefined return for missing accounts', () => {
			it('should return undefined when named account does not exist', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = 'unknown';
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe(undefined);
			});

			it('should return undefined when namedAccounts is undefined', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: undefined as any,
				};
				const account = 'deployer';
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe(undefined);
			});

			it('should return undefined when namedAccounts is empty', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = 'deployer';
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe(undefined);
			});

			it('should return undefined for non-hex string when namedAccounts is undefined', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: undefined as any,
				};
				const account = 'notanaddress';
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe(undefined);
			});

			it('should return undefined for non-hex string when namedAccounts is empty', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = 'notanaddress';
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe(undefined);
			});
		});

		describe('edge cases', () => {
			it('should handle zero address', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = '0x0000000000000000000000000000000000000000' as EIP1193Account;
				const result = resolveAccountOrUndefined(account, env);
				expect(result).toBe('0x0000000000000000000000000000000000000000');
			});

			it('should not modify the environment object', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {
						deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
					},
				};
				const account = 'deployer';
				resolveAccountOrUndefined(account, env);
				expect(env.namedAccounts).toEqual({
					deployer: '0x1234567890123456789012345678901234567890',
				});
			});

			it('should return undefined for missing account but not throw', () => {
				const env: Pick<Environment, 'namedAccounts'> = {
					namedAccounts: {},
				};
				const account = 'nonexistent';
				expect(() => resolveAccountOrUndefined(account, env)).not.toThrow();
				expect(resolveAccountOrUndefined(account, env)).toBe(undefined);
			});
		});
	});

	describe('comparison between resolveAccount and resolveAccountOrUndefined', () => {
		it('should return same result for existing hex address', () => {
			const env: Pick<Environment, 'namedAccounts'> = {
				namedAccounts: {},
			};
			const account = '0x1234567890123456789012345678901234567890' as EIP1193Account;
			expect(resolveAccount(account, env)).toBe(resolveAccountOrUndefined(account, env));
		});

		it('should return same result for existing named account', () => {
			const env: Pick<Environment, 'namedAccounts'> = {
				namedAccounts: {
					deployer: '0x1234567890123456789012345678901234567890' as EIP1193Account,
				},
			};
			const account = 'deployer';
			expect(resolveAccount(account, env)).toBe(resolveAccountOrUndefined(account, env));
		});

		it('should throw for missing account in resolveAccount but return undefined in resolveAccountOrUndefined', () => {
			const env: Pick<Environment, 'namedAccounts'> = {
				namedAccounts: {},
			};
			const account = 'unknown';

			expect(() => resolveAccount(account, env)).toThrow();
			expect(resolveAccountOrUndefined(account, env)).toBe(undefined);
		});
	});
});
