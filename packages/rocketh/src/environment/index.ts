import fs from 'node:fs';

import {
	AccountType,
	Artifact,
	Deployment,
	Environment,
	Signer,
	PendingDeployment,
	PendingTransaction,
	ResolvedAccount,
	ResolvedConfig,
	ResolvedNamedAccounts,
	ResolvedNamedSigners,
	UnknownDeployments,
	UnresolvedUnknownNamedAccounts,
	UnresolvedNetworkSpecificData,
	ResolvedNetworkSpecificData,
	DataType,
} from './types.js';
import {JSONRPCHTTPProvider} from 'eip-1193-jsonrpc-provider';
import {Abi, Address} from 'abitype';
import {InternalEnvironment} from '../internal/types.js';
import path from 'node:path';
import {JSONToString, stringToJSON} from '../utils/json.js';
import {loadDeployments} from './deployments.js';
import {
	EIP1193Account,
	EIP1193Block,
	EIP1193BlockWithTransactions,
	EIP1193DATA,
	EIP1193ProviderWithoutEvents,
	EIP1193QUANTITY,
	EIP1193Transaction,
	EIP1193TransactionReceipt,
} from 'eip-1193';
import {ProgressIndicator, log, spin} from '../internal/logging.js';
import {PendingExecution} from './types.js';
import {getChainWithConfig} from './utils/chains.js';
import {mergeArtifacts} from './utils/artifacts.js';
import {TransactionHashTracker, TransactionHashTrackerProvider} from './providers/TransactionHashTracker.js';

export type SignerProtocolFunction = (protocolString: string) => Promise<Signer>;
export type SignerProtocol = {
	getSigner: SignerProtocolFunction;
};

function wait(numSeconds: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, numSeconds * 1000);
	});
}

function displayTransaction(transaction: EIP1193Transaction) {
	if (transaction.type === '0x2') {
		return `(maxFeePerGas: ${BigInt(transaction.maxFeePerGas).toString()}, maxPriorityFeePerGas: ${BigInt(
			transaction.maxPriorityFeePerGas
		).toString()})`;
	} else {
		return `(gasPrice: ${BigInt(transaction.gasPrice).toString()})`;
	}
}

