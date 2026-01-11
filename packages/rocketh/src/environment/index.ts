import type {
	AccountType,
	Artifact,
	Deployment,
	Environment,
	Signer,
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
} from '@rocketh/core/types';
import {Abi, Address} from 'abitype';
import {InternalEnvironment} from '../internal/types.js';
import {JSONToString, stringToJSON} from '@rocketh/core/json';
import {
	EIP1193Account,
	EIP1193Block,
	EIP1193BlockWithTransactions,
	EIP1193DATA,
	EIP1193Transaction,
	EIP1193TransactionReceipt,
} from 'eip-1193';
import {logger, spin} from '../internal/logging.js';
import {mergeArtifacts} from '@rocketh/core/artifacts';
import {TransactionHashTracker, TransactionHashTrackerProvider} from '@rocketh/core/providers';

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

export async function loadDeployments(
	deploymentStore: DeploymentStore,
	deploymentsPath: string,
	networkName: string,
	onlyABIAndAddress?: boolean,
	expectedChain?: {chainId: string; genesisHash?: `0x${string}`; deleteDeploymentsIfDifferentGenesisHash?: boolean}
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
			(name) => !(name.startsWith('.') && name !== '.migrations.json') && name !== 'solcInputs'
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
				`A '.chain' or '.chainId' file is expected to be present in the deployment folder for network ${networkName}`
			);
		}

		if (expectedChain) {
			if (expectedChain.chainId !== chainId) {
				throw new Error(
					`Loading deployment from environment '${networkName}' (with chainId: ${chainId}) for a different chainId (${expectedChain.chainId})`
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
							`Loading deployment from environment '${networkName}' (with genesisHash: ${genesisHash}) for a different genesisHash (${expectedChain.genesisHash})`
						);
					}
				}
			} else {
				console.warn(
					`genesisHash not found in environment '${networkName}' (with chainId: ${chainId}), writing .chain with expected one...`
				);
				await deploymentStore.writeFile(
					deploymentsPath,
					networkName,
					'.chain',
					JSON.stringify({chainId: expectedChain.chainId, genesisHash: expectedChain.genesisHash})
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
			console.error(`failed to parse .migrations.json`);
		}
	}

	for (const fileName of fileNames) {
		if (fileName.substring(fileName.length - 5) === '.json' && fileName !== '.migrations.json') {
			let deployment = JSON.parse(await deploymentStore.readFile(deploymentsPath, networkName, fileName));
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
	Deployments extends UnknownDeployments = UnknownDeployments
>(
	userConfig: ResolvedUserConfig<NamedAccounts, Data>,
	resolvedExecutionParams: ResolvedExecutionParams,
	deploymentStore: DeploymentStore
): Promise<{internal: InternalEnvironment; external: Environment<NamedAccounts, Data, Deployments>}> {
	const rawProvider = resolvedExecutionParams.provider;

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

	const deploymentsFolder = userConfig.deployments;
	const environmentName = resolvedExecutionParams.environment.name;
	const saveDeployments = resolvedExecutionParams.saveDeployments;
	let networkTags: {[tag: string]: boolean} = {};
	for (const networkTag of resolvedExecutionParams.environment.tags) {
		networkTags[networkTag] = true;
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
			const accountForNetwork = accountDef[environmentName] || accountDef[chainId] || accountDef['default'];
			if (typeof accountForNetwork !== undefined) {
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
						2
					)}\nEnsure your provider (or hardhat) has some accounts set up for ${environmentName}\n`
				);
			}
			(resolvedAccounts as any)[accountName] = account;
		}
	}

	const resolvedData: ResolvedNetworkSpecificData<Data> = {} as ResolvedNetworkSpecificData<Data>;
	async function getData<T = unknown>(name: string, dataDef: DataType<T>): Promise<T | undefined> {
		const dataForNetwork = dataDef[environmentName] || dataDef[chainId] || dataDef['default'];
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
	};

	const {deployments, migrations} = await loadDeployments(
		deploymentStore,
		deploymentsFolder,
		environmentName,
		false,
		context.fork
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
		context: {
			saveDeployments: context.saveDeployments,
		},
		name: environmentName,
		tags: context.tags,
		deployments: deployments as Deployments,
		namedAccounts: namedAccounts as ResolvedNamedAccounts<NamedAccounts>,
		data: resolvedData,
		namedSigners: namedSigners as ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>,
		unnamedAccounts,
		addressSigners: addressSigners,
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
				JSON.stringify(migrations)
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
		if (context.saveDeployments) {
			deploymentStore.writeFileWithChainInfo(
				{chainId, genesisHash},
				deploymentsFolder,
				environmentName,
				`${name}.json`,
				JSONToString(deployment, 2)
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
				await deploymentStore.readFile(deploymentsFolder, environmentName, '.pending_transactions.json')
			);
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
							await deploymentStore.writeFileWithChainInfo(
								{chainId, genesisHash},
								deploymentsFolder,
								environmentName,
								'.pending_transactions.json',
								JSONToString(existingPendingTansactions, 2)
							);
							spinner.succeed();
						} catch (e) {
							spinner.fail();
							throw e;
						}
					} else {
						const spinner = spin(`recovering execution's transaction ${pendingTransaction.transaction.hash}`);
						try {
							await waitForTransaction(pendingTransaction.transaction.hash);
							await deploymentStore.writeFileWithChainInfo(
								{chainId, genesisHash},
								deploymentsFolder,
								environmentName,
								'.pending_transactions.json',
								JSONToString(existingPendingTansactions, 2)
							);
							spinner.succeed();
						} catch (e) {
							spinner.fail();
							throw e;
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
					await deploymentStore.readFile(deploymentsFolder, environmentName, '.pending_transactions.json')
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
				JSONToString(existingPendinTransactions, 2)
			);
		}
		return deployments;
	}

	async function waitForTransactionReceipt(params: {
		hash: EIP1193DATA;
		// confirmations?: number; // TODO
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
		return receipt;
	}

	async function deleteTransaction<TAbi extends Abi = Abi>(hash: string) {
		if (context.saveDeployments) {
			let existingPendinTransactions: PendingTransaction[];
			try {
				existingPendinTransactions = stringToJSON(
					await deploymentStore.readFile(deploymentsFolder, environmentName, '.pending_transactions.json')
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
					JSONToString(existingPendinTransactions, 2)
				);
			}
		}
	}

	async function waitForTransaction(
		hash: `0x${string}`,
		info?: {message?: string; transaction?: EIP1193Transaction | null}
	): Promise<EIP1193TransactionReceipt> {
		let message = `  - Broadcasting tx:\n      ${hash}${
			info?.transaction ? `\n      ${displayTransaction(info?.transaction)}` : ''
		}`;
		if (info?.message) {
			message = info.message.replaceAll('{hash}', hash);
			if (info?.transaction) {
				message = message.replaceAll('{transaction}', displayTransaction(info.transaction));
			} else {
				message = message.replaceAll('{transaction}', '');
			}
		}
		const spinner = spin(message);
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
		info?: {message?: string; transaction?: EIP1193Transaction | null}
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

		const {abi, ...artifactObjectWithoutABI} = pendingDeployment.partialDeployment;

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

	async function savePendingExecution(pendingExecution: PendingExecution, msg?: string) {
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

	async function savePendingDeployment<TAbi extends Abi = Abi>(
		pendingDeployment: PendingDeployment<TAbi>,
		msg?: string
	) {
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
			recoverTransactionsIfAny,
			recordMigration,
		},
	};
}
