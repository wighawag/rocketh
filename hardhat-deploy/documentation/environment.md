# Environment object and extension

Each deploy function is given a environment object as first argument.

it contains at least the following fields :

```typescript
export interface Environment<
	NamedAccounts extends UnresolvedUnknownNamedAccounts = UnresolvedUnknownNamedAccounts,
	Data extends UnresolvedNetworkSpecificData = UnresolvedNetworkSpecificData,
	Deployments extends UnknownDeployments = UnknownDeployments,
	Extra extends Record<string, unknown> = Record<string, unknown>
> {
	readonly name: string;
	readonly context: {
		readonly saveDeployments: boolean;
		readonly autoMine: boolean;
		readonly retry: ResolvedRetryConfig;
	};
	readonly tags: {readonly [tag: string]: boolean};
	readonly network: {
		readonly chain: Chain;
		readonly provider: TransactionHashTracker;
		readonly fork?: boolean;
		readonly deterministicDeployment: DeterministicDeploymentInfo;
	};
	readonly deployments: Deployments;
	readonly namedAccounts: ResolvedNamedAccounts<NamedAccounts>;
	readonly data: ResolvedNetworkSpecificData<Data>;
	readonly namedSigners: ResolvedNamedSigners<ResolvedNamedAccounts<NamedAccounts>>;
	readonly unnamedAccounts: EIP1193Account[];
	// unnamedSigners: {type: 'remote'; signer: EIP1193ProviderWithoutEvents}[];
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
	save<TAbi extends Abi = Abi>(
		name: string,
		deployment: Deployment<TAbi>,
		options?: {doNotCountAsNewDeployment?: boolean}
	): Promise<Deployment<TAbi>>;
	broadcastExecution(
		transaction: TransactionToBroadcast,
		options?: {message?: string}
	): Promise<EIP1193TransactionReceipt>;
	broadcastDeployment<TAbi extends Abi = Abi>(
		name: string,
		transaction: TransactionToBroadcast,
		partialDeployment: PartialDeployment<TAbi>,
		options?: {message?: string; expectedAddress?: `0x${string}`}
	): Promise<Deployment<TAbi>>;
	get<TAbi extends Abi>(name: string): Deployment<TAbi>;
	getOrNull<TAbi extends Abi>(name: string): Deployment<TAbi> | null;
	fromAddressToNamedABI<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]};
	fromAddressToNamedABIOrNull<TAbi extends Abi>(address: Address): {mergedABI: TAbi; names: string[]} | null;
	showMessage(message: string): void;
	showProgress(message?: string): ProgressIndicator;
	resolveAccountOrUndefined(account: string | EIP1193Account): `0x${string}` | undefined;
	resolveAccount(account: string | EIP1193Account): `0x${string}`;
	hasMigrationBeenDone(id: string): boolean;
	readonly extra?: Extra;
}
```

The environment is expanded by each rocketh module you import. For example:

- **`@rocketh/deploy`** adds the `deploy` function
- **`@rocketh/read-execute`** adds `read`, `execute`, `readByName`, `executeByName`, and `tx` functions
- **`@rocketh/proxy`** adds the `deployViaProxy` function
- **`@rocketh/diamond`** adds the `diamond` function
- **`@rocketh/viem`** adds the `viem` property with `getContract`, `getWritableContract`, `publicClient`, and `walletClient`