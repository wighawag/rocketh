import type {
	AccountType,
	Artifact,
	Deployment,
	Environment,
	Signer,
	Signability,
	PendingDeployment,
	PendingTransaction,
	ResolvedAccount,
	ResolvedNamedAccounts,
	ResolvedNamedSigners,
	UnknownDeployments,
	UnresolvedUnknownNamedAccounts,
	UnresolvedNetworkSpecificData,
	ResolvedNetworkSpecificData,
	DataType,
	ResolvedExecutionParams,
	ResolvedUserConfig,
	PendingExecution,
	DeploymentStore,
	ProgressIndicator,
	PartialDeployment,
	TransactionToBroadcast,
	CapturedTransaction,
	UnknownSignerPolicyFrame,
} from '@rocketh/core/types';
import {UnknownSignerError, type UnknownSignerContractCall} from '@rocketh/core';
import {
	createUnknownSignerPolicyStack,
	describeDeferralRepeatExecution,
	describeUnknownSignerCapabilityDegradation,
	resolveUnknownSignerBehaviour,
} from './unknownSignerPolicy.js';
import {
	askForExecutedTransactionHash,
	confirmUnrelatedTransaction,
	createHashPromptBudget,
	describeRemainingAttempts,
} from './interactiveUnknownSigner.js';
import {classifyPastedTransaction, describeEvidence} from './pastedTransactionIntent.js';
import {Abi, Address} from 'abitype';
import {InternalEnvironment} from '../internal/types.js';
import {JSONToString, stringToJSON} from '@rocketh/core/json';
import {
	EIP1193Account,
	EIP1193DATA,
	EIP1193ProviderWithoutEvents,
	EIP1193Transaction,
	EIP1193TransactionData,
	EIP1193TransactionReceipt,
	EIP1193TransactionType0,
	EIP1193TransactionType1,
	EIP1193TransactionType2,
} from 'eip-1193';
import {logger, spin} from '../internal/logging.js';
import {mergeArtifacts} from '@rocketh/core/artifacts';
import {TransactionHashTracker, TransactionHashTrackerProvider} from '@rocketh/core/providers';
import {getRoughGasPriceEstimate} from '../utils/eth.js';

function toQuantity(value: bigint): `0x${string}` {
	return `0x${value.toString(16)}`;
}

/**
 * Turn a transaction rocketh COMPOSED into the entry a run remembers it by (see
 * `CapturedTransaction` in `@rocketh/core/types`).
 *
 * It reads the transaction as the choke point RECEIVED it, never a prepared or signed
 * derivative of it: the locally-signing path fills nonce, gas and fees before handing the
 * transaction to the signer, and none of that may reach an entry.
 *
 * A field the transaction did not carry stays ABSENT rather than becoming `null` or `'0x'`.
 * `'0x'` data on a plain transfer would turn a replay of the deterministic-factory funding
 * transfer into an empty CALL, and `null` is not something a non-JavaScript consumer of the
 * eventual file should have to interpret. `value` is passed through as the 0x QUANTITY it
 * already is: converting to a bigint here would only mean converting back at every sink, and
 * would make the list non-serialisable by a plain `JSON.stringify`.
 *
 * `from` is kept AS THE TRANSACTION CARRIED IT, not as the lowercased key the signability
 * lookup uses: an internal KEY normalises so lookups work, a user-facing VALUE keeps what was
 * resolved (see `CONTEXT.md`, and `PendingTransaction.transaction.origin` for the same rule).
 */
function toCapturedIntent(transactionData: EIP1193TransactionData, signability: Signability): CapturedTransaction {
	return {
		type: 'intent',
		from: transactionData.from,
		...(transactionData.to !== undefined ? {to: transactionData.to} : {}),
		...(transactionData.value !== undefined ? {value: transactionData.value} : {}),
		...(transactionData.data !== undefined ? {data: transactionData.data} : {}),
		signability,
	};
}

/**
 * A receipt counts as successful only with an explicit status of 1. Absent or unparseable is
 * NOT success: pre-Byzantium receipts have no status, and rocketh would rather refuse to record
 * a deployment than record one it cannot prove worked.
 */
function receiptSucceeded(receipt: EIP1193TransactionReceipt): boolean {
	try {
		return receipt.status !== undefined && BigInt(receipt.status) === 1n;
	} catch {
		// an unparseable status is not a successful one
		return false;
	}
}

/**
 * A transaction that was MINED but whose receipt does not report success.
 *
 * A distinct type rather than a plain `Error` because one caller has to tell this apart from
 * every other failure: transaction RECOVERY must clear a pending entry whose transaction is
 * resolved-but-unsuccessful (it is never coming back), while still refusing to clear one that
 * failed for a transient reason like a dropped connection. Without the distinction, a single
 * reverted transaction wedges every future run on the same hash.
 */
export class UnsuccessfulTransactionError extends Error {
	constructor(
		readonly hash: `0x${string}`,
		readonly receipt: EIP1193TransactionReceipt,
	) {
		// Absent and zero are different diagnoses and must not share a message: zero means the
		// EVM reverted it, absent means the node never told us either way (a pre-Byzantium
		// receipt, or a node/mock that omits the field), and telling the second group their
		// transaction "reverted" sends them looking for a bug that is not there.
		super(
			receipt.status === undefined
				? `transaction ${hash} cannot be confirmed: its receipt has no "status" field, so rocketh ` +
						`cannot tell whether it succeeded, and it will not record anything it cannot prove. ` +
						`Pre-Byzantium chains and some mocks omit the field.`
				: `transaction ${hash} did not succeed: its receipt reports status ${receipt.status}. ` +
						`rocketh requires a successful status before it records anything, so nothing was saved.\n` +
						`A transaction that was mined but reverted usually means it ran out of gas, or the call ` +
						`itself reverted (a failed require/revert, or a constructor that threw).`,
		);
		this.name = 'UnsuccessfulTransactionError';
	}
}

/**
 * Fill the fields a LOCALLY-signing account has no other way to learn.
 *
 * The line drawn here is the same one viem draws in `sendTransaction`: a `json-rpc` account is
 * passed through to `eth_sendTransaction` untouched, because the node or wallet is authoritative
 * and is DEFINED to fill what the caller omitted; a `local` account goes through
 * `prepareTransactionRequest` first, because once we sign it ourselves nobody else can. rocketh's
 * `signerOnly` variant (what the `privateKey` protocol and hardware/HSM protocols return) is
 * viem's `local`, and `remote` / `wallet` are its `json-rpc`.
 *
 * Preparing the json-rpc side too would be actively worse, not merely redundant: handing a wallet
 * our own gas limit takes the estimate out of the user's hands, and an estimate taken at another
 * block can be wrong by the time they confirm.
 *
 * The fields match viem's `defaultParameters` minus the ones rocketh already sets at the call
 * site (`chainId`, `type`) and blob fields it does not support: nonce, fees, gas.
 *
 * Done with plain EIP-1193 calls rather than by importing viem, because `rocketh` deliberately
 * depends only on `eip-1193` (ADR-0002): viem lives in the optional `@rocketh/viem` extension.
 */
async function prepareForLocalSigning(
	provider: EIP1193ProviderWithoutEvents,
	transactionData: EIP1193TransactionData,
): Promise<EIP1193TransactionData> {
	const prepared = {...transactionData} as EIP1193TransactionData & {
		gas?: `0x${string}`;
		nonce?: `0x${string}`;
		gasPrice?: `0x${string}`;
		maxFeePerGas?: `0x${string}`;
		maxPriorityFeePerGas?: `0x${string}`;
	};

	if (prepared.nonce === undefined) {
		prepared.nonce = await provider.request({
			method: 'eth_getTransactionCount',
			params: [prepared.from, 'pending'],
		});
	}

	if (prepared.type === '0x2') {
		if (prepared.maxFeePerGas === undefined || prepared.maxPriorityFeePerGas === undefined) {
			// The same estimator the executor uses. It can fall back to `eth_gasPrice`, but only
			// for a node whose `eth_feeHistory` error message matches one of two known strings
			// (see `getGasPriceEstimate` in ../utils/eth.ts); a bare `-32601` still propagates.
			const estimate = await getRoughGasPriceEstimate(provider);

			// The estimator reports `maxFeePerGas` as (next block's base fee + average priority
			// fee), so subtracting recovers the base-fee component.
			const estimatedPriority = estimate.average.maxPriorityFeePerGas;
			const estimatedBase = estimate.average.maxFeePerGas - estimatedPriority;

			const suppliedCap = prepared.maxFeePerGas === undefined ? undefined : BigInt(prepared.maxFeePerGas);
			const suppliedPriority =
				prepared.maxPriorityFeePerGas === undefined ? undefined : BigInt(prepared.maxPriorityFeePerGas);

			// The two fields are resolved TOGETHER, because `maxPriorityFeePerGas > maxFeePerGas`
			// is not merely odd, it is an invalid pair that the node rejects. Filling either one
			// in isolation can produce it: a caller who supplies a low cap and leaves the priority
			// fee to us, or one who supplies a high priority fee and leaves the cap to us.
			const priority =
				suppliedPriority ??
				(suppliedCap !== undefined && estimatedPriority > suppliedCap ? suppliedCap : estimatedPriority);

			// Doubling the BASE-fee component (never the priority fee) buys headroom, the way viem
			// multiplies it by 1.2. Without it the cap is exactly the next block's base fee plus a
			// tip, so a transaction that misses that one block becomes unmineable as the base fee
			// steps up (max +12.5% per block) and rocketh then polls for a receipt that can never
			// arrive. `maxFeePerGas` is a ceiling, not a price: the excess is not spent.
			const cap = suppliedCap ?? estimatedBase * 2n + priority;

			prepared.maxPriorityFeePerGas = toQuantity(priority);
			prepared.maxFeePerGas = toQuantity(cap);
		}
	} else if (prepared.gasPrice === undefined) {
		prepared.gasPrice = await provider.request({method: 'eth_gasPrice'});
	}

	if (prepared.gas === undefined) {
		// Only the fields that determine EXECUTION are sent. Passing the fee fields as well (as
		// viem does) makes some nodes charge the estimate against the sender's balance and answer
		// "insufficient funds" for a transaction that would in fact run. `to` is absent for a
		// deployment, which `EIP1193CallParam` does not model, hence the cast.
		prepared.gas = await provider.request({
			method: 'eth_estimateGas',
			params: [
				{
					from: prepared.from,
					...(prepared.to === undefined ? {} : {to: prepared.to}),
					...(prepared.data === undefined ? {} : {data: prepared.data}),
					...(prepared.value === undefined ? {} : {value: prepared.value}),
				} as never,
			],
		});
	}

	return prepared;
}

function wait(numSeconds: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, numSeconds * 1000);
	});
}

/**
 * How many rounds a hash PASTED at the interactive unknown-signer prompt gets to become
 * KNOWN to this node before the run stops looking for THAT hash and asks again.
 *
 * It bounds only the "this node has never heard of that hash" case (a typo, a hash from
 * another chain), never the wait for MINING: a transaction the node knows is waited for
 * like any other. Giving up on a hash no longer ends the run: the human is asked again
 * with that hash pre-filled, and it is the shared budget of questions one pause may ask
 * (`MAX_HASH_PROMPT_ATTEMPTS`) that bounds how often this can happen. The wall-clock length is the run's own `pollingInterval` times this,
 * so a chain configured to poll slowly stretches the grace period exactly as it
 * stretches every other wait, and a test that polls fast is fast.
 */
