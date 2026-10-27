import {HardhatPluginError} from 'hardhat/plugins';
import type {NetworkConnection} from 'hardhat/types/network';
import {
	UnresolvableAccountsError,
	formatUnresolvableAccountsMessage,
	redactEndpoint,
	type UnresolvableAccountsErrorData,
} from 'rocketh';

type NetworkDescription = Pick<NetworkConnection, 'networkName' | 'networkConfig'>;

/**
 * The environment variable hardhat-deploy's `addNetworksFromEnv` and `addNetworksFromKnownList`
 * read a network's mnemonic from (`getMnemonic` in `./helpers.ts`): the network name with every
 * dash turned into an underscore, since a dash is not valid in a variable name everywhere.
 */
function mnemonicVariable(networkName: string): string {
	return `MNEMONIC_${networkName}`.replaceAll('-', '_');
}

/**
 * Where the run's node is, as it may be shown. An http network's url is redacted (it routinely
 * carries an API key); the in-process network has no endpoint, so it is named instead, with the
 * url it forks when it forks one.
 */
async function describeEndpoint(network: NetworkDescription): Promise<string | undefined> {
	const config = network.networkConfig;
	try {
		if (config.type === 'http') {
			return redactEndpoint(await config.url.getUrl());
		}
		if (config.type === 'edr-simulated') {
			if (config.forking?.enabled) {
				return `hardhat's in-process network, forking ${redactEndpoint(await config.forking.url.getUrl())}`;
			}
			return `hardhat's in-process network`;
		}
	} catch {
		// A url that cannot be read is not worth replacing the real error over.
	}
	return undefined;
}

/**
 * The fix for named accounts given by INDEX, when hardhat-deploy started the run. Under hardhat the
 * accounts at an index are the ones the HARDHAT NETWORK configures (its `accounts`), so that is
 * where the fix goes, not `rocketh/config.ts`. Worded from the network's own resolved config, so
 * the user is told what is configured today rather than a guess.
 */
function hardhatNodeAccountsFix(network: NetworkDescription, data: UnresolvableAccountsErrorData): string {
	const name = network.networkName;
	const accounts = network.networkConfig.accounts;
	const rockethAlternative =
		`Alternatively, in the \`accounts\` of rocketh/config.ts, give the account a signer protocol ` +
		`(for example 'privateKey:...', read from the environment) or an address for "${data.environment}".`;

	if (accounts === 'remote') {
		const variable = mnemonicVariable(name);
		const nodeHas =
			data.nodeAccountCount === undefined
				? `and 'eth_accounts' failed on it`
				: data.nodeAccountCount === 0
					? `and this node holds none`
					: `and this node lists only ${data.nodeAccountCount}`;
		return (
			`The hardhat network "${name}" configures no accounts (its \`accounts\` is 'remote'), so hardhat asks the ` +
			`node for its own, ${nodeHas}.\n` +
			`To fix it, configure accounts for "${name}" in your hardhat config, for example ` +
			`\`accounts: {mnemonic: configVariable('${variable}')}\` or \`accounts: [configVariable('DEPLOYER_PRIVATE_KEY')]\`` +
			(data.nodeAccountCount !== undefined && data.nodeAccountCount > 0
				? `, or give the account an index below ${data.nodeAccountCount}. `
				: '. ') +
			// Only `addNetworksFromKnownList` leaves a network's accounts 'remote' when no mnemonic is
			//  set: `addNetworksFromEnv` falls back to the public test mnemonic (`getMnemonic`).
			`If "${name}" is added by hardhat-deploy's \`addNetworksFromKnownList\`, set the ` +
			`environment variable ${variable} to the mnemonic (or MNEMONIC, which every network without its own falls ` +
			`back to); the value SECRET reads it from the configuration variable SECRET_${variable} instead.\n` +
			rockethAlternative
		);
	}
	if (Array.isArray(accounts)) {
		return (
			(accounts.length === 0
				? `The hardhat network "${name}" is configured with an empty \`accounts\` list, so it has no accounts.\n`
				: `The hardhat network "${name}" is configured with ${accounts.length} private key(s) in its \`accounts\`, ` +
					`so only indexes 0 to ${accounts.length - 1} exist.\n`) +
			`To fix it, add a key for each missing index to \`accounts\` of "${name}" in your hardhat config, or give ` +
			`the account a lower index. ` +
			rockethAlternative
		);
	}
	// An HD wallet (`{mnemonic, count, ...}`), on an http or an in-process network.
	return (
		`The hardhat network "${name}" derives ${accounts.count} account(s) from its mnemonic ` +
		`(\`accounts.count\`), so only indexes 0 to ${accounts.count - 1} exist.\n` +
		`To fix it, raise \`accounts.count\` of "${name}" in your hardhat config, or give the account a lower index. ` +
		rockethAlternative
	);
}

/**
 * hardhat-deploy's report of named accounts that cannot be resolved: the same per-account lines
 * core produces, against the endpoint of the hardhat network, with the fix for a hardhat project.
 * Raised as a `HardhatPluginError`, which hardhat prints as a plugin error (the message, no stack
 * trace, no invitation to report a bug in hardhat): this is a configuration mistake, not a crash.
 *
 * The original error is deliberately NOT attached as the parent: when `eth_accounts` failed, its
 * cause can quote the raw endpoint url, and `--show-stack-traces` would print it.
 */
export async function toHardhatAccountsError(
	error: UnresolvableAccountsError,
	network: NetworkDescription,
): Promise<HardhatPluginError> {
	const endpoint = error.data.endpoint ?? (await describeEndpoint(network));
	const data: UnresolvableAccountsErrorData = {...error.data, ...(endpoint !== undefined ? {endpoint} : {})};
	return new HardhatPluginError(
		'hardhat-deploy',
		formatUnresolvableAccountsMessage(data, {nodeAccountsFix: hardhatNodeAccountsFix(network, data)}),
	);
}

/**
 * Run `action`, turning named accounts that cannot be resolved into hardhat-deploy's own report
 * (see `toHardhatAccountsError`). Every other error passes through untouched.
 */
export async function reportingUnresolvableAccounts<T>(
	network: NetworkDescription,
	action: () => Promise<T>,
): Promise<T> {
	try {
		return await action();
	} catch (err) {
		if (err instanceof UnresolvableAccountsError) {
			throw await toHardhatAccountsError(err, network);
		}
		throw err;
	}
}
