import fs from 'node:fs';

import {createPublicClient, custom} from 'viem';
import {
	AccountType,
	Deployment,
	Environment,
	NamedSigner,
	PendingDeployment,
	ResolvedAccount,
	ResolvedConfig,
	ResolvedNamedAccounts,
	ResolvedNamedSigners,
	UnknownArtifacts,
	UnknownDeployments,
	UnresolvedUnknownNamedAccounts,
} from './types';
import {JSONRPCHTTPProvider} from 'eip-1193-json-provider';
import {Abi} from 'abitype';
import {InternalEnvironment} from '../internal/types';
import path from 'node:path';
import {JSONToString, stringToJSON} from '../utils/json';
import {loadDeployments} from './deployments';
import {EIP1193Account, EIP1193ProviderWithoutEvents} from 'eip-1193';
import {ProvidedContext} from '../executor/types';

export type EnvironmentExtenstion = (env: Environment) => Environment;
//we store this globally so this is not lost
(globalThis as any).extensions = [];
export function extendEnvironment(extension: EnvironmentExtenstion): void {
	(globalThis as any).extensions.push(extension);
}

export type SignerProtocolFunction = (protocolString: string) => Promise<NamedSigner>;
export type SignerProtocol = {
	getSigner: SignerProtocolFunction;
};

//we store this globally so this is not lost
(globalThis as any).signerProtocols = {};
export function handleSignerProtocol(protocol: string, getSigner: SignerProtocolFunction): void {
	(globalThis as any).signerProtocols[protocol] = {
		getSigner,
	};
}

