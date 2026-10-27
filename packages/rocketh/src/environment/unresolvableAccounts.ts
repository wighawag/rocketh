/**
 * The error a run raises when one or more NAMED ACCOUNTS cannot be resolved while the environment
 * is being built, and the pieces each entry point needs to word it for the way the run was started.
 *
 * WHY a typed error carrying data, rather than a finished sentence: the fix for the commonest case
 * (an account given by INDEX on a node that holds no keys) depends on who started the run, and core
 * must not know. Under the `rocketh` CLI the accounts at an index are the node's own, so the fix is
 * in `rocketh/config.ts`; under hardhat-deploy they are whatever the hardhat network's `accounts`
 * configure, so the fix is in the hardhat config. The default message (`error.message`) is the
 * rocketh-config one, which is right for the CLI and for programmatic callers; hardhat-deploy
 * rebuilds the message from `error.data` with its own fix (`formatUnresolvableAccountsMessage`).
 *
 * Every account that fails is reported in ONE error, so a config with `deployer: 0` and `admin: 1`
 * is not fixed one account per run.
 *
 * Nothing in here may print key material: account definitions arrive already DESCRIBED (see
 * `describeAccountDefinition`), and an endpoint is shown only through `redactEndpoint`.
 */

/**
 * Why one named account could not be resolved. A CLOSED set, and every member is produced by
 * `getAccount` in `./index.ts`:
 *
 * - `node-has-no-accounts`: given by index, and the node answered `eth_accounts` with `[]` (most
 *   public RPC endpoints, which hold no keys).
 * - `index-beyond-node-accounts`: given by index, and the node lists fewer accounts than that.
 * - `node-accounts-unavailable`: given by index, and `eth_accounts` failed on the node.
 * - `no-value-for-environment`: nothing in the definition applies to this environment (a
 *   per-network map with no entry for it and no `default`, or a reference to such an account).
 * - `unknown-reference`: a string that is not an address, a key, a protocol or another account.
 * - `reference-cycle`: references that loop back to an account already followed.
 * - `private-key-without-protocol`: a bare private key, with no `privateKey` signer protocol.
 * - `unknown-signer-protocol`: a `<protocol>:...` string whose protocol is not registered.
 */
export type UnresolvableAccountReason =
	| 'node-has-no-accounts'
	| 'index-beyond-node-accounts'
	| 'node-accounts-unavailable'
	| 'no-value-for-environment'
	| 'unknown-reference'
	| 'reference-cycle'
	| 'private-key-without-protocol'
	| 'unknown-signer-protocol';

/** One named account that could not be resolved. */
export type UnresolvableAccount = {
	/** The name in `accounts`, as the config spells it. */
	readonly name: string;
	readonly reason: UnresolvableAccountReason;
	/**
	 * The definition that failed, DESCRIBED rather than printed: an index, an address, a protocol
	 * NAME, another account's name, the keys of a per-network map. Never key material.
	 */
	readonly definition: string;
	/** The index asked for, for the three `node-*` / `index-*` reasons. */
	readonly index?: number;
	/** The protocol name, for `unknown-signer-protocol`. */
	readonly protocol?: string;
	/**
	 * The names followed to reach the failing definition, starting with `name`. Present only when
	 * the account is a reference to another one (`owner -> admin`).
	 */
	readonly referenceChain?: readonly string[];
};

export type UnresolvableAccountsErrorData = {
	/** The environment (rocketh's name for the network) the run was resolving accounts for. */
	readonly environment: string;
	/** The chain id the node reported, in decimal. */
	readonly chainId: string;
	/**
	 * The endpoint the run asked, already passed through `redactEndpoint`. Absent when rocketh
	 * did not open the connection itself (a provider handed in by the caller, as hardhat-deploy
	 * does), in which case the entry point that knows it may fill it in.
	 */
	readonly endpoint?: string;
	/** How many accounts the node listed in `eth_accounts`; absent when that call failed. */
	readonly nodeAccountCount?: number;
	/** Why `eth_accounts` failed, redacted; present only when it did (and then also the `cause`). */
	readonly nodeAccountsError?: string;
	/** The NAMES of the signer protocols registered in the config (`signerProtocols`). */
	readonly registeredProtocols?: readonly string[];
	/** Every account that failed, in config order. Never empty. */
	readonly accounts: readonly UnresolvableAccount[];
};

