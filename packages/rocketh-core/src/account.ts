import type {EIP1193Account} from 'eip-1193';
import type {Environment} from './types.js';

/**
 * Resolves an account identifier to an address.
 *
 * If the account starts with '0x', it is returned as-is.
 * Otherwise, it is looked up in the environment's namedAccounts.
 *
 * @param account - The account identifier (either a hex address or a named account)
 * @param env - The environment containing namedAccounts
 * @returns The resolved address
 * @throws {Error} If the account is not found in namedAccounts or if namedAccounts is not configured
 *
 * @example
 * ```ts
 * // Using a hex address
 * const address1 = resolveAccount('0x1234...', env);
 *
 * // Using a named account
 * const address2 = resolveAccount('deployer', env);
 * ```
 */
export function resolveAccount(
	account: string | EIP1193Account,
	env: Pick<Environment, 'namedAccounts'>
): `0x${string}` {
	if (account.startsWith('0x')) {
		return account as `0x${string}`;
	}

	if (env.namedAccounts) {
		const address = env.namedAccounts[account];
		if (!address) {
			throw new Error(`no address for ${account}`);
		}
		return address;
	}

	throw new Error(`no accounts setup, cannot get address for ${account}`);
}

/**
 * Resolves an account identifier to an address, returning undefined if not found.
 *
 * This is a safer version of `resolveAccount` that doesn't throw when the account
 * is not found. Instead, it returns undefined.
 *
 * @param account - The account identifier (either a hex address or a named account)
 * @param env - The environment containing namedAccounts
 * @returns The resolved address, or undefined if not found
 *
 * @example
 * ```ts
 * const address = resolveAccountOrUndefined('deployer', env);
 * if (address) {
 *   // account was resolved
 * }
 * ```
 */
export function resolveAccountOrUndefined(
	account: string | EIP1193Account,
	env: Pick<Environment, 'namedAccounts'>
): `0x${string}` | undefined {
	if (account.startsWith('0x')) {
		return account as `0x${string}`;
	}

	if (env.namedAccounts) {
		return env.namedAccounts[account];
	}

	return undefined;
}