export const PASTED_TRANSACTION_LOOKUP_ROUNDS = 10;

/**
 * WHAT PRODUCED the transaction reaching the broadcast choke point, stated by the funnel
 * that is calling it.
 *
 * NOT called `origin`, deliberately, even though that is the obvious word: `origin`
 * already means something ELSE in this module — `PendingTransaction.transaction.origin`
 * is the SENDER ADDRESS of a pending transaction (a persisted record field). Two
 * meanings for one word inside one file is how the next reader mis-reads one of them,
 * so the funnel-descriptor took a different word and the address field kept `origin`.
 *
 * It is a DISCRIMINATED UNION and a REQUIRED parameter, not an optional bag, because the
 * deployment invariants (an interactively-pasted hash must actually have deployed
 * something) can only run when the choke point KNOWS it is looking at a deployment. Made
 * optional, a future funnel could reach the seam without saying, and would silently skip
 * those checks — the exact class of hole this exists to close. Required, the compiler asks
 * the question. The two members are the two public funnels (`broadcastExecution`,
 * `broadcastDeployment`), which are also the only callers: this stays a private closure's
 * parameter with no exported surface to keep stable.
 *
 * `contract` (execution only) is the contract-call metadata used ONLY to enrich an
 * `UnknownSignerError`; a deploy has no function to name. `expectedAddress` (deployment
 * only) is the address a deterministic or factory deploy computed from bytecode and salt
 * BEFORE broadcast, which `waitForDeploymentTransactionAndSave` already PREFERS over the
 * receipt's contract address — so it is the address that would be recorded, and therefore
 * the one that has to be confirmed on-chain.
 */
type BroadcastSource =
	| {type: 'execution'; contract?: Omit<UnknownSignerContractCall, 'name'>}
	| {type: 'deployment'; name: string; expectedAddress?: `0x${string}`};

/** No contract ever lives here, so a receipt naming it created nothing. */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Narrow `EIP1193Transaction` (a CLOSED union of exactly three variants, see `eip-1193`:
 * `EIP1193TransactionType0 | EIP1193TransactionType1 | EIP1193TransactionType2`) by the VALUES
 * that distinguish them, never by key presence.
 *
 * Nodes differ on whether an inapplicable field is OMITTED or present as `null`: geth omits the
 * 1559 fields on a legacy transaction, others send `maxFeePerGas: null`. A bare `'maxFeePerGas'
 * in tx` treats the second kind as 1559 and then dies on `BigInt(null)`, which is how a purely
 * cosmetic log line took down a whole deploy run.
 */
function isEIP1559Transaction(transaction: EIP1193Transaction): transaction is EIP1193TransactionType2 {
	const tx = transaction as Partial<EIP1193TransactionType2>;
	return typeof tx.maxFeePerGas === 'string' && typeof tx.maxPriorityFeePerGas === 'string';
}

function hasGasPrice(
	transaction: EIP1193Transaction,
): transaction is EIP1193TransactionType0 | EIP1193TransactionType1 {
	const tx = transaction as Partial<EIP1193TransactionType0>;
	return typeof tx.gasPrice === 'string';
}

function displayTransaction(transaction: EIP1193Transaction) {
	if (isEIP1559Transaction(transaction)) {
		return `(type ${transaction.type}, maxFeePerGas: ${BigInt(
			transaction.maxFeePerGas,
		).toString()}, maxPriorityFeePerGas: ${BigInt(transaction.maxPriorityFeePerGas).toString()})`;
	} else if (hasGasPrice(transaction)) {
		return `(type ${transaction.type ? Number(transaction.type) : '0'}, gasPrice: ${BigInt(
			transaction.gasPrice,
		).toString()})`;
	} else {
		// TypeScript proves this unreachable: every variant of the union carries either
		// `gasPrice` or the 1559 pair. It is kept because the union describes what a node is
		// SUPPOSED to send, and this function's whole reason for existing is that real nodes
		// send other shapes. Hence the cast off `never`.
		const {type} = transaction as {type?: string};
		return `(tx with no gas pricing, type: ${Number(type)})`;
	}
}

/**
 * Impersonate accounts that are not available in the provider's accounts list.
 * This is useful for testing with named accounts that don't have private keys available.
 *
 * @param provider - The EIP1193 provider
 * @param unknownAccounts - List of addresses to impersonate
 * @param autoImpersonate - Whether auto-impersonation is enabled
 */
async function impersonateAccounts(
	provider: EIP1193ProviderWithoutEvents,
	unknownAccounts: string[],
	autoImpersonate?: boolean,
): Promise<string[]> {
	// Check if auto-impersonation is enabled
	if (!autoImpersonate) {
		return [];
	}

	const impersonatedAccounts: string[] = [];

	// Attempt to impersonate each unknown account
	for (const address of unknownAccounts) {
		try {
			// Use type assertion since hardhat_impersonateAccount is not part of standard EIP1193
			await (provider as any).request({
				method: 'hardhat_impersonateAccount',
				params: [address],
			});
			impersonatedAccounts.push(address);
		} catch (error: any) {
			// Silently fail if the provider doesn't support impersonation
			// This allows the feature to work gracefully with non-hardhat/anvil providers
			if (!error.message?.includes('method not supported') && !error.message?.includes('Method not found')) {
				logger.debug(`Failed to impersonate account ${address}: ${error.message}`);
			}
		}
	}

	return impersonatedAccounts;
}

export async function loadDeploymentsFromStore(
	deploymentStore: DeploymentStore,
	deploymentsPath: string,
	networkName: string,
	onlyABIAndAddress?: boolean,
	expectedChain?: {chainId: string; genesisHash?: `0x${string}`; deleteDeploymentsIfDifferentGenesisHash?: boolean},
): Promise<{
	deployments: UnknownDeployments;
	migrations: Record<string, number>;
	chainId?: string;
	genesisHash?: `0x${string}`;
}> {
	const deploymentsFound: UnknownDeployments = {};

	let fileNames: string[];
	try {
		fileNames = await deploymentStore.listFiles(
			deploymentsPath,
			networkName,
			(name) => !(name.startsWith('.') && name !== '.migrations.json') && name !== 'solcInputs',
		);
	} catch (e) {
		// console.log('no folder at ' + deployPath);
		return {deployments: {}, migrations: {}};
	}
	let chainId: string;
	let genesisHash: `0x${string}` | undefined;
	if (fileNames.length > 0) {
		if (await deploymentStore.hasFile(deploymentsPath, networkName, '.chain')) {
			const chainSTR = await deploymentStore.readFile(deploymentsPath, networkName, '.chain');
			const chainData = JSON.parse(chainSTR);
			chainId = chainData.chainId;
			genesisHash = chainData.genesisHash;
		} else if (await deploymentStore.hasFile(deploymentsPath, networkName, '.chainId')) {
			chainId = await deploymentStore.readFile(deploymentsPath, networkName, '.chainId');
		} else {
			throw new Error(
				`A '.chain' or '.chainId' file is expected to be present in the deployment folder for network ${networkName}`,
			);
		}

		if (expectedChain) {
			if (expectedChain.chainId !== chainId) {
				throw new Error(
					`Loading deployment from environment '${networkName}' (with chainId: ${chainId}) for a different chainId (${expectedChain.chainId})`,
				);
			}

			if (genesisHash) {
				if (expectedChain.genesisHash && expectedChain.genesisHash !== genesisHash) {
					if (expectedChain.deleteDeploymentsIfDifferentGenesisHash) {
						// we delete the old folder

						await deploymentStore.deleteAll(deploymentsPath, networkName);
						return {deployments: {}, migrations: {}};
					} else {
						throw new Error(
							`Deployment folder for environment '${networkName}' was recorded with genesisHash ${genesisHash}, ` +
								`but the current chain's genesisHash is ${expectedChain.genesisHash}.\n` +
								`This usually means the chain was reset. If '${networkName}' is an ephemeral/dev chain ` +
								`(resettable), set deleteDeploymentsIfDifferentGenesisHash: true on its chain config ` +
								`so rocketh auto-deletes the stale deployments. If this is a real chain and the ` +
								`stored value is stale (e.g. from an older rocketh version that used the ` +
								`"earliest" block), remove the "genesisHash" field from the .chain file.`,
						);
					}
				}
			} else {
				console.warn(
					`genesisHash not found in environment '${networkName}' (with chainId: ${chainId}), writing .chain with expected one...`,
				);
				await deploymentStore.writeFile(
					deploymentsPath,
					networkName,
					'.chain',
					JSON.stringify({chainId: expectedChain.chainId, genesisHash: expectedChain.genesisHash}),
				);
				try {
					await deploymentStore.deleteFile(deploymentsPath, networkName, '.chainId');
				} catch {}
			}
		}
	} else {
		return {deployments: {}, migrations: {}};
	}

	let migrations: Record<string, number> = {};
	const migrationsFileName = '.migrations.json';
	if (await deploymentStore.hasFile(deploymentsPath, networkName, migrationsFileName)) {
		try {
			migrations = JSON.parse(await deploymentStore.readFile(deploymentsPath, networkName, migrationsFileName));
		} catch (err) {
			// Kept non-fatal (a run with no migration record still works, it just re-runs scripts
			//  that are idempotent by design), but the message now names the environment and the
			//  CONSEQUENCE. `failed to parse .migrations.json` told a reader neither which
			//  environment's file was broken nor why their scripts had suddenly all re-run.
			console.error(
				`could not parse ${migrationsFileName} for environment '${networkName}' (${err}); continuing as if no ` +
					`script had run yet, so scripts with tags already applied will run again.`,
			);
		}
	}

	for (const fileName of fileNames) {
		if (fileName.substring(fileName.length - 5) === '.json' && fileName !== '.migrations.json') {
			// A record that cannot be read or parsed is FATAL, unlike the migrations file above, and
			//  the difference is what is lost: a missing migration re-runs an idempotent script,
			//  whereas a missing deployment makes rocketh believe a contract was never deployed and
			//  deploy it AGAIN, at a new address, silently replacing what the record described.
			//
			// Wrapped because the raw failure is a `SyntaxError` reading
			//  `Expected property name or '}' in JSON at position 2`, which names neither the file
			//  nor the environment: the one question the reader has is WHICH record is broken.
			let deployment: any;
			try {
				deployment = JSON.parse(await deploymentStore.readFile(deploymentsPath, networkName, fileName));
			} catch (err) {
				throw new Error(
					`could not read the deployment record '${fileName}' of environment '${networkName}' in ` +
						`${deploymentsPath}: ${err}\n` +
						`  rocketh stops rather than continuing without it: a deployment it cannot see is one it would ` +
						`deploy again, at a new address.`,
					{cause: err},
				);
			}
			if (onlyABIAndAddress) {
				deployment = {
					address: deployment.address,
					abi: deployment.abi,
					linkedData: deployment.linkedData,
				};
			}
			const name = fileName.slice(0, fileName.length - 5);
			// console.log('fetching ' + deploymentFileName + '  for ' + name);

			deploymentsFound[name] = deployment;
		}
	}
	return {deployments: deploymentsFound, migrations, chainId, genesisHash};
}