export type UnresolvableAccountsMessageOptions = {
	/**
	 * What to tell the user to do about the accounts given by INDEX (the three `node-*` /
	 * `index-*` reasons). Replaces the default, which points at `rocketh/config.ts`. An entry
	 * point that controls where the node's accounts come from (hardhat-deploy: the hardhat
	 * network's `accounts`) supplies its own. Ignored when no account failed for such a reason.
	 */
	readonly nodeAccountsFix?: string;
};

const NODE_ACCOUNT_REASONS: ReadonlySet<UnresolvableAccountReason> = new Set([
	'node-has-no-accounts',
	'index-beyond-node-accounts',
	'node-accounts-unavailable',
]);

/** Whether this account was given by index, i.e. needs one of the NODE's accounts. */
export function needsNodeAccount(account: UnresolvableAccount): boolean {
	return NODE_ACCOUNT_REASONS.has(account.reason);
}

/**
 * An endpoint as it may be SHOWN: the scheme, host and port, which is what tells two networks
 * apart, and nothing that could be a secret. RPC providers put the API key in the path
 * (`/v3/<key>`, `/v2/<key>`), in the query string (`?apikey=`) or in the credentials
 * (`https://user:secret@host`), and a URL printed on CI ends up in a log that can be public, so
 * every one of those parts is replaced as a whole whenever it is present. A value that does not
 * parse as a URL is withheld entirely, since its shape alone cannot prove it holds no secret.
 */
export function redactEndpoint(endpoint: string): string {
	let url: URL;
	try {
		url = new URL(endpoint);
	} catch {
		return '<redacted endpoint>';
	}
	if (!url.host) {
		return '<redacted endpoint>';
	}
	const credentials = url.username || url.password ? '<redacted>@' : '';
	const path = url.pathname && url.pathname !== '/' ? '/<redacted>' : '';
	const query = url.search ? '?<redacted>' : '';
	const fragment = url.hash ? '#<redacted>' : '';
	return `${url.protocol}//${credentials}${url.host}${path}${query}${fragment}`;
}

/**
 * A failure's text as it may be shown: every URL in it redacted (a transport error routinely
 * quotes the endpoint it failed on), and cut short, since it is a detail in a longer message.
 */