export async function createEnvironment<
	Artifacts extends UnknownArtifacts = UnknownArtifacts,
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Deployments extends UnknownDeployments = UnknownDeployments
>(
	config: ResolvedConfig,
	providedContext: ProvidedContext<Artifacts, NamedAccounts>
): Promise<{internal: InternalEnvironment; external: Environment}> {
	const provider =
		'provider' in config ? config.provider : (new JSONRPCHTTPProvider(config.nodeUrl) as EIP1193ProviderWithoutEvents);

	const transport = custom(provider);
	const viemClient = createPublicClient({transport});

	const chainId = (await viemClient.getChainId()).toString();

	let networkName: string;
	let saveDeployments: boolean;
	let tags: {[tag: string]: boolean} = {};
	if ('nodeUrl' in config) {
		networkName = config.networkName;
		saveDeployments = true;
	} else {
		if (config.networkName) {
			networkName = config.networkName;
		} else {
			networkName = 'memory';
		}
		if (networkName === 'memory' || networkName === 'hardhat') {
			tags['memory'] = true;
			saveDeployments = false;
		} else {
			saveDeployments = true;
		}
	}

	const resolvedAccounts: {[name: string]: ResolvedAccount} = {};

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
			const accounts = await provider.request({method: 'eth_accounts'});
			const accountPerIndex = accounts[accountDef];
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
					const privateKeyProtocol: SignerProtocol = (globalThis as any).signerProtocols['privateKey'];
					if (privateKeyProtocol) {
						const namedSigner = await privateKeyProtocol.getSigner(`privateKey:${accountDef}`);
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
					const protocol: SignerProtocol = (globalThis as any).signerProtocols[protocolID];
					if (!protocol) {
						throw new Error(`protocol: ${protocol} is not supported`);
					}
					const namedSigner = await protocol.getSigner(accountDef);
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
			if (accountForNetwork) {
				const accountFetched = await getAccount(name, accounts, accountForNetwork);
				if (accountFetched) {
					accountCache[name] = account = accountFetched;
				}
			}
		}

		return account;
	}

	if (providedContext.accounts) {
		const accountNames = Object.keys(providedContext.accounts);
		for (const accountName of accountNames) {
			let account = await getAccount(accountName, providedContext.accounts, providedContext.accounts[accountName]);
			(resolvedAccounts as any)[accountName] = account;
		}
	}

	const context = {
		accounts: resolvedAccounts,
		artifacts: providedContext.artifacts as Artifacts,
		network: {
			name: networkName,
			saveDeployments,
			tags,
		},
	};

	const {deployments} = loadDeployments(config.deployments, context.network.name, false, chainId);

	const namedAccounts: {[name: string]: EIP1193Account} = {};
	const namedSigners: {[name: string]: NamedSigner} = {};
	const addressSigners: {[name: `0x${string}`]: NamedSigner} = {};

	for (const entry of Object.entries(resolvedAccounts)) {
		const name = entry[0];
		const {address, ...namedSigner} = entry[1];
		namedAccounts[name] = address;
		addressSigners[address] = namedSigner;
		namedSigners[name] = namedSigner;
	}

	const perliminaryEnvironment = {
		config,
		deployments: deployments as Deployments,
		accounts: namedAccounts as ResolvedNamedAccounts<NamedAccounts>,
		signers: namedSigners as ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>,
		addressSigners: addressSigners,
		artifacts: context.artifacts,
		network: {
			chainId,
			name: context.network.name,
			tags: context.network.tags,
			provider,
		},
	};

	function ensureDeploymentFolder(): string {
		const folderPath = path.join(config.deployments, context.network.name);
		fs.mkdirSync(folderPath, {recursive: true});
		const chainIdFilepath = path.join(folderPath, '.chainId');
		if (!fs.existsSync(chainIdFilepath)) {
			fs.writeFileSync(chainIdFilepath, chainId);
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

	function get<TAbi extends Abi>(name: string): Deployment<TAbi> | undefined {
		return deployments[name] as Deployment<TAbi> | undefined;
	}

	async function save<TAbi extends Abi>(name: string, deployment: Deployment<TAbi>): Promise<Deployment<TAbi>> {
		deployments[name] = deployment;
		if (context.network.saveDeployments) {
			const folderPath = ensureDeploymentFolder();
			fs.writeFileSync(`${folderPath}/${name}.json`, JSONToString(deployment, 2));
		}
		return deployment;
	}

	async function recoverTransactionsIfAny<TAbi extends Abi = Abi>(): Promise<void> {
		const filepath = path.join(config.deployments, context.network.name, '.pending_transactions.json');
		let existingPendingDeployments: {name: string; transaction: PendingDeployment<TAbi>}[];
		try {
			existingPendingDeployments = stringToJSON(fs.readFileSync(filepath, 'utf-8'));
		} catch {
			existingPendingDeployments = [];
		}
		if (existingPendingDeployments.length > 0) {
			while (existingPendingDeployments.length > 0) {
				const pendingTransaction = existingPendingDeployments.shift();
				if (pendingTransaction) {
					console.log(
						`recovering ${pendingTransaction.name} with transaction ${pendingTransaction.transaction.txHash}`
					);
					await waitForTransactionAndSave(pendingTransaction.name, pendingTransaction.transaction);
					console.log(`transaction ${pendingTransaction.transaction.txHash} complete`);
					fs.writeFileSync(filepath, JSONToString(existingPendingDeployments, 2));
				}
			}
			fs.rmSync(filepath);
		}
	}

	async function saveTransaction<TAbi extends Abi = Abi>(name: string, transaction: PendingDeployment<TAbi>) {
		if (context.network.saveDeployments) {
			const folderPath = ensureDeploymentFolder();
			const filepath = path.join(folderPath, '.pending_transactions.json');
			let existingPendingDeployments: {name: string; transaction: PendingDeployment<TAbi>}[];
			try {
				existingPendingDeployments = stringToJSON(fs.readFileSync(filepath, 'utf-8'));
			} catch {
				existingPendingDeployments = [];
			}
			existingPendingDeployments.push({name, transaction});
			fs.writeFileSync(filepath, JSONToString(existingPendingDeployments, 2));
		}
		return deployments;
	}

	async function deleteTransaction<TAbi extends Abi = Abi>(hash: string) {
		if (context.network.saveDeployments) {
			const filepath = path.join(config.deployments, context.network.name, '.pending_transactions.json');
			let existingPendingDeployments: {name: string; transaction: PendingDeployment<TAbi>}[];
			try {
				existingPendingDeployments = stringToJSON(fs.readFileSync(filepath, 'utf-8'));
			} catch {
				existingPendingDeployments = [];
			}
			existingPendingDeployments = existingPendingDeployments.filter((v) => v.transaction.txHash !== hash);
			if (existingPendingDeployments.length === 0) {
				fs.rmSync(filepath);
			} else {
				fs.writeFileSync(filepath, JSONToString(existingPendingDeployments, 2));
			}
		}
	}

	async function exportDeploymentsAsTypes() {
		const folderPath = './generated';
		fs.mkdirSync(folderPath, {recursive: true});
		fs.writeFileSync(`${folderPath}/deployments.ts`, `export default ${JSONToString(deployments, 2)} as const;`);
	}

	async function waitForTransactionAndSave<TAbi extends Abi = Abi>(
		name: string,
		pendingDeployment: PendingDeployment<TAbi>
	): Promise<Deployment<TAbi>> {
		const receipt = await viemClient.waitForTransactionReceipt({
			hash: pendingDeployment.txHash,
		});

		if (!receipt.contractAddress) {
			throw new Error(`failed to deploy contract ${name}`);
		}
		const {abi, ...artifactObjectWithoutABI} = pendingDeployment.partialDeployment;

		if (!artifactObjectWithoutABI.nonce) {
			const transaction = await provider.request({
				method: 'eth_getTransactionByHash',
				params: [pendingDeployment.txHash],
			});
			if (transaction) {
				artifactObjectWithoutABI.nonce = transaction.nonce;
				artifactObjectWithoutABI.txOrigin = transaction.from;
			}
		}

		// TODO options
		for (const key of Object.keys(artifactObjectWithoutABI)) {
			if (key.startsWith('_')) {
				delete (artifactObjectWithoutABI as any)[key];
			}
			if (key === 'evm') {
				const {gasEstimates} = artifactObjectWithoutABI.evm;
				artifactObjectWithoutABI.evm = {
					gasEstimates,
				};
			}
		}

		const deployment = {
			address: receipt.contractAddress,
			txHash: pendingDeployment.txHash,
			abi,
			...artifactObjectWithoutABI,
		};
		return save(name, deployment);
	}

	async function saveWhilePending<TAbi extends Abi = Abi>(name: string, pendingDeployment: PendingDeployment<TAbi>) {
		await saveTransaction<TAbi>(name, pendingDeployment);
		const transaction = await provider.request({
			method: 'eth_getTransactionByHash',
			params: [pendingDeployment.txHash],
		});

		const deployment = waitForTransactionAndSave<TAbi>(
			name,
			transaction
				? {
						...pendingDeployment,
						nonce: transaction.nonce,
						txOrigin: transaction.from,
				  }
				: pendingDeployment
		);
		await deleteTransaction(pendingDeployment.txHash);
		return deployment;
	}

	let env: Environment<Artifacts, NamedAccounts, Deployments> = {
		...perliminaryEnvironment,
		save,
		saveWhilePending,
		get,
	};
	for (const extension of (globalThis as any).extensions) {
		env = extension(env);
	}

	return {
		external: env,
		internal: {
			exportDeploymentsAsTypes,
			recoverTransactionsIfAny,
		},
	};
}
