# The environment

A deploy script's function receives the **environment** as its first argument, and so does whoever loads one (`loadAndExecuteDeploymentsFromFiles`, `loadEnvironmentFromFiles`, hardhat-deploy's `loadEnvironmentFromHardhat`, `@rocketh/web`'s loaders). It holds the run's network, accounts, data and records, and the functions to read and save deployments and to send transactions through rocketh.

This is its built-in part, `Environment` in [`packages/rocketh-core/src/types.ts`](https://github.com/wighawag/rocketh/blob/main/packages/rocketh-core/src/types.ts), where each field is documented:

```typescript
export interface Environment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>,
> {
	readonly name: string;
	readonly context: {
		readonly saveDeployments: boolean;
		readonly autoMine: boolean;
		readonly retry: ResolvedRetryConfig;
	};
	readonly tags: {readonly [tag: string]: boolean};
	readonly network: {
		/** the CONNECTED chain: what the node reports, and the chain id every transaction declares */
		readonly chain: Chain;
		readonly provider: TransactionHashTracker;
		/** absent off a fork; on one, `{networkName, chainId?}` naming the network being simulated */
		readonly fork?: ForkDescriptor;
		readonly deterministicDeployment: DeterministicDeploymentInfo;
		/** what a transaction is sent as when the call states no fee option: 'eip1559' or 'legacy' */
		readonly transactionType: ChainTransactionType;
		/** the RUN-LEVEL fee defaults (`--gas-price` and so on), absent unless the run set them */
		readonly gasPrice?: bigint;
		readonly maxFeePerGas?: bigint;
		readonly maxPriorityFeePerGas?: bigint;
	};
	readonly deployments: Deployments;
	/** every transaction this run broadcast, in order (see "Captured transactions") */
	readonly capturedTransactions: readonly CapturedTransaction[];
	readonly namedAccounts: ResolvedNamedAccounts<NamedAccounts>;
	readonly data: ResolvedNetworkSpecificData<Data>;
	readonly namedSigners: ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>;
	readonly unnamedAccounts: EIP1193Account[];
	/**
	 * Signers indexed by address. The keys are always LOWERCASE, so index it with a lowercased
	 * address (`resolveAccount` already returns one). The address VALUES exposed by
	 * `namedAccounts`/`unnamedAccounts` are left as resolved and may be checksummed.
	 */
	readonly addressSigners: {[name: `0x${string}`]: Signer};
	/**
	 * Signability indexed by address, computed after auto-impersonation runs.
	 * The keys are always LOWERCASE, matching `addressSigners`. Looking up an
	 * address that was never seen during setup returns `'unsignable'` rather than
	 * `undefined`, so callers never have to handle a third case.
	 */
	readonly addressSignability: {[address: `0x${string}`]: Signability};
	/** run `action` under an `onUnknownSigner` policy override (used by `@rocketh/unknown-signer`) */
	runUnderUnknownSignerPolicy<T>(frame: UnknownSignerPolicyFrame, action: () => Promise<T>): Promise<T>;
	save<TAbi extends Abi = Abi>(
		name: string,
		deployment: Deployment<TAbi>,
		options?: {considerItAsFreshDeployment?: boolean; keepNumDeployments?: boolean},
	): Promise<Deployment<TAbi>>;
	broadcastExecution(
		transaction: TransactionToBroadcast,
		options?: {message?: string; contract?: Omit<UnknownSignerContractCall, 'name'>},
	): Promise<EIP1193TransactionReceipt>;
	broadcastDeployment<TAbi extends Abi = Abi>(
		name: string,
		transaction: TransactionToBroadcast,
		partialDeployment: PartialDeployment<TAbi>,
		options?: {message?: string; expectedAddress?: `0x${string}`},
	): Promise<Deployment<TAbi>>;
	get<TAbi extends Abi>(name: string): Deployment<TAbi>;
	getOrNull<TAbi extends Abi>(name: string): Deployment<TAbi> | null;
	fromAddressToNamedABI<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]};
	fromAddressToNamedABIOrNull<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]} | null;
	/** whether this run can ask a human for free text (a terminal is attached) */
	canPromptForText(): boolean;
	showMessage(message: string): void;
	showProgress(message?: string): ProgressIndicator;
	resolveAccountOrUndefined(account: string | EIP1193Account): `0x${string}` | undefined;
	resolveAccount(account: string | EIP1193Account): `0x${string}`;
	hasMigrationBeenDone(id: string): boolean;
	readonly extra?: Extra;
}
```

## What the extensions add

Each extension spread into `extensions` in `rocketh/config.ts` adds functions (or, for a getter, a property) to the environment a script receives:

| Extension                 | Adds                                                                                      | Guide                                       |
| ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| `@rocketh/deploy`         | `deploy`, `computeDeterministicAddress`                                                   | [Deploy contracts](../../deploy-contracts/) |
| `@rocketh/read-execute`   | `read`, `execute`, `tx`, `readByName`, `executeByName`, `evaluateGuard`                   | [Guard execute calls](../../execute-guard/) |
| `@rocketh/proxy`          | `deployViaProxy`                                                                          | [Proxies](../../proxies/)                   |
| `@rocketh/diamond`        | `diamond`                                                                                 | [Diamonds](../../diamonds/)                 |
| `@rocketh/router`         | `deployViaRouter`                                                                         | [Routers](../../routers/)                   |
| `@rocketh/unknown-signer` | `catchUnknownSigner`, `withUnknownSignerPolicy`                                           | [Unknown signers](../../unknown-signers/)   |
| `@rocketh/viem`           | `viem` (a property): `publicClient`, `walletClient`, `getContract`, `getWritableContract` | [Use viem](../../viem/)                     |

Outside a deploy script, the loaders that take your extensions (`setupEnvironmentFromFiles(extensions)`, `setupHardhatDeploy(extensions)`, `setupEnvironment(config, extensions)`) return an environment with them already applied; with a bare environment, call the curried form, `deploy(env)(...)`. Writing your own is covered in [Extending rocketh](../../extending/).