export function redactErrorText(text: string): string {
	const redacted = text.replace(/[a-z][a-z0-9+.-]*:\/\/[^\s"'<>`]+/gi, (match) => redactEndpoint(match));
	return redacted.length > 300 ? redacted.slice(0, 300) + '...' : redacted;
}

function quoted(names: readonly string[]): string {
	return names.map((name) => `"${name}"`).join(', ');
}

function describeOne(account: UnresolvableAccount, data: UnresolvableAccountsErrorData): string {
	const through =
		account.referenceChain && account.referenceChain.length > 1
			? ` (through ${account.referenceChain.join(' -> ')})`
			: '';
	const configured = `"${account.name}" is configured as ${account.definition}${through}`;
	switch (account.reason) {
		case 'node-has-no-accounts':
			return `${configured}, but the node lists no accounts.`;
		case 'index-beyond-node-accounts': {
			const count = data.nodeAccountCount ?? 0;
			return (
				`${configured}, but the node lists ${count} account${count === 1 ? '' : 's'} ` +
				`(index${count === 1 ? ' 0' : `es 0 to ${count - 1}`}).`
			);
		}
		case 'node-accounts-unavailable':
			return (
				`${configured}, which needs the node to list its accounts, but 'eth_accounts' failed` +
				(data.nodeAccountsError ? `: ${data.nodeAccountsError}` : '.')
			);
		case 'no-value-for-environment':
			return (
				`${configured}, which gives nothing for this environment` +
				(account.definition.startsWith('{')
					? `: no entry for "${data.environment}" (or chain ${data.chainId}) and no \`default\`.`
					: '.')
			);
		case 'unknown-reference':
			return (
				`${configured}, which is not an address, a private key, a signer protocol ('<protocol>:...') ` +
				`or the name of another account in \`accounts\`.` +
				// `<redacted>` is what a value that may be a secret describes as, typically a private key
				//  pasted without its `0x` (the way wallets export it), which is read as a reference.
				(account.definition === '<redacted>'
					? ` If it is a private key, write it with its 0x prefix (or as 'privateKey:0x...'); it is not shown.`
					: '')
			);
		case 'reference-cycle':
			return `"${account.name}" is part of a reference cycle: ${(account.referenceChain ?? [account.name]).join(' -> ')}.`;
		case 'private-key-without-protocol':
			return (
				`"${account.name}" is configured as a private key${through}, but no 'privateKey' signer protocol is ` +
				`registered in \`signerProtocols\`. Register the one from @rocketh/signer ` +
				`(\`signerProtocols: {privateKey}\`). The key itself is not shown.`
			);
		case 'unknown-signer-protocol':
			return (
				`${configured}, but no signer protocol "${account.protocol}" is registered in \`signerProtocols\` ` +
				`(registered: ${data.registeredProtocols?.length ? quoted(data.registeredProtocols) : 'none'}).`
			);
	}
}

/**
 * The default fix for accounts given by index: the one that applies when rocketh itself decides
 * what the node is (the `rocketh` CLI, or a programmatic run handing rocketh a provider).
 */
function defaultNodeAccountsFix(data: UnresolvableAccountsErrorData, indexed: readonly UnresolvableAccount[]): string {
	const example = indexed[0].name;
	const environmentKey = /^[A-Za-z_$][\w$]*$/.test(data.environment) ? data.environment : `'${data.environment}'`;
	const keyVariable =
		example
			.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
			.replace(/[^A-Za-z0-9]+/g, '_')
			.toUpperCase() + '_PRIVATE_KEY';
	const lowerIndex =
		data.nodeAccountCount !== undefined && data.nodeAccountCount > 0
			? ` (or an index below ${data.nodeAccountCount})`
			: '';
	const why =
		data.nodeAccountCount === 0
			? `An account given by index is one of the node's own accounts, and this node holds none: nodes without ` +
				`keys (most public RPC endpoints) answer 'eth_accounts' with an empty list.\n`
			: '';
	return (
		why +
		`To fix it, in the \`accounts\` of your rocketh config (rocketh/config.ts), give ` +
		`${indexed.length === 1 ? `"${example}"` : 'each of these accounts'} a signer protocol or an address for ` +
		`"${data.environment}"${lowerIndex}. Read any key from the environment rather than writing it in the file, ` +
		`for example:\n` +
		`    ${example}: {default: ${indexed[0].index ?? 0}, ${environmentKey}: \`privateKey:\${process.env.${keyVariable}}\`},\n` +
		`The 'privateKey' protocol is registered with \`signerProtocols: {privateKey}\` (from @rocketh/signer). ` +
		`Or point "${data.environment}" at a node that holds the keys.`
	);
}

/**
 * The whole message: WHERE (environment, chain, endpoint), WHICH accounts and why, then the fix.
 * `options.nodeAccountsFix` replaces the default fix for accounts given by index.
 */
export function formatUnresolvableAccountsMessage(
	data: UnresolvableAccountsErrorData,
	options: UnresolvableAccountsMessageOptions = {},
): string {
	const where = `environment "${data.environment}" (chain ${data.chainId}${data.endpoint ? `, endpoint ${data.endpoint}` : ''})`;
	const header =
		data.accounts.length === 1
			? `cannot resolve the named account "${data.accounts[0].name}" for ${where}:`
			: `cannot resolve ${data.accounts.length} named accounts (${quoted(data.accounts.map((a) => a.name))}) for ${where}:`;
	const lines = [header, ...data.accounts.map((account) => `  - ${describeOne(account, data)}`)];

	const indexed = data.accounts.filter(needsNodeAccount);
	if (indexed.length > 0) {
		lines.push(options.nodeAccountsFix ?? defaultNodeAccountsFix(data, indexed));
	}
	return lines.join('\n');
}

/**
 * Raised while the environment is built, when at least one named account cannot be resolved. It
 * names every such account, not just the first. `data` is what an entry point rebuilds its own
 * message from (see `formatUnresolvableAccountsMessage`); `message` is the default wording, whose
 * fix points at `rocketh/config.ts`. `cause` is set when `eth_accounts` failed, to an error carrying
 * that failure's REDACTED message (the original can quote the endpoint url, key included).
 */
export class UnresolvableAccountsError extends Error {
	readonly data: UnresolvableAccountsErrorData;

	constructor(data: UnresolvableAccountsErrorData, options?: {cause?: unknown}) {
		super(formatUnresolvableAccountsMessage(data), options);
		this.name = 'UnresolvableAccountsError';
		this.data = data;
	}
}