export async function createEnvironment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments
>(
	config: ResolvedConfig<NamedAccounts, Data>
): Promise<{internal: InternalEnvironment; external: Environment<NamedAccounts, Data, Deployments>}> {
	const rawProvider =
		'provider' in config.network
			? config.network.provider
			: (new JSONRPCHTTPProvider(config.network.nodeUrl) as EIP1193ProviderWithoutEvents);

	const provider: TransactionHashTracker = new TransactionHashTrackerProvider(rawProvider);

	const chainIdHex = await provider.request({method: 'eth_chainId'});
	const chainId = '' + Number(chainIdHex);
	let genesisHash: `0x${string}` | undefined;
	try {
		let genesisBlock: EIP1193Block | EIP1193BlockWithTransactions | null;
		try {
			genesisBlock = await provider.request({method: 'eth_getBlockByNumber', params: ['earliest', false]});
		} catch {
			genesisBlock = await provider.request({method: 'eth_getBlockByNumber', params: ['0x0', false]});
		}

		if (!genesisBlock) {
			console.error(`failed to get genesis block, returned null`);
		}

		genesisHash = genesisBlock?.hash;
	} catch (err) {
		console.error(`failed to get genesis block`);
	}

	let networkName: string;
	let saveDeployments: boolean;
	let networkTags: {[tag: string]: boolean} = {};
	for (const networkTag of config.network.tags) {
		networkTags[networkTag] = true;
	}

	if ('nodeUrl' in config) {
		networkName = config.network.name;
		saveDeployments = true;
	} else {
		if (config.network.name) {
			networkName = config.network.name;
		} else {
			networkName = 'memory';
		}
		if (networkName === 'memory' || networkName === 'hardhat') {
			networkTags['memory'] = true;
			saveDeployments = false;
		} else {
			saveDeployments = true;
		}
	}

	if (config.saveDeployments !== undefined) {
		saveDeployments = config.saveDeployments;
	}

	const resolvedAccounts: {[name: string]: ResolvedAccount} = {};

	const allRemoteAccounts = await provider.request({method: 'eth_accounts'});
	const accountCache: {[name: string]: ResolvedAccount} = {};

	async function getAccount(
		name: string,
		accounts: UnresolvedUnknownNamedAccounts,
		accountDef: AccountType
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
			}
		} else if (typeof accountDef === 'string') {
			if (accountDef.startsWith('0x')) {
				if (accountDef.length === 66) {
					const privateKeyProtocol = config.signerProtocols['privateKey'];
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
					const protocol = config.signerProtocols[protocolID];
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
			const accountForNetwork = accountDef[networkName] || accountDef[chainId] || accountDef['default'];
			if (typeof accountForNetwork !== undefined) {
				const accountFetched = await getAccount(name, accounts, accountForNetwork);
				if (accountFetched) {
					accountCache[name] = account = accountFetched;
				}
			}
		}

		return account;
	}

	if (config.accounts) {
		const accountNames = Object.keys(config.accounts);
		for (const accountName of accountNames) {
			let account = await getAccount(accountName, config.accounts, config.accounts[accountName]);
			(resolvedAccounts as any)[accountName] = account;
		}
	}

	const resolvedData: ResolvedNetworkSpecificData<Data> = {} as ResolvedNetworkSpecificData<Data>;
	async function getData<T = unknown>(name: string, dataDef: DataType<T>): Promise<T | undefined> {
		const dataForNetwork = dataDef[networkName] || dataDef[chainId] || dataDef['default'];
		return dataForNetwork;
	}

	if (config.data) {
		const dataFields = Object.keys(config.data);
		for (const dataField of dataFields) {
			let fieldData = await getData(dataField, config.data[dataField]);
			(resolvedData as any)[dataField] = fieldData;
		}
	}

	const context = {
		accounts: resolvedAccounts,
		data: resolvedData,
		network: {
			name: networkName,
			fork: config.network.fork,
			saveDeployments,
			tags: networkTags,
		},
	};

	// console.log(`context`, JSON.stringify(context.network, null, 2));

	const {deployments, migrations} = loadDeployments(
		config.deployments,
		context.network.name,
		false,
		context.network.fork
			? undefined
			: {
					chainId,
					genesisHash,
					deleteDeploymentsIfDifferentGenesisHash: true,
			  }
	);

	const namedAccounts: {[name: string]: EIP1193Account} = {};
	const namedSigners: {[name: string]: Signer} = {};
	const addressSigners: {[name: `0x${string}`]: Signer} = {};

	for (const entry of Object.entries(resolvedAccounts)) {
		const name = entry[0];
		const {address, ...namedSigner} = entry[1];
		namedAccounts[name] = address;
		addressSigners[address] = namedSigner;
		namedSigners[name] = namedSigner;
	}

	const unnamedAccounts = allRemoteAccounts.filter((v) => !addressSigners[v]);
	for (const account of unnamedAccounts) {
		addressSigners[account] = {
			type: 'remote',
			signer: provider,
		};
	}

	const perliminaryEnvironment = {
		config,
		deployments: deployments as Deployments,
		namedAccounts: namedAccounts as ResolvedNamedAccounts<NamedAccounts>,
		data: resolvedData,
		namedSigners: namedSigners as ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>,
		unnamedAccounts,
		addressSigners: addressSigners,
		network: {
			chain: getChainWithConfig(chainId, config),
			name: context.network.name,
			tags: context.network.tags,
			provider,
		},
		extra: config.extra || {},
	};

	function getDeploymentFolder(): string {
		const folderPath = path.join(config.deployments, context.network.name);
		return folderPath;
	}

	function ensureDeploymentFolder(): string {
		const folderPath = getDeploymentFolder();
		fs.mkdirSync(folderPath, {recursive: true});
		// const chainIdFilepath = path.join(folderPath, '.chainId');
		// if (!fs.existsSync(chainIdFilepath)) {
		// 	fs.writeFileSync(chainIdFilepath, chainId);
		// }
		const chainFilepath = path.join(folderPath, '.chain');
		if (!fs.existsSync(chainFilepath)) {
			fs.writeFileSync(chainFilepath, JSON.stringify({chainId, genesisHash}));
		}
		return folderPath;
	}

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
		if (context.network.saveDeployments) {
			const folderPath = ensureDeploymentFolder();
			fs.writeFileSync(`${folderPath}/.migrations.json`, JSON.stringify(migrations));
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
		options?: {doNotCountAsNewDeployment?: boolean}
	): Promise<Deployment<TAbi>> {
		if (!options?.doNotCountAsNewDeployment) {
			let numDeployments = 1;
			const oldDeployment = deployments[name];
			if (oldDeployment) {
				numDeployments = (oldDeployment.numDeployments || 1) + 1;
			}
			deployments[name] = {...deployment, numDeployments};
		} else {
			deployments[name] = {...deployment, numDeployments: 1};
		}
		if (context.network.saveDeployments) {
			const folderPath = ensureDeploymentFolder();
			fs.writeFileSync(`${folderPath}/${name}.json`, JSONToString(deployment, 2));
		}
		return deployment;
	}

	async function recoverTransactionsIfAny(): Promise<void> {
		if (!context.network.saveDeployments) {
			return;
		}
		const folderPath = getDeploymentFolder();
		const filepath = path.join(folderPath, '.pending_transactions.json');
		let existingPendingTansactions: PendingTransaction[];
		try {
			existingPendingTansactions = stringToJSON(fs.readFileSync(filepath, 'utf-8'));
		} catch {
			existingPendingTansactions = [];
		}
		if (existingPendingTansactions.length > 0) {
			while (existingPendingTansactions.length > 0) {
				const pendingTransaction = existingPendingTansactions.shift();
				if (pendingTransaction) {
					if (pendingTransaction.type === 'deployment') {
						const spinner = spin(
							`recovering ${pendingTransaction.name} with transaction ${pendingTransaction.transaction.hash}`
						);
						try {
							await waitForDeploymentTransactionAndSave(pendingTransaction);
							fs.writeFileSync(filepath, JSONToString(existingPendingTansactions, 2));
							spinner.succeed();
						} catch (e) {
							spinner.fail();
							throw e;
						}
					} else {
						const spinner = spin(`recovering execution's transaction ${pendingTransaction.transaction.hash}`);
						try {
							await waitForTransaction(pendingTransaction.transaction.hash);
							fs.writeFileSync(filepath, JSONToString(existingPendingTansactions, 2));
							spinner.succeed();
						} catch (e) {
							spinner.fail();
							throw e;
						}
					}
				}
			}
			fs.rmSync(filepath);
		}
	}

	async function savePendingTransaction(pendingTransaction: PendingTransaction) {
		if (context.network.saveDeployments) {
			const folderPath = ensureDeploymentFolder();
			const filepath = path.join(folderPath, '.pending_transactions.json');
			let existingPendinTransactions: PendingTransaction[];
			try {
				existingPendinTransactions = stringToJSON(fs.readFileSync(filepath, 'utf-8'));
			} catch {
				existingPendinTransactions = [];
			}
			existingPendinTransactions.push(pendingTransaction);
			fs.writeFileSync(filepath, JSONToString(existingPendinTransactions, 2));
		}
		return deployments;
	}

	async function waitForTransactionReceipt(params: {
		hash: EIP1193DATA;
		// confirmations?: number; // TODO
		// timeout?: number; // TODO
	}): Promise<EIP1193TransactionReceipt> {
		const {hash, pollingInterval} = {pollingInterval: config.network.pollingInterval, ...params};

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
		return receipt;
	}

	async function deleteTransaction<TAbi extends Abi = Abi>(hash: string) {
		if (context.network.saveDeployments) {
			const folderPath = ensureDeploymentFolder();
			const filepath = path.join(folderPath, '.pending_transactions.json');
			let existingPendinTransactions: PendingTransaction[];
			try {
				existingPendinTransactions = stringToJSON(fs.readFileSync(filepath, 'utf-8'));
			} catch {
				existingPendinTransactions = [];
			}
			existingPendinTransactions = existingPendinTransactions.filter((v) => v.transaction.hash !== hash);
			if (existingPendinTransactions.length === 0) {
				fs.rmSync(filepath);
			} else {
				fs.writeFileSync(filepath, JSONToString(existingPendinTransactions, 2));
			}
		}
	}

	async function exportDeploymentsAsTypes() {
		const folderPath = './generated';
		fs.mkdirSync(folderPath, {recursive: true});
		fs.writeFileSync(`${folderPath}/deployments.ts`, `export default ${JSONToString(deployments, 2)} as const;`);
	}

	async function waitForTransaction(
		hash: `0x${string}`,
		info?: {message?: string; transaction?: EIP1193Transaction | null}
	): Promise<EIP1193TransactionReceipt> {
		const spinner = spin(
			info?.message
				? info.message
				: `  - Broadcasting tx:\n      ${hash}${
						info?.transaction ? `\n      ${displayTransaction(info?.transaction)}` : ''
				  }`
		);
		let receipt: EIP1193TransactionReceipt;
		try {
			receipt = await waitForTransactionReceipt({
				hash,
			});
		} catch (e) {
			spinner.fail();
			throw e;
		}
		if (!receipt) {
			throw new Error(`receipt for ${hash} not found`);
		} else {
			spinner.succeed();
		}
		return receipt;
	}

	async function waitForDeploymentTransactionAndSave<TAbi extends Abi = Abi>(
		pendingDeployment: PendingDeployment<TAbi>,
		transaction?: EIP1193Transaction | null
	): Promise<Deployment<TAbi>> {
		const nameToDisplay = pendingDeployment.name || '<no name>';
		const message = `  - Deploying ${nameToDisplay} with tx:\n      ${pendingDeployment.transaction.hash}${
			transaction ? `\n      ${displayTransaction(transaction)}` : ''
		}`;
		const receipt = await waitForTransaction(pendingDeployment.transaction.hash, {
			message,
			transaction,
		});

		// TODO we could make pendingDeployment.expectedAddress a spec for fetching address from event too
		const contractAddress = pendingDeployment.expectedAddress || receipt.contractAddress;
		if (!contractAddress) {
			console.error(receipt);
			throw new Error(`no contract address found for ${nameToDisplay}`);
		}

		showMessage(`    => ${contractAddress}`);

		const {abi, ...artifactObjectWithoutABI} = pendingDeployment.partialDeployment;

		if (!pendingDeployment.transaction.hash) {
			const spinner = spin(); // TODO spin(`fetching nonce for ${pendingDeployment.txHash}`);
			let transaction: EIP1193Transaction | null = null;
			try {
				transaction = await provider.request({
					method: 'eth_getTransactionByHash',
					params: [pendingDeployment.transaction.hash],
				});
			} catch (e) {
				spinner.fail();
				throw e;
			}
			if (!transaction) {
				spinner.fail(`tx ${pendingDeployment.transaction.hash} not found`);
			} else {
				spinner.stop();
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
		for (const key of Object.keys(artifactObjectWithoutABI)) {
			if (key.startsWith('_')) {
				delete (artifactObjectWithoutABI as any)[key];
			}
			if (key === 'evm') {
				if (artifactObjectWithoutABI.evm) {
					if ('gasEstimates' in artifactObjectWithoutABI['evm']) {
						const {gasEstimates} = artifactObjectWithoutABI.evm;
						artifactObjectWithoutABI.evm = {
							gasEstimates,
						};
					}
				}
			}
		}

		const deployment = {
			address: contractAddress,
			abi,
			...artifactObjectWithoutABI,
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

	async function savePendingExecution(pendingExecution: PendingExecution) {
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
			spinner.fail(`tx ${pendingExecution.transaction.hash} not found`);
		} else {
			spinner.stop();
		}

		if (transaction) {
			pendingExecution.transaction.nonce = transaction.nonce;
			pendingExecution.transaction.origin = transaction.from;
		}

		const receipt = await waitForTransaction(pendingExecution.transaction.hash, {transaction});

		await deleteTransaction(pendingExecution.transaction.hash);
		return receipt;
	}

	async function savePendingDeployment<TAbi extends Abi = Abi>(pendingDeployment: PendingDeployment<TAbi>) {
		await savePendingTransaction(pendingDeployment);
		let transaction: EIP1193Transaction | null = null;
		const spinner = spin(); // TODO spin(`fetching tx from peers ${pendingDeployment.txHash}`);
		try {
			transaction = await provider.request({
				method: 'eth_getTransactionByHash',
				params: [pendingDeployment.transaction.hash],
			});
		} catch (e) {
			console.error(`failed to fetch tx ${pendingDeployment.transaction.hash}. Can't know its status`);
			spinner.fail();
			throw e;
		}
		if (!transaction) {
			spinner.fail(`tx ${pendingDeployment.transaction.hash} not found`);
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

		const deployment = await waitForDeploymentTransactionAndSave<TAbi>(pendingDeployment, transaction);
		await deleteTransaction(pendingDeployment.transaction.hash);
		return deployment;
	}

	function showMessage(message: string) {
		log(message);
	}

	function showProgress(message?: string): ProgressIndicator {
		return spin(message);
	}

	let env: Environment<NamedAccounts, Data, Deployments> = {
		...perliminaryEnvironment,
		save,
		savePendingDeployment,
		savePendingExecution,
		get,
		getOrNull,
		fromAddressToNamedABI,
		fromAddressToNamedABIOrNull,
		showMessage,
		showProgress,
		hasMigrationBeenDone,
	};

	return {
		external: env,
		internal: {
			exportDeploymentsAsTypes,
			recoverTransactionsIfAny,
			recordMigration,
		},
	};
}