export async function createEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
>(
	userConfig: ResolvedUserConfig<NamedAccounts, Data>,
	resolvedExecutionParams: ResolvedExecutionParams,
	deploymentStore: DeploymentStore,
): Promise<{internal: InternalEnvironment; external: Environment<NamedAccounts, Data, Deployments>}> {
	const rawProvider = resolvedExecutionParams.provider;

	const provider: TransactionHashTracker = new TransactionHashTrackerProvider(rawProvider);

	const chainIdHex = await provider.request({method: 'eth_chainId'});
	const chainId = '' + Number(chainIdHex);
	let genesisHash: `0x${string}` | undefined;
	try {
		// Fetch genesis explicitly via block number 0. We deliberately do NOT use
		// the "earliest" tag: on pruned nodes "earliest" returns the prune-cutoff
		// block (whose hash is not the genesis hash and is unstable across
		// nodes/prune operations), which would cause spurious genesis-mismatch
		// detection. On a pruned node `0x0` throws (geth PrunedHistoryError /
		// reth PrunedHistoryUnavailable) or returns null; in that case we leave
		// genesisHash undefined and the mismatch check is skipped entirely.
		const genesisBlock = await provider.request({method: 'eth_getBlockByNumber', params: ['0x0', false]});
		if (genesisBlock && Number(genesisBlock.number) === 0) {
			genesisHash = genesisBlock.hash as `0x${string}`;
		} else if (genesisBlock) {
			console.warn(
				`Block fetched for '0x0' is not genesis (number: ${Number(genesisBlock.number)}); ignoring as genesis fingerprint.`,
			);
		}
	} catch {
		// genesis unavailable (e.g. pruned node) — no genesis fingerprint
	}

	const deploymentsFolder = userConfig.deployments;
	const environmentName = resolvedExecutionParams.environment.name;
	const saveDeployments = resolvedExecutionParams.saveDeployments;
	let networkTags: {[tag: string]: boolean} = {};
	for (const networkTag of resolvedExecutionParams.environment.tags) {
		networkTags[networkTag] = true;
	}

	const resolvedAccounts: {[name: string]: ResolvedAccount} = {};

	// `eth_accounts` is optional in practice. Execution-only nodes (an in-browser EVM that
	// accepts only signed raw transactions) and plenty of public RPC endpoints reject it, yet it
	// is only NEEDED to resolve INDEX-based named accounts (`{default: 0}`). Failing here would
	// make every such provider unusable even for a config that names accounts by private key or
	// address, so the failure is remembered instead of thrown, and re-raised with its cause if an
	// index-based account actually has to be resolved. Nothing is silently wrong either way: a
	// config that needs remote accounts still fails, and says why.
	let allRemoteAccounts: `0x${string}`[] = [];
	let remoteAccountsError: unknown;
	try {
		allRemoteAccounts = await provider.request({method: 'eth_accounts'});
	} catch (err) {
		remoteAccountsError = err;
	}
	const accountCache: {[name: string]: ResolvedAccount} = {};

	async function getAccount(
		name: string,
		accounts: UnresolvedUnknownNamedAccounts,
		accountDef: AccountType,
	): Promise<ResolvedAccount | undefined> {
		if (accountCache[name]) {
			return accountCache[name];
		}
		let account: ResolvedAccount | undefined;
		if (typeof accountDef === 'number') {
			const accountPerIndex = allRemoteAccounts[accountDef];
			if (accountPerIndex) {
				accountCache[name] = account = {
					type: 'remote',
					address: accountPerIndex,
					signer: provider,
				};
			} else if (remoteAccountsError) {
				throw new Error(
					`named account "${name}" is configured as index ${accountDef}, which requires the node to list ` +
						`its accounts, but 'eth_accounts' failed on this provider. Give "${name}" an address or a ` +
						`signer protocol (for example 'privateKey:0x...') instead of an index.`,
					{cause: remoteAccountsError},
				);
			} else {
				// An index that the node's list does not reach. Same diagnosis as the failure above
				// and it deserves the same actionable message: a provider that answers `eth_accounts`
				// with `[]` (most public RPC endpoints) is indistinguishable, to the user, from one
				// that rejects the call.
				throw new Error(
					`named account "${name}" is configured as index ${accountDef}, but this provider lists ` +
						`${allRemoteAccounts.length} account(s), so there is nothing at that index. Nodes that hold no ` +
						`keys (most public RPC endpoints) answer 'eth_accounts' with an empty list. Give "${name}" an ` +
						`address or a signer protocol (for example 'privateKey:0x...') instead of an index.`,
				);
			}
		} else if (typeof accountDef === 'string') {
			if (accountDef.startsWith('0x')) {
				if (accountDef.length === 66) {
					const privateKeyProtocol = userConfig.signerProtocols?.['privateKey'];
					if (privateKeyProtocol) {
						const namedSigner = await privateKeyProtocol(`privateKey:${accountDef}`);
						const [address] = await namedSigner.signer.request({method: 'eth_accounts'});
						accountCache[name] = account = {
							...namedSigner,
							address,
						};
					}
				} else {
					accountCache[name] = account = {
						type: 'remote',
						address: accountDef as `0x${string}`,
						signer: provider,
					};
				}
			} else {
				if (accountDef.indexOf(':') > 0) {
					const [protocolID, extra] = accountDef.split(':');
					const protocol = userConfig.signerProtocols?.[protocolID];
					if (!protocol) {
						throw new Error(`protocol: ${protocolID} is not supported`);
					}
					const namedSigner = await protocol(accountDef);
					const [address] = await namedSigner.signer.request({method: 'eth_accounts'});
					accountCache[name] = account = {
						...namedSigner,
						address,
					};
				} else {
					const accountFetched = await getAccount(name, accounts, accounts[accountDef]);
					if (accountFetched) {
						accountCache[name] = account = accountFetched;
					}
				}
			}
		} else {
			// TODO allow for canonical chain name ?
			// Check for field existence using 'in' operator to support falsy values including explicit undefined
			const accountForNetwork =
				environmentName in accountDef
					? accountDef[environmentName]
					: chainId in accountDef
						? accountDef[chainId]
						: 'default' in accountDef
							? accountDef['default']
							: undefined;
			if (accountForNetwork !== undefined) {
				const accountFetched = await getAccount(name, accounts, accountForNetwork);
				if (accountFetched) {
					accountCache[name] = account = accountFetched;
				}
			}
		}

		return account;
	}

	if (userConfig.accounts) {
		const accountNames = Object.keys(userConfig.accounts);
		for (const accountName of accountNames) {
			const account = await getAccount(accountName, userConfig.accounts, userConfig.accounts[accountName]);
			if (!account) {
				throw new Error(
					`cannot get account for ${accountName} = ${JSON.stringify(
						userConfig.accounts[accountName],
						null,
						2,
					)}\nEnsure your provider (or hardhat) has some accounts set up for ${environmentName}\n`,
				);
			}
			(resolvedAccounts as any)[accountName] = account;
		}
	}

	const resolvedData: ResolvedNetworkSpecificData<Data> = {} as ResolvedNetworkSpecificData<Data>;
	async function getData<T = unknown>(name: string, dataDef: DataType<T>): Promise<T | undefined> {
		// Check for field existence using 'in' operator to support falsy values including explicit undefined
		const dataForNetwork =
			environmentName in dataDef
				? dataDef[environmentName]
				: chainId in dataDef
					? dataDef[chainId]
					: 'default' in dataDef
						? dataDef['default']
						: undefined;
		return dataForNetwork;
	}

	if (userConfig.data) {
		logger.debug(`getting data for env = ${environmentName}, chainId = ${chainId}`);
		const dataFields = Object.keys(userConfig.data);
		for (const dataField of dataFields) {
			let fieldData = await getData(dataField, userConfig.data[dataField]);
			(resolvedData as any)[dataField] = fieldData;
		}
	}

	const context = {
		accounts: resolvedAccounts,
		data: resolvedData,
		fork: resolvedExecutionParams.environment.fork,
		saveDeployments,
		tags: networkTags,
		autoMine: resolvedExecutionParams.environment.autoMine,
		deleteDeploymentsIfDifferentGenesisHash:
			resolvedExecutionParams.environment.deleteDeploymentsIfDifferentGenesisHash,
	};

	const deployments: UnknownDeployments = {};
	const migrations: Record<string, number> = {};

	const namedAccounts: {[name: string]: EIP1193Account} = {};
	const namedSigners: {[name: string]: Signer} = {};
	const addressSigners: {[name: `0x${string}`]: Signer} = {};

	// `addressSigners` is a lookup map keyed by address, and EVERY reader looks it up with a
	//  lowercased key (`resolveAccount` lowercases both of its branches, `broadcastTransaction`
	//  lowercases `transactionData.from`). The addresses we key it with here are NOT normalised at
	//  the source: a `privateKey`/protocol account resolves to whatever the signer's `eth_accounts`
	//  returns (checksummed, for `eip-1193-signer`), a bare-address account to whatever the user
	//  wrote in the config, and a numbered account to whatever the node returns. So the KEYS are
	//  normalised here. The address VALUES kept in `namedAccounts`/`unnamedAccounts` are
	//  user-visible and deliberately left as resolved.
	for (const entry of Object.entries(resolvedAccounts)) {
		const name = entry[0];
		const {address, ...namedSigner} = entry[1];
		namedAccounts[name] = address;
		addressSigners[address.toLowerCase() as `0x${string}`] = namedSigner;
		namedSigners[name] = namedSigner;
	}

	const unnamedAccounts = allRemoteAccounts.filter((v) => !addressSigners[v.toLowerCase() as `0x${string}`]);
	for (const account of unnamedAccounts) {
		addressSigners[account.toLowerCase() as `0x${string}`] = {
			type: 'remote',
			signer: provider,
		};
	}

	// A named account needs impersonation iff it has no USABLE signer for this run: its resolved
	// signer is `remote` (i.e. we would otherwise ask the node to sign) AND the node does not
	// already list it in `eth_accounts`. `signerOnly` and `wallet` accounts sign without the
	// node, so impersonating them is wasted RPC (and contradicts the helper's own doc comment,
	// which says it exists "for named accounts that don't have private keys available").
	//
	// This is the ONE place the "no usable signer for this run" decision lives, so a later
	// feature (e.g. deliberately simulating a hardware-wallet friction path on a fork by making
	// an account with a real signer a candidate again) can extend the rule here without
	// unpicking a hard-coded assumption at the call site.
	const remoteAccountsLower = new Set(allRemoteAccounts.map((a) => a.toLowerCase()));
	function needsImpersonationForRun(address: `0x${string}`): boolean {
		const lower = address.toLowerCase() as `0x${string}`;
		if (remoteAccountsLower.has(lower)) return false;
		const signer = addressSigners[lower];
		return signer?.type === 'remote';
	}

	const unknownAccounts = Object.values(namedAccounts).filter((address) => needsImpersonationForRun(address));

	// Impersonate unknown accounts if enabled, and REMEMBER which ones succeeded so we can tell
	// `impersonated` apart from `unsignable` below. The helper returns addresses verbatim (they
	// come from `Object.values(namedAccounts)`, which are deliberately un-normalised), so we
	// lowercase before storing to keep the same address-key contract as `addressSigners`.
	const impersonatedAccountsLower = new Set<`0x${string}`>();
	// The addresses impersonation was actually TRIED for. Only ever non-empty when
	// `autoImpersonate` is on, since the helper is a no-op otherwise, and it exists purely so the
	// unknown-signer error can say which of the two silences a user is looking at (attempted and
	// refused vs never a candidate). It is read ONLY when building that message.
	const impersonationAttemptedLower = new Set<`0x${string}`>();
	// Same falsy test the helper itself makes, so "was it enabled?" cannot answer differently
	// here than where the attempt is made.
	const autoImpersonateEnabled = !!resolvedExecutionParams.environment.autoImpersonate;
	if (unknownAccounts.length > 0) {
		if (autoImpersonateEnabled) {
			for (const address of unknownAccounts) {
				impersonationAttemptedLower.add(address.toLowerCase() as `0x${string}`);
			}
		}
		const impersonatedAccounts = await impersonateAccounts(
			rawProvider,
			unknownAccounts,
			resolvedExecutionParams.environment.autoImpersonate,
		);
		for (const address of impersonatedAccounts) {
			impersonatedAccountsLower.add(address.toLowerCase() as `0x${string}`);
		}
		if (impersonatedAccounts.length > 0) {
			logger.debug(`Auto-impersonated ${impersonatedAccounts.length} account(s): ${impersonatedAccounts.join(', ')}`);
		}
	}

	/**
	 * What auto-impersonation did for an address, for the unknown-signer error MESSAGE and
	 * nothing else.
	 *
	 * The impersonation attempt deliberately SWALLOWS an unsupported or refused
	 * `hardhat_impersonateAccount` so the feature degrades gracefully on a provider that is not
	 * a dev node. That silence stays: this only makes its outcome SAYABLE, so a user who
	 * enabled the feature against the wrong kind of node is told so instead of reading an
	 * unknown-signer error that never mentions it.
	 *
	 * It reads node-capability state (ADR 0006) and must therefore stay strictly on the message
	 * path: it is called only where the error is built, INSIDE the `unsignable` branch, never
	 * before the signability check and never as an input to the policy. Returns `undefined`
	 * when `autoImpersonate` was off, which is what keeps the common path's message unchanged.
	 */
	function autoImpersonationOutcomeFor(lower: `0x${string}`): 'attempted' | 'not-a-candidate' | undefined {
		if (!autoImpersonateEnabled) return undefined;
		return impersonationAttemptedLower.has(lower) ? 'attempted' : 'not-a-candidate';
	}

	// Classification runs AFTER impersonation, since impersonation is what moves an address from
	// `unsignable` to `impersonated`. Enumerates every variant of the `Signer` union (three:
	// `signerOnly`, `wallet`, `remote`) so a future variant surfaces as a compile error rather
	// than silently classifying as `unsignable`. Precedence `local` > `node` > `impersonated` >
	// `unsignable` is defensive: it stays correct even if `needsImpersonationForRun` above ever
	// regresses and sweeps a `signerOnly` account back into the candidate set.
	function classifySigner(signer: Signer | undefined, lower: `0x${string}`): Signability {
		if (!signer) return 'unsignable';
		switch (signer.type) {
			case 'signerOnly':
			case 'wallet':
				return 'local';
			case 'remote':
				if (remoteAccountsLower.has(lower)) return 'node';
				if (impersonatedAccountsLower.has(lower)) return 'impersonated';
				return 'unsignable';
		}
	}

	const addressSignabilityMap: {[address: `0x${string}`]: Signability} = {};
	for (const key of Object.keys(addressSigners) as `0x${string}`[]) {
		addressSignabilityMap[key] = classifySigner(addressSigners[key], key);
	}
	// Expose as a Proxy so an address that was never seen during setup reads as `'unsignable'`
	// rather than `undefined`, per the contract on the `Environment` interface. The stored keys
	// are already lowercased (same contract as `addressSigners`); callers pass a lowercased
	// address, as they do for `addressSigners`.
	const addressSignability = new Proxy(addressSignabilityMap, {
		get(target, prop, receiver) {
			if (typeof prop === 'string' && prop.startsWith('0x')) {
				return target[prop as `0x${string}`] ?? 'unsignable';
			}
			return Reflect.get(target, prop, receiver);
		},
	}) as {[address: `0x${string}`]: Signability};

	// The unknown-signer policy for this run, with the scoped-frame stack the wrapper package
	// pushes onto. Resolution of the global (`execution param > chain config > 'auto'`) happens
	// in `resolveExecutionParams`, so this is the already-resolved value.
	const unknownSignerPolicyStack = createUnknownSignerPolicyStack(
		resolvedExecutionParams.environment.onUnknownSigner ?? 'auto',
	);
	// The prompt this run may ask a human with, if any. It rides the resolved run parameters so
	// it is present on EVERY construction path, not just the one that goes through an executor
	// (ADR 0007).
	const promptExecutor = resolvedExecutionParams.promptExecutor;
	/**
	 * Per-CAPABILITY, never per-executor: a `PromptExecutor` can exist and still be unable to
	 * ask a human for free text (`@rocketh/web`'s confirm returns `{proceed: true}` without
	 * asking anyone), so the ABSENCE of `promptText` is what the answer is derived from.
	 */
	function canPromptForText(): boolean {
		return typeof promptExecutor?.promptText === 'function';
	}

	/**
	 * Receipts already fetched for a hash the USER pasted at the interactive
	 * unknown-signer prompt, handed to the pipeline that waits for that same hash next.
	 *
	 * The resolver has to have the receipt BEFORE anything is saved (that is what lets a
	 * failed or unknown transaction leave no state behind), while `savePendingExecution` /
	 * `savePendingDeployment` then wait for the very same hash. Without this the user
	 * watches two waits for one transaction. Entries are consumed on read, so a hash
	 * pasted twice is looked up twice rather than resolving from a stale receipt.
	 */
	const pastedTransactionReceipts = new Map<`0x${string}`, EIP1193TransactionReceipt>();

	/**
	 * The environment side of the policy scope (see the doc on `Environment` in
	 * `@rocketh/core/types`). The push and the pop are BOTH here, so no caller can strand a
	 * frame, and the stack itself is private to this module.
	 */
	async function runUnderUnknownSignerPolicy<T>(frame: UnknownSignerPolicyFrame, action: () => Promise<T>): Promise<T> {
		unknownSignerPolicyStack.push(frame);
		try {
			return await action();
		} finally {
			unknownSignerPolicyStack.pop();
		}
	}

	/**
	 * WHAT THIS RUN SENT, in the order it sent it. Exposed verbatim (same array identity) as
	 * `Environment['capturedTransactions']`, where the contract of the list is documented.
	 *
	 * A plain array, appended to at the single broadcast choke point: the list is DATA on the
	 * environment, not a service, so there is no accumulator object, no hook and no callback to
	 * register. Nothing in rocketh ever reads it back to decide anything.
	 */
	const capturedTransactions: CapturedTransaction[] = [];

	const perliminaryEnvironment = {
		context: {
			saveDeployments: context.saveDeployments,
			autoMine: context.autoMine,
			retry: userConfig.retry,
		},
		name: environmentName,
		tags: context.tags,
		deployments: deployments as Deployments,
		capturedTransactions,
		namedAccounts: namedAccounts as ResolvedNamedAccounts<NamedAccounts>,
		data: resolvedData,
		namedSigners: namedSigners as ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>,
		unnamedAccounts,
		addressSigners: addressSigners,
		addressSignability,
		network: {
			chain: resolvedExecutionParams.chain,
			fork: context.fork,
			provider,
			deterministicDeployment: resolvedExecutionParams.environment.deterministicDeployment,

			// for backward compatibility
			tags: context.tags,
		},
		extra: resolvedExecutionParams.extra || {},
	};

	// const signer = {
	// 	async sendTransaction(
	// 		provider: EIP1193ProviderWithoutEvents,
	// 		account: {
	// 			addresss: EIP1193Account;
	// 			config: unknown;
	// 		},
	// 		transaction: EIP1193TransactionEIP1193DATA
	// 	): Promise<EIP1193DATA> {
	// 		return '0x';
	// 	},
	// };

	// async function sendTransaction(transaction: EIP1193TransactionEIP1193DATA): Promise<EIP1193DATA> {
	// 	return '0x';
	// }

	function get<TAbi extends Abi>(name: string): Deployment<TAbi> {
		const deployment = deployments[name] as Deployment<TAbi>;
		if (!deployment) {
			throw new Error(`no deployment named "${name}" found.`);
		}
		return deployment;
	}

	function getOrNull<TAbi extends Abi>(name: string): Deployment<TAbi> | null {
		return (deployments[name] || null) as Deployment<TAbi> | null;
	}

	function hasMigrationBeenDone(id: string): boolean {
		return migrations[id] ? true : false;
	}

	function recordMigration(id: string): void {
		migrations[id] = Math.floor(Date.now() / 1000);
		if (context.saveDeployments) {
			deploymentStore.writeFileWithChainInfo(
				{chainId, genesisHash},
				deploymentsFolder,
				environmentName,
				'.migrations.json',
				JSON.stringify(migrations),
			);
		}
	}

	function fromAddressToNamedABIOrNull<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]} | null {
		let list: {name: string; artifact: Artifact<Abi>}[] = [];
		for (const name of Object.keys(deployments)) {
			const deployment = deployments[name];
			if (deployment.address.toLowerCase() == address.toLowerCase()) {
				list.push({name, artifact: deployment});
			}
		}
		if (list.length === 0) {
			return null;
		}

		const {mergedABI} = mergeArtifacts(list);
		return {
			mergedABI: mergedABI as unknown as TAbi,
			names: list.map((v) => v.name),
		};
	}

	function fromAddressToNamedABI<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]} {
		const n = fromAddressToNamedABIOrNull<TAbi>(address);
		if (!n) {
			throw new Error(`could not find artifact for address ${address}`);
		}
		return n;
	}

	async function save<TAbi extends Abi>(
		name: string,
		deployment: Deployment<TAbi>,
		options?: {considerItAsFreshDeployment?: boolean},
	): Promise<Deployment<TAbi>> {
		// `numDeployments` counts changes to the RECORD, so a save always moves it, whether
		//  this run performed the change or merely observed one made elsewhere.
		//
		//  `considerItAsFreshDeployment` is the opt-out and it ASSERTS a count of 1 rather
		//  than skipping the increment. It was called `doNotCountAsNewDeployment`, which
		//  promised the weaker thing and silently did this stronger one. Harmless for its two
		//  callers, which both record something deployed exactly once, and a trap for anyone
		//  reaching for it to refresh a record with history worth keeping.
		if (!options?.considerItAsFreshDeployment) {
			let numDeployments = 1;
			const oldDeployment = deployments[name];
			if (oldDeployment) {
				numDeployments = (oldDeployment.numDeployments || 1) + 1;
			}
			deployments[name] = {...deployment, numDeployments};
		} else {
			deployments[name] = {...deployment, numDeployments: 1};
		}
		if (context.saveDeployments) {
			// WRITE THE COUNTED RECORD, not the argument.
			//
			//  This used to serialise `deployment`, the argument, which never carries the
			//  count computed just above. The counter therefore lived for the rest of the run
			//  and vanished, unless a caller happened to build its argument by spreading a
			//  previously-loaded record, which is why some files had the field and others did
			//  not. Anything reading it across runs, `checkUpgradeIndex` above all, was working
			//  from a number that silently restarted.
			//
			//  OMITTED WHILE IT IS 1. One is the overwhelmingly common case and says nothing,
			//  so writing it would add a line to essentially every deployment file every user
			//  has committed, in exchange for no information. Absent already reads back AS one,
			//  because the increment above is `(old.numDeployments || 1) + 1`, so this is a
			//  smaller file rather than a special case anyone downstream has to remember. It
			//  also means a record whose count falls back to 1 (`considerItAsFreshDeployment`)
			//  drops the field again, keeping the file honest in both directions.
			const {numDeployments, ...recordWithoutCount} = deployments[name];
			const recordToWrite = numDeployments && numDeployments > 1 ? deployments[name] : recordWithoutCount;
			deploymentStore.writeFileWithChainInfo(
				{chainId, genesisHash},
				deploymentsFolder,
				environmentName,
				`${name}.json`,
				JSONToString(recordToWrite, 2),
			);
		}
		return deployment;
	}

	async function recoverTransactionsIfAny(): Promise<void> {
		if (!context.saveDeployments) {
			return;
		}
		let existingPendingTansactions: PendingTransaction[];
		try {
			existingPendingTansactions = stringToJSON(
				await deploymentStore.readFile(deploymentsFolder, environmentName, '.pending_transactions.json'),
			);
		} catch {
			existingPendingTansactions = [];
		}
		if (existingPendingTansactions.length > 0) {
			// The entry being recovered has already been `shift`ed off, so writing the list back
			// records "this one is dealt with". It must happen for a transaction that RESOLVED
			// unsuccessfully as well as for one that succeeded: a reverted transaction is never
			// coming back, so leaving it in the file makes every future run replay the same hash
			// and fail identically, with no way out but hand-editing the file.
			const persistRemaining = () =>
				deploymentStore.writeFileWithChainInfo(
					{chainId, genesisHash},
					deploymentsFolder,
					environmentName,
					'.pending_transactions.json',
					JSONToString(existingPendingTansactions, 2),
				);

			// A transient failure (a dropped connection, a node that is not answering) keeps the
			// entry, because that transaction may still be found on the next run. Only a receipt
			// that says the transaction is finished-and-unsuccessful clears it.
			const handleRecoveryFailure = async (e: unknown, spinner: {fail: () => void}) => {
				spinner.fail();
				if (e instanceof UnsuccessfulTransactionError) {
					await persistRemaining();
					console.error(
						`${e.message}\n` +
							`It has been removed from the pending list, since its outcome is now known. ` +
							`Nothing was recorded for it, so THIS run will attempt the work again when the deploy ` +
							`scripts reach it (recovery happens before they run).`,
					);
					return;
				}
				throw e;
			};

			while (existingPendingTansactions.length > 0) {
				const pendingTransaction = existingPendingTansactions.shift();
				if (pendingTransaction) {
					if (pendingTransaction.type === 'deployment') {
						const spinner = spin(
							`recovering ${pendingTransaction.name} with transaction ${pendingTransaction.transaction.hash}`,
						);
						try {
							await waitForDeploymentTransactionAndSave(pendingTransaction);
							await persistRemaining();
							spinner.succeed();
						} catch (e) {
							await handleRecoveryFailure(e, spinner);
						}
					} else {
						const spinner = spin(`recovering execution's transaction ${pendingTransaction.transaction.hash}`);
						const transaction = await provider.request({
							method: 'eth_getTransactionByHash',
							params: [pendingTransaction.transaction.hash],
						});
						try {
							await waitForTransaction(pendingTransaction.transaction.hash, {
								transaction: transaction,
								message: `  tx: {hash}\n      {transaction}`,
							});
							await persistRemaining();
							spinner.succeed();
						} catch (e) {
							await handleRecoveryFailure(e, spinner);
						}
					}
				}
			}
			await deploymentStore.deleteFile(deploymentsFolder, environmentName, '.pending_transactions.json');
		}
	}

	async function savePendingTransaction(pendingTransaction: PendingTransaction) {
		if (context.saveDeployments) {
			let existingPendinTransactions: PendingTransaction[];
			try {
				existingPendinTransactions = stringToJSON(
					await deploymentStore.readFile(deploymentsFolder, environmentName, '.pending_transactions.json'),
				);
			} catch {
				existingPendinTransactions = [];
			}
			existingPendinTransactions.push(pendingTransaction);
			await deploymentStore.writeFileWithChainInfo(
				{chainId, genesisHash},
				deploymentsFolder,
				environmentName,
				'.pending_transactions.json',
				JSONToString(existingPendinTransactions, 2),
			);
		}
		return deployments;
	}

	async function waitForTransactionReceipt(params: {
		hash: EIP1193DATA;
		confirmations?: number;
		// timeout?: number; // TODO
	}): Promise<EIP1193TransactionReceipt> {
		const {hash, pollingInterval} = {pollingInterval: resolvedExecutionParams.pollingInterval, ...params};

		let receipt: EIP1193TransactionReceipt | null = null;
		try {
			receipt = await provider.request({
				method: 'eth_getTransactionReceipt',
				params: [hash],
			});
		} catch (err) {}

		if (!receipt || !receipt.blockHash) {
			await wait(pollingInterval);
			return waitForTransactionReceipt(params);
		}

		if (params.confirmations && params.confirmations > 1) {
			let confirmed = false;
			const latestBlockStr = await provider.request({
				method: 'eth_blockNumber',
			});
			if (latestBlockStr) {
				const latestBlockNumber = Number(latestBlockStr);
				const receiptBlockNumber = Number(receipt.blockNumber);
				if (latestBlockNumber - receiptBlockNumber > params.confirmations - 1) {
					confirmed = true;
				}
			}
			if (!confirmed) {
				await wait(pollingInterval);
				return waitForTransactionReceipt(params);
			}
		}
		return receipt;
	}

	async function deleteTransaction<TAbi extends Abi = Abi>(hash: string) {
		if (context.saveDeployments) {
			let existingPendinTransactions: PendingTransaction[];
			try {
				existingPendinTransactions = stringToJSON(
					await deploymentStore.readFile(deploymentsFolder, environmentName, '.pending_transactions.json'),
				);
			} catch {
				existingPendinTransactions = [];
			}
			existingPendinTransactions = existingPendinTransactions.filter((v) => v.transaction.hash !== hash);
			if (existingPendinTransactions.length === 0) {
				await deploymentStore.deleteFile(deploymentsFolder, environmentName, '.pending_transactions.json');
			} else {
				await deploymentStore.writeFileWithChainInfo(
					{chainId, genesisHash},
					deploymentsFolder,
					environmentName,
					'.pending_transactions.json',
					JSONToString(existingPendinTransactions, 2),
				);
			}
		}
	}

	async function waitForTransaction(
		hash: `0x${string}`,
		info?: {
			message?: string;
			transaction?: EIP1193Transaction | null;
			/**
			 * Set by the ONE caller that raises its own, richer failure (the pasted-transaction
			 * path, which also has to tell the user what still needs executing). Everyone else
			 * gets the check below.
			 */
			ownStatusCheck?: boolean;
		},
	): Promise<EIP1193TransactionReceipt> {
		let message = `  - Broadcasting tx:\n      ${hash}${
			info?.transaction ? `\n      ${displayTransaction(info?.transaction)}` : ''
		}`;
		if (info?.message) {
			message = info.message.replaceAll('{hash}', hash);
			if (info?.transaction) {
				message = message.replaceAll('{transaction}', displayTransaction(info.transaction));
			} else {
				message = message.replaceAll('{transaction}', '(tx not found)');
			}
		}
		const alreadyFetched = pastedTransactionReceipts.get(hash);
		if (alreadyFetched) {
			// Already waited for, right after it was pasted. The message is still shown (the
			// run should say what it is doing) but nothing is polled a second time.
			pastedTransactionReceipts.delete(hash);
			spin(message).succeed();
			return alreadyFetched;
		}
		const spinner = spin(message);
		let receipt: EIP1193TransactionReceipt;
		try {
			receipt = await waitForTransactionReceipt({
				hash,
				confirmations: resolvedExecutionParams.environment.confirmationsRequired,
			});
		} catch (e) {
			spinner.fail();
			throw e;
		}
		if (!receipt) {
			spinner.fail();
			throw new Error(`receipt for ${hash} not found`);
		}

		// A REVERTED transaction is not a completed one. This is the single choke point every
		// normal-path receipt passes through, and until this check existed only the pasted-
		// transaction path looked at the status at all: a deploy whose transaction reverted was
		// recorded as a success, so (for example) a proxy could be saved pointing at an
		// implementation that was never created, and the failure only surfaced later as a call
		// returning "0x". Failing here means nothing is saved for a transaction that did not run.
		if (!info?.ownStatusCheck && !receiptSucceeded(receipt)) {
			spinner.fail();
			throw new UnsuccessfulTransactionError(hash, receipt);
		}

		spinner.succeed();
		return receipt;
	}

	async function waitForDeploymentTransactionAndSave<TAbi extends Abi = Abi>(
		pendingDeployment: PendingDeployment<TAbi>,
		info?: {message?: string; transaction?: EIP1193Transaction | null},
	): Promise<Deployment<TAbi>> {
		const nameToDisplay = pendingDeployment.name || '<no name>';
		let message = `  - Deploying ${nameToDisplay} with tx:\n      {hash}\n      {transaction}`;
		if (info?.message) {
			message = info.message.replaceAll('{name}', nameToDisplay);
		}

		const receipt = await waitForTransaction(pendingDeployment.transaction.hash, {
			transaction: info?.transaction,
			message,
		});

		// TODO we could make pendingDeployment.expectedAddress a spec for fetching address from event too
		const contractAddress = pendingDeployment.expectedAddress || receipt.contractAddress;
		if (!contractAddress) {
			console.error(receipt);
			throw new Error(`no contract address found for ${nameToDisplay}`);
		}

		showMessage(`    => ${contractAddress}`);

		const {abi, ...partialDeploymentWithoutABI} = pendingDeployment.partialDeployment;

		if (!pendingDeployment.transaction.nonce) {
			// const spinner = spin(`fetching nonce for ${pendingDeployment.transaction.hash}`);
			let transaction: EIP1193Transaction | null = null;
			try {
				transaction = await provider.request({
					method: 'eth_getTransactionByHash',
					params: [pendingDeployment.transaction.hash],
				});
			} catch (e) {
				// spinner.fail(`failed to get transaction, even after receipt was found`);
				throw e;
			}
			if (!transaction) {
				// spinner.fail(`tx ${pendingDeployment.transaction.hash} not found,  even after receipt was found`);
				// or : spinner.stop();
			} else {
				// spinner.stop();
			}

			if (transaction) {
				pendingDeployment.transaction = {
					nonce: transaction.nonce,
					hash: transaction.hash,
					origin: transaction.from,
				};
			}
		}

		// TODO options
		for (const key of Object.keys(partialDeploymentWithoutABI)) {
			if (key.startsWith('_')) {
				delete (partialDeploymentWithoutABI as any)[key];
			}
			if (key === 'evm') {
				if (partialDeploymentWithoutABI.evm) {
					if ('gasEstimates' in partialDeploymentWithoutABI['evm']) {
						const {gasEstimates} = partialDeploymentWithoutABI.evm;
						partialDeploymentWithoutABI.evm = {
							gasEstimates,
						};
					}
				}
			}
		}

		const deployment = {
			address: contractAddress,
			abi,
			...partialDeploymentWithoutABI,
			transaction: pendingDeployment.transaction,
			receipt: {
				blockHash: receipt.blockHash,
				blockNumber: receipt.blockNumber,
				transactionIndex: receipt.transactionIndex,
			},
		};
		if (pendingDeployment.name) {
			return save(pendingDeployment.name, deployment);
		} else {
			return deployment;
		}
	}

	/**
	 * The single broadcast choke point. Deliberately NOT exported and absent from the
	 * `Environment` interface: it is reached only through `broadcastExecution` and
	 * `broadcastDeployment`.
	 *
	 * `source` says which funnel produced this transaction (see {@link BroadcastSource}).
	 * Its `contract` metadata is used ONLY to enrich an `UnknownSignerError`, and is
	 * THREADED down here rather than caught-and-rethrown one level up in
	 * `broadcastExecution`, deliberately: the error is then constructed ONCE, at the single
	 * site that already knows the unsignable `from` and owns the message, so the stack
	 * points at the seam and there is no second construction path to keep in sync.
	 * Catch-and-rethrow was the alternative; it would have kept this signature narrower, but
	 * at the cost of rebuilding the error (or mutating `error.data` after the fact) in every
	 * public funnel that ever wants to enrich it, and of a second place where the message
	 * shape is decided. Widening a private closure's parameter list is the cheaper of the
	 * two, since it has no exported surface to keep stable. The deployment member carries
	 * `expectedAddress` for the same reason: the interactive path's address invariants have
	 * to run HERE, before anything is saved or tracked, and this is where that fact arrives.
	 */
	async function broadcastTransaction(
		transaction: TransactionToBroadcast,
		source: BroadcastSource,
	): Promise<`0x${string}`> {
		if (transaction.type === 'raw') {
			const txHash = await env.network.provider.request({
				method: 'eth_sendRawTransaction',
				params: [transaction.raw],
			});
			// CAPTURED AS ITSELF, and with NO `signability`. rocketh did not compose this
			// transaction and holds no signer for it (it is a relay of an already-signed payload,
			// the Nick's-method factory deployment above all), so there is no signer question to
			// answer for it; asking `addressSignability` would answer `'unsignable'` for a relayer
			// that is not a run account, and this system reads that as "a human already sent it out
			// of band, do not replay it", said of the one entry a fresh-node replay MUST send.
			capturedTransactions.push({type: 'raw', from: transaction.from, raw: transaction.raw});
			if (env.context.autoMine) {
				await (env.network.provider as any).request({method: 'evm_mine', params: []});
			}
			return txHash;
		} else {
			const transactionData = transaction.data;
			const from = transactionData.from.toLowerCase() as `0x${string}`;

			// THE UNKNOWN-SIGNER SEAM. This is the single choke point every transaction funnels
			// through (`deploy`, `execute`, `tx`, the proxy upgrade path), which is why the check
			// lives here ONCE instead of at each call site as hardhat-deploy v1 did.
			//
			// It decides on SIGNABILITY, not on the presence of a signer entry: a named account
			// declared as a bare address always HAS an entry (`{type:'remote', signer: provider}`),
			// so a presence check could never fire for a named Safe. Of the four states
			// (`local`, `node`, `impersonated`, `unsignable`), only `unsignable` reaches the policy;
			// the other three broadcast exactly as before. Auto-impersonation has already run by
			// now, so an account it resolved never gets here — `autoImpersonate` (a node capability)
			// and `onUnknownSigner` (a policy) stay orthogonal (ADR 0006).
			if (env.addressSignability[from] === 'unsignable') {
				// The policy frame is consulted HERE, inside the `unsignable` branch, and nowhere
				// else: a frame pushed by `catchUnknownSigner` forces `throw` over `ask`, NEVER over
				// impersonation. Reading it before the signability check would turn every signable
				// call inside a wrapper into a throw, breaking the mixed run and silently changing
				// what a fork test does.
				const policy = unknownSignerPolicyStack.effective();
				// `from` is carried VERBATIM from the transaction (not the lowercased lookup key):
				// this error IS the transaction the user has to execute out-of-band.
				// `contract` is present only when the caller said this transaction IS a contract
				// call (`execute` / `executeByName`); a plain `tx`, a value transfer and a deploy
				// leave it unset, because they have no function to name.
				// The deployment name is resolved HERE, on the error path only, through the
				// environment's existing reverse lookup rather than a second hand-rolled one
				// (ADR 0006 predates that helper). It is opportunistic: an address matching no
				// deployment leaves `name` ABSENT (not `undefined`-valued) and the printed
				// message falls back to `to`. An address CAN carry several names (a proxy and
				// its implementation record commonly share one); the first is used, since this
				// is presentation-only enrichment and the unambiguous `to` is printed anyway.
				let contract: UnknownSignerContractCall | undefined;
				if (source.type === 'execution' && source.contract) {
					let name: string | undefined;
					if (transactionData.to) {
						try {
							name = fromAddressToNamedABIOrNull(transactionData.to)?.names[0];
						} catch (e) {
							// The lookup MERGES the ABIs of every deployment at the address and throws on
							// a selector conflict (`mergeArtifacts`). Enriching a name must never be able
							// to replace the error the user actually needs with an unrelated one, so a
							// conflicting address simply goes unnamed and the message falls back to `to`.
							logger.warn(`could not resolve a deployment name for ${transactionData.to}: ${e}`);
						}
					}
					contract = name ? {name, ...source.contract} : {...source.contract};
				}
				// The auto-impersonation note is attached HERE, on the error-building path only, and is
				// presentation-only: it reports what a node capability did BEFORE this seam, and is not
				// consulted by (nor able to reach) the policy decision above. Absent whenever
				// `autoImpersonate` was off, so the common path's message is byte-for-byte unchanged.
				const unknownSignerData = {
					from: transactionData.from,
					to: transactionData.to,
					data: transactionData.data,
					value: transactionData.value,
					contract,
					autoImpersonation: autoImpersonationOutcomeFor(from),
				};
				// The error is BUILT here whichever way this goes: it is what the throw path
				// throws AND what the interactive path shows the human, so the two can never
				// drift into showing different amounts of what has to be executed.
				let unknownSignerError = new UnknownSignerError(unknownSignerData);
				if (remoteAccountsError) {
					// A provider whose `eth_accounts` failed has NO list of node-held accounts, so
					// every address configured plainly (rather than with signing material) lands here
					// looking like an account nobody can sign for. Without this note the user sees an
					// unknown-signer error that never mentions the failure that actually caused it.
					const reason =
						remoteAccountsError instanceof Error ? remoteAccountsError.message : String(remoteAccountsError);
					unknownSignerError = new UnknownSignerError(
						unknownSignerData,
						`${unknownSignerError.message}\n\n` +
							`Note: this provider could not list its accounts ('eth_accounts' failed: ${reason}), so rocketh ` +
							`does not know of ANY node-held account. If you expected the node to hold this one, that is the ` +
							`likely cause; otherwise give the account signing material (for example 'privateKey:0x...').`,
					);
				}

				// CAPABILITY IS A CEILING (ADR 0007): `'auto'` becomes `'ask'` only where a text
				// prompt genuinely exists, and an explicit `'ask'` degrades to `'throw'` rather
				// than hanging a run that cannot reach a human. This is the ONE place
				// `canPromptForText()` is consulted.
				const canAsk = canPromptForText();
				const behaviour = resolveUnknownSignerBehaviour(policy, {canPromptForText: canAsk});
				if (behaviour === 'throw') {
					// A run that ASKED to resolve interactively and simply could not is the most
					// confusing way to meet this error, because the documented default pauses and
					// takes a pasted hash. Say why that did not happen here. Silent on an explicit
					// `'throw'` (which includes every `catchUnknownSigner` action), since nothing
					// degraded for a run that asked for exactly this.
					const degradation = describeUnknownSignerCapabilityDegradation(policy, {canPromptForText: canAsk});
					// And why the transaction will be handed to them AGAIN next time. This one is
					// silent for a SCOPED `'throw'` only (`catchUnknownSigner`, whose script keeps
					// running) rather than for every explicit `'throw'`: a run-level `'throw'` really
					// does halt here with nothing recorded, which is the hazard ADR 0012 says nothing
					// warns about. Both notes are composed here so the seam has ONE place that decides
					// what a deferral message says.
					const repeatExecution = describeDeferralRepeatExecution(behaviour, {
						scopedPolicy: unknownSignerPolicyStack.scopedPolicy(),
					});
					const notes = [degradation, repeatExecution].filter((note): note is string => note !== undefined);
					if (notes.length > 0) {
						throw new UnknownSignerError(unknownSignerData, [unknownSignerError.message, ...notes].join('\n\n'));
					}
					throw unknownSignerError;
				}

				// INTERACTIVE RESOLUTION. `promptText` is present because `canPromptForText()`
				// just said so; the non-null assertion is that check, one line up.
				//
				// The resolver is NOT gated to executions: it lives at the shared choke point, so
				// a DEPLOYMENT from an unsignable `from` resolves interactively too, inherits the
				// successful-status invariant below, and then gets the ADDRESS invariants that an
				// execution cannot have (`requireDeployedContract`).
				//
				// ASK, LOOK UP, AND ASK AGAIN IF THIS NODE HAS NEVER HEARD OF THE HASH. The loop
				// exists because the two commonest ways a paste fails (a truncated line, a
				// character the terminal ate, the right hash a moment before the RPC caught up)
				// used to cost the whole run: giving up printed the transaction again and threw.
				// Re-asking with the value pre-filled turns that into an edit.
				//
				// IT TERMINATES because every iteration spends at least one unit of `budget`
				// inside `askForExecutedTransactionHash` (a single shared budget, also spent by
				// the malformed-paste re-asks INSIDE that call), and an empty budget answers
				// `cannot-sign` without asking anything, which leaves through the `throw` below.
				// So the pause costs at most `MAX_HASH_PROMPT_ATTEMPTS` questions no matter how
				// the two kinds of bad answer are interleaved, and no wall clock is involved.
				const budget = createHashPromptBudget();
				let previousAnswer: string | undefined;
				let accepted:
					{hash: `0x${string}`; receipt: EIP1193TransactionReceipt; transaction: EIP1193Transaction} | undefined;
				while (!accepted) {
					const answer = await askForExecutedTransactionHash({
						promptText: promptExecutor!.promptText!,
						// Routed through `env` (not the local closure) so a caller/test that replaces
						// `showMessage` sees what the human was shown.
						showMessage: (message) => env.showMessage(message),
						// The error MESSAGE is the deliverable of the deferral workflow, so the
						// interactive path shows exactly it, never a summary of it.
						details: unknownSignerError.message,
						from: transactionData.from,
						budget,
						previousAnswer,
					});
					if (answer.type === 'cannot-sign') {
						// "cannot sign" DEGRADES to the defer path: the same error, undegraded, so it
						// is caught by `catchUnknownSigner` exactly as an unwrapped throw would be.
						// A budget spent on hashes nobody could find arrives HERE too, rather than at
						// the bespoke "not found" failure this path used to raise: one pause has one
						// giving-up outcome, and deferring is the one that a `catchUnknownSigner`
						// wrapper can still handle.
						logger.debug(`interactive unknown-signer resolution declined (${answer.reason})`);
						throw unknownSignerError;
					}

					// The transaction has to be FOUND on this network and have SUCCEEDED before the
					// run records anything: checked BEFORE anything is saved or tracked, so a failed,
					// or simply non-existent, transaction leaves no state behind at all.
					const located = await waitForPastedTransaction(answer.hash, unknownSignerError);
					if (located.type === 'not-found') {
						// The message that used to be the failure, minus the transaction to execute:
						// the human is still looking at the pause that printed it, and the deferral at
						// the end of the budget prints it again anyway.
						env.showMessage(
							`  - the transaction you pasted (${answer.hash}) was not found on this network: after ` +
								`${PASTED_TRANSACTION_LOOKUP_ROUNDS} attempts the node still does not know it. Check you ` +
								`pasted the hash of a transaction executed on this very network. Nothing was saved.` +
								describeRemainingAttempts(budget),
						);
						// Carried into the next ask so the human edits it rather than retyping it.
						previousAnswer = answer.hash;
						continue;
					}
					accepted = {hash: answer.hash, receipt: located.receipt, transaction: located.transaction};
				}
				const {hash: acceptedHash, receipt, transaction: pastedTransaction} = accepted;

				// A DEPLOYMENT is held to a stricter standard than an execution, because it HAS an
				// address to anchor on. Checked here, at the same point as the status and before
				// anything is saved or tracked, so a hash that deployed nothing leaves no state.
				// Run on the hash finally ACCEPTED, which after a re-ask is not the first one
				// pasted.
				if (source.type === 'deployment') {
					await requireDeployedContract(source, receipt, acceptedHash, unknownSignerError);
				} else {
					// IS IT THE TRANSACTION WE ASKED FOR? A successful receipt used to be the whole of
					//  the check for an execution, so an unrelated successful hash was taken at face
					//  value. It cannot be a straight comparison either: a Safe execution goes TO the
					//  Safe carrying our call inside it, so `to` and `data` legitimately differ. The
					//  classifier ranks the evidence instead, and only a total absence of it involves the
					//  human (see `pastedTransactionIntent.ts` for the tiers and why `none` must not be a
					//  refusal).
					const evidence = classifyPastedTransaction(unknownSignerError.data, pastedTransaction);
					const finding = describeEvidence(evidence, unknownSignerError.data);

					if (evidence.tier === 'none') {
						const confirmation = await confirmUnrelatedTransaction({
							promptText: promptExecutor!.promptText!,
							showMessage: (message) => env.showMessage(message),
							finding,
							hash: acceptedHash,
						});
						if (confirmation.type === 'rejected') {
							// DEGRADES to the defer path, exactly as "cannot sign" does: the same error,
							//  undegraded, so `catchUnknownSigner` handles it identically and nothing is saved
							//  for a transaction the user would not vouch for.
							logger.debug(`pasted transaction ${acceptedHash} not confirmed (${confirmation.reason})`);
							throw unknownSignerError;
						}
					} else {
						// Say WHY it was believed: the run is about to record a privileged operation as
						//  done on the strength of this.
						env.showMessage(`  - accepted: the transaction you pasted ${finding}`);
					}
				}

				// The tracker only records hashes it OBSERVES on `eth_sendTransaction` /
				// `eth_sendRawTransaction`, so a transaction executed elsewhere would be invisible
				// to it and gas reporting (which iterates this list) would silently omit it.
				provider.transactionHashes.push(acceptedHash);

				// Hand the receipt to the pipeline about to wait for this same hash, so the user
				// does not watch two waits for one transaction.
				pastedTransactionReceipts.set(acceptedHash, receipt);

				// CAPTURED, and only HERE: every earlier exit from this branch either deferred the
				// transaction (the `throw` policy, "cannot sign", a paste the user would not vouch
				// for) or failed to find it landed and successful, and none of those happened. What
				// is recorded is the intent ROCKETH ASKED FOR, not the transaction the human sent:
				// a Safe execution goes TO the Safe carrying the call inside it, so the intent is
				// both the cleaner thing to replay and the only one this run composed. Its
				// `signability` is `'unsignable'` by construction (this branch is entered on nothing
				// else), which is exactly what tells a batch consumer a human ALREADY executed it
				// and it must never be re-proposed.
				capturedTransactions.push(toCapturedIntent(transactionData, 'unsignable'));

				// Returning the hash lets the SAME pipeline a normal broadcast uses take over
				// (`savePendingExecution` / `savePendingDeployment` → `eth_getTransactionByHash`
				// → `waitForTransaction`). Nothing about pending state or receipt waiting is
				// reimplemented here.
				return acceptedHash;
			}

			const signer = env.addressSigners[from];

			// Defensive: the signability view and `addressSigners` are built from the same keys, so
			// they cannot disagree today (the casing defect that once made them disagree was fixed in
			// `09ea46d`). This guards FUTURE divergence, and makes it a clear error naming the
			// address instead of a `TypeError` on `undefined` one line down.
			if (!signer) {
				throw new Error(
					`no signer entry for ${from}, even though it is classified as "${env.addressSignability[from]}" (signable). ` +
						`This is an internal inconsistency between addressSignability and addressSigners.`,
				);
			}

			// The `Signer` union has THREE variants and they are easy to get backwards, so all of
			// them are enumerated here (see CONTEXT.md under `signer`): `wallet` (an external wallet
			// provider) and `remote` (the node) sign via `eth_sendTransaction`, while `signerOnly`
			// (what the `privateKey` protocol and hardware/HSM protocols return) signs locally and
			// then sends raw. Routing is unchanged by this seam.
			switch (signer.type) {
				case 'wallet':
				case 'remote': {
					const txHash = await signer.signer.request({
						method: 'eth_sendTransaction',
						params: [transactionData],
					});

					// CAPTURED on the SUCCESS path of this arm, never at the entry of the function:
					// every branch here returns or throws, so there is no single post-send line, and
					// capturing at the top would record work a refusing node never did.
					capturedTransactions.push(toCapturedIntent(transactionData, env.addressSignability[from]));

					if (env.context.autoMine) {
						await (env.network.provider as any).request({method: 'evm_mine', params: []});
					}

					return txHash;
				}
				case 'signerOnly': {
					// A local signer has no provider, so anything left unset here is signed as zero and
					// the transaction is refused by any correct node ("intrinsic gas too low: have 0").
					const preparedData = await prepareForLocalSigning(env.network.provider, transactionData);
					const rawTx = await signer.signer.request({
						method: 'eth_signTransaction',
						params: [preparedData],
					});

					const txHash = await env.network.provider.request({
						method: 'eth_sendRawTransaction',
						params: [rawTx],
					});

					// The INTENT, not `preparedData` and not the signed payload: a locally signed
					// transaction commits to the nonce, gas and fees filled in just above, and an entry
					// carrying those would invite a consumer to replay them.
					capturedTransactions.push(toCapturedIntent(transactionData, env.addressSignability[from]));

					if (env.context.autoMine) {
						await (env.network.provider as any).request({method: 'evm_mine', params: []});
					}

					return txHash;
				}
				default: {
					// Exhaustive over the `Signer` union: adding a fourth variant without a case fails
					// to compile here rather than silently returning `undefined` as a tx hash and
					// blowing up confusingly downstream in `savePendingExecution`. The runtime throw
					// covers cast / JS-caller / user-supplied-`signerProtocols` paths that violate
					// their own type contract. Mirrors the idiom in `unknownSignerPolicy.ts`.
					const exhaustive: never = signer;
					throw new Error(`unhandled signer type: ${(exhaustive as {type: string}).type}`);
				}
			}
		}
	}

	/**
	 * Turn a hash the user PASTED into a receipt this run may act on, report that this
	 * node has never heard of it, or fail loudly.
	 *
	 * Two things can be wrong with a pasted hash, and they need different treatment:
	 *
	 * - THIS NODE HAS NEVER HEARD OF IT (pasted from the wrong chain or the wrong tab, or
	 *   a typo that is still 64 hex characters). The lookup is BOUNDED
	 *   ({@link PASTED_TRANSACTION_LOOKUP_ROUNDS} rounds at the run's own polling
	 *   interval, enough for a just-broadcast transaction to reach this node) and then
	 *   RETURNS `not-found`. Polling for it for ever would park the run behind a spinner
	 *   with Ctrl-C as the only exit.
	 *
	 *   Returning rather than throwing is what lets the caller RE-ASK with the hash
	 *   pre-filled instead of ending the run on a dropped character; the bound the throw
	 *   used to enforce moves up with it, to the shared budget of questions one pause may
	 *   ask (`MAX_HASH_PROMPT_ATTEMPTS`). This function stays bounded either way, which is
	 *   what makes that composition safe.
	 * - IT EXISTS BUT HAS NOT SUCCEEDED (yet). Once the node knows the transaction, the
	 *   wait for its receipt is the ORDINARY unbounded one any transaction rocketh sends
	 *   itself gets, confirmations included: a Safe execution can legitimately take a
	 *   while to mine. The receipt's own status is then the correctness backbone: there
	 *   is no bespoke verification layer, and deliberately no attempt to decode a
	 *   MultiSend/Timelock payload or to match `to`/`data` (the accepted residual risk,
	 *   documented under "Handling unknown signers").
	 *
	 *   A receipt that did NOT succeed still THROWS here, and is deliberately not re-asked:
	 *   the node knows exactly what happened to that transaction and asking again cannot
	 *   change it, so the run stops with the reverting hash and the transaction that still
	 *   needs executing both named.
	 *
	 * Nothing is saved and nothing is tracked on any of these outcomes: this runs before
	 * the pending-transaction file, the gas tracker and the deployment record.
	 */
	async function waitForPastedTransaction(
		hash: `0x${string}`,
		unknownSignerError: UnknownSignerError,
	): Promise<
		{type: 'found'; receipt: EIP1193TransactionReceipt; transaction: EIP1193Transaction} | {type: 'not-found'}
	> {
		const lookupSpinner = spin(`  - Looking for the transaction you pasted:\n      ${hash}`);
		let transaction: EIP1193Transaction | null = null;
		for (let round = 1; !transaction; round++) {
			try {
				transaction = await provider.request({
					method: 'eth_getTransactionByHash',
					params: [hash],
				});
			} catch (e) {
				logger.debug(`could not look up the pasted transaction ${hash}: ${e}`);
			}
			if (!transaction) {
				if (round >= PASTED_TRANSACTION_LOOKUP_ROUNDS) {
					lookupSpinner.fail();
					// WHY it gave up is said by the caller, which is the one that knows whether the
					// human gets another go at it.
					return {type: 'not-found'};
				}
				await wait(resolvedExecutionParams.pollingInterval);
			}
		}
		lookupSpinner.succeed();

		const receipt = await waitForTransaction(hash, {
			transaction,
			message: `  - Waiting for the transaction you pasted:\n      {hash}`,
			// This path raises its own failure below, which also reports what still needs executing.
			ownStatusCheck: true,
		});

		if (!receiptSucceeded(receipt)) {
			throw new Error(
				`The transaction you pasted (${hash}) did not succeed: its receipt reports status ` +
					`${receipt.status === undefined ? '<absent>' : receipt.status}, and rocketh requires a successful ` +
					`status before it records anything. Nothing was saved.\n` +
					`The transaction that still needs executing:\n${unknownSignerError.message}`,
			);
		}
		// The TRANSACTION travels with the receipt because the caller has to weigh whether this is
		//  the transaction it asked for, and only the transaction carries `to` / `input` / `value`.
		//  It was fetched above anyway, so this costs no extra call.
		return {type: 'found', receipt, transaction};
	}

	/**
	 * Prove that the transaction the user PASTED actually deployed the contract about to be
	 * recorded, or fail loudly having recorded nothing.
	 *
	 * This is what an execution cannot have. An execution has no address to anchor on, so
	 * its accepted residual risk is that a successful-but-unrelated hash is taken at face
	 * value; a deployment DOES have one, so it is held to the stricter standard.
	 *
	 * Which address is checked follows which address would be SAVED
	 * (`waitForDeploymentTransactionAndSave` computes it as `expectedAddress || receipt.contractAddress`):
	 *
	 * - EXPECTED ADDRESS KNOWN (a deterministic or factory deploy: the address was computed
	 *   from bytecode and salt before broadcast, and is preferred over the receipt's). The
	 *   confirmation is CODE AT THAT ADDRESS — deliberately not transaction parsing, which
	 *   would have to decode whatever wrapper the multisig executed, and not the receipt's
	 *   `contractAddress` either, which for a factory deploy names the factory call rather
	 *   than the contract created inside it. Note the receipt's own contract address is then
	 *   IGNORED even when present: the address that gets recorded is the expected one, so it
	 *   is the only one worth confirming.
	 * - NO EXPECTED ADDRESS (an ordinary deploy). The receipt's `contractAddress` IS the
	 *   answer, and it has to be usable: present AND not the zero address. The zero address
	 *   is called out because it is truthy, so every `if (!contractAddress)` waves it
	 *   through, and it is exactly what a receipt that created no contract tends to report.
	 *
	 * NORMAL BROADCASTS DO NOT COME HERE, on purpose: rocketh sent those transactions
	 * itself, so there is nothing to distrust, and a code check on every deterministic
	 * deploy would be a NEW failure mode (a node lagging a block) for a path this task did
	 * not set out to change.
	 */
	async function requireDeployedContract(
		deployment: {name: string; expectedAddress?: `0x${string}`},
		receipt: EIP1193TransactionReceipt,
		hash: `0x${string}`,
		unknownSignerError: UnknownSignerError,
	): Promise<void> {
		// Both failures name the DEPLOYMENT, the pasted HASH and the transaction that still
		// needs executing, because those are what it takes to work out what went wrong.
		const stillNeeded = `Nothing was saved.\nThe transaction that still needs executing:\n${unknownSignerError.message}`;

		const expectedAddress = deployment.expectedAddress;
		if (expectedAddress) {
			let code: EIP1193DATA;
			try {
				code = await provider.request({method: 'eth_getCode', params: [expectedAddress, 'latest']});
			} catch (e) {
				// Unable to CONFIRM is not the same as confirmed, and this path exists precisely so
				// that an unconfirmed deployment is never recorded.
				throw new Error(
					`Could not check whether ${deployment.name} was deployed at its expected address ${expectedAddress} ` +
						`after you pasted ${hash}: the node failed to answer eth_getCode (${e}). ${stillNeeded}`,
				);
			}
			if (!code || code === '0x') {
				throw new Error(
					`The transaction you pasted (${hash}) did not deploy ${deployment.name}: there is no code at ` +
						`${expectedAddress}, the address this deployment was computed to land at. rocketh confirms a ` +
						`deployment with a known address by looking for code at it, so it will not record ${deployment.name} ` +
						`at an address holding nothing. Check you pasted the hash of the transaction that deploys ` +
						`${deployment.name}. ${stillNeeded}`,
				);
			}
			return;
		}

		const contractAddress = receipt.contractAddress;
		if (!contractAddress || contractAddress.toLowerCase() === ZERO_ADDRESS) {
			throw new Error(
				`The transaction you pasted (${hash}) created no contract, so rocketh cannot record ${deployment.name}: ` +
					`its receipt reports ${contractAddress ? `the zero address (${contractAddress})` : 'no contract address'} ` +
					`as the contract it created. Check you pasted the hash of the transaction that deploys ` +
					`${deployment.name}. ${stillNeeded}`,
			);
		}
	}

	async function broadcastExecution(
		transaction: TransactionToBroadcast,
		options?: {message?: string; contract?: Omit<UnknownSignerContractCall, 'name'>},
	): Promise<EIP1193TransactionReceipt> {
		const txHash = await broadcastTransaction(transaction, {type: 'execution', contract: options?.contract});

		const from = transaction.type == 'raw' ? transaction.from : transaction.data.from;

		const pendingExecution: PendingExecution = {
			type: 'execution',
			// `origin` IS NOT NORMALISED, and that is the rule for all five sites that write it.
			// It is a persisted RECORD VALUE, not a lookup key: nothing in this repo reads it
			// back, it reaches the deployment record (`Deployment.transaction.origin`) and the
			// pending-transaction files, and from there a human or an external tool. So it keeps
			// the address as RESOLVED (EIP-55 checksum intact), exactly as `namedAccounts` and
			// `unnamedAccounts` deliberately do, and the re-hydration paths keep what the node
			// returned. Contrast `addressSigners`, which IS a lookup map and is therefore keyed
			// lowercase: internal keys normalise, user-visible values do not. If anything ever
			// starts MATCHING on `origin`, it must lowercase at the comparison rather than
			// change what is stored — records written before this rule hold lowercased values.
			transaction: {hash: txHash, origin: from},
			// description, // TODO
			// TODO we should have the nonce, except for wallet like metamask where it is not sure you get the nonce you start with
		};
		return savePendingExecution(pendingExecution, options?.message);
	}

	async function savePendingExecution(
		pendingExecution: PendingExecution,
		msg?: string,
	): Promise<EIP1193TransactionReceipt> {
		await savePendingTransaction(pendingExecution);
		let transaction: EIP1193Transaction | null = null;
		const spinner = spin(); // TODO spin(`fetching tx from peers ${pendingDeployment.txHash}`);
		try {
			transaction = await provider.request({
				method: 'eth_getTransactionByHash',
				params: [pendingExecution.transaction.hash],
			});
		} catch (e) {
			spinner.fail();
			throw e;
		}
		if (!transaction) {
			// spinner.fail(`execution tx ${pendingExecution.transaction.hash} not found in the mempool yet`);
			spinner.stop();
		} else {
			spinner.stop();
		}

		if (transaction) {
			pendingExecution.transaction.nonce = transaction.nonce;
			pendingExecution.transaction.origin = transaction.from;
		}

		const receipt = await waitForTransaction(pendingExecution.transaction.hash, {transaction, message: msg});

		await deleteTransaction(pendingExecution.transaction.hash);
		return receipt;
	}

	async function broadcastDeployment<TAbi extends Abi = Abi>(
		name: string,
		transaction: TransactionToBroadcast,
		partialDeployment: PartialDeployment<TAbi>,
		options?: {message?: string; expectedAddress?: `0x${string}`},
	): Promise<Deployment<TAbi>> {
		const txHash = await broadcastTransaction(transaction, {
			type: 'deployment',
			name,
			expectedAddress: options?.expectedAddress,
		});

		const from = transaction.type == 'raw' ? transaction.from : transaction.data.from;

		const pendingDeployment: PendingDeployment<TAbi> = {
			name,
			type: 'deployment',
			expectedAddress: options?.expectedAddress,
			partialDeployment,
			transaction: {hash: txHash, origin: from},
			// TODO we should have the nonce, except for wallet like metamask where it is not sure you get the nonce you start with
		};
		return savePendingDeployment(pendingDeployment, options?.message);
	}

	async function savePendingDeployment<TAbi extends Abi = Abi>(
		pendingDeployment: PendingDeployment<TAbi>,
		msg?: string,
	): Promise<Deployment<TAbi>> {
		await savePendingTransaction(pendingDeployment);
		let transaction: EIP1193Transaction | null = null;
		const spinner = spin(); // TODO spin(`fetching tx from peers ${pendingDeployment.txHash}`);
		try {
			transaction = await provider.request({
				method: 'eth_getTransactionByHash',
				params: [pendingDeployment.transaction.hash],
			});
		} catch (e) {
			spinner.fail(`failed to fetch tx ${pendingDeployment.transaction.hash}. Can't know its status`);
			throw e;
		}
		if (!transaction) {
			// spinner.fail(`deployment tx ${pendingDeployment.transaction.hash} not found in the mempool yet`);
			spinner.stop();
		} else {
			spinner.stop();
		}

		if (transaction) {
			// we update the tx data with the one we get from the network
			pendingDeployment = {
				...pendingDeployment,
				transaction: {hash: transaction.hash, nonce: transaction.nonce, origin: transaction.from},
			};
		}

		const deployment = await waitForDeploymentTransactionAndSave<TAbi>(pendingDeployment, {transaction, message: msg});
		await deleteTransaction(pendingDeployment.transaction.hash);
		return deployment;
	}

	function showMessage(message: string) {
		logger.log(message);
	}

	function showProgress(message?: string): ProgressIndicator {
		return spin(message);
	}

	function resolveAccount(account: string | EIP1193Account): `0x${string}` {
		if (account.startsWith('0x')) {
			return account.toLowerCase() as `0x${string}`;
		}

		if (env.namedAccounts) {
			const address = env.namedAccounts[account];
			if (!address) {
				throw new Error(`no address for ${account}`);
			}
			return address.toLowerCase() as `0x${string}`;
		}

		throw new Error(`no accounts setup, cannot get address for ${account}`);
	}

	// Normalises like `resolveAccount` above: both are address RESOLVERS, and the addresses they
	//  resolve from are not normalised at the source (a protocol signer's `eth_accounts`, a
	//  user-written config address, the node's `eth_accounts`). Returning a lowercased address from
	//  one and a raw one from the other is what made `addressSigners` lookups miss; keep them in step
	//  so a caller can safely feed either into an address-keyed map.
	function resolveAccountOrUndefined(account: string | EIP1193Account): `0x${string}` | undefined {
		if (account.startsWith('0x')) {
			return account.toLowerCase() as `0x${string}`;
		}

		if (env.namedAccounts) {
			return env.namedAccounts[account]?.toLowerCase() as `0x${string}` | undefined;
		}

		return undefined;
	}

	async function loadDeployments(options?: {reset?: boolean}) {
		if (options?.reset) {
			await deploymentStore.deleteAll(deploymentsFolder, environmentName);
		}

		// The one behaviour the fork descriptor exists for: a fork of mainnet READS mainnet's
		// records (the folder is keyed by the environment NAME) while the node it is connected to
		// is not mainnet, so the chainId/genesisHash identity of the folder must NOT be checked
		// against the connected chain. "Be X for records while not being X for chain identity" is
		// the whole of forking (ADR 0014); `context.fork` is truthy exactly on a fork run.
		const {deployments: deploymentsLoaded, migrations: migrationsLoaded} = await loadDeploymentsFromStore(
			deploymentStore,
			deploymentsFolder,
			environmentName,
			false,
			context.fork
				? undefined
				: {
						chainId,
						genesisHash,
						deleteDeploymentsIfDifferentGenesisHash: context.deleteDeploymentsIfDifferentGenesisHash,
					},
		);

		const oldDeploymentNames = Object.keys(deployments);
		for (const name of oldDeploymentNames) {
			delete deployments[name];
		}
		const newDeploymentNames = Object.keys(deploymentsLoaded);
		for (const name of newDeploymentNames) {
			deployments[name] = deploymentsLoaded[name];
		}

		const oldMigrationIds = Object.keys(migrations);
		for (const id of oldMigrationIds) {
			delete migrations[id];
		}
		const newMigrationIds = Object.keys(migrationsLoaded);
		for (const id of newMigrationIds) {
			migrations[id] = migrationsLoaded[id];
		}
	}

	let env: Environment<NamedAccounts, Data, Deployments> = {
		...perliminaryEnvironment,
		save,
		broadcastExecution,
		broadcastDeployment,
		runUnderUnknownSignerPolicy,
		canPromptForText,
		get,
		getOrNull,
		fromAddressToNamedABI,
		fromAddressToNamedABIOrNull,
		showMessage,
		showProgress,
		hasMigrationBeenDone,
		resolveAccount,
		resolveAccountOrUndefined,
	};

	return {
		external: env,
		internal: {
			recoverTransactionsIfAny,
			recordMigration,
			loadDeployments,
		},
	};
}
