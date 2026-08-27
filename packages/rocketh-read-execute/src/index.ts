import {Abi} from 'abitype';
import {EIP1193TransactionData, EIP1193TransactionReceipt} from 'eip-1193';
import type {Artifact, Environment, MinimalDeployment, PendingExecution} from '@rocketh/core/types';
import type {
	ContractFunctionArgs,
	ContractFunctionName,
	DecodeFunctionResultReturnType,
	ReadContractParameters,
	TransactionRequestEIP1559,
	WriteContractParameters,
} from 'viem';
// export type so viem is not needed for inference
export type {
	ContractFunctionArgs,
	ContractFunctionName,
	DecodeFunctionResultReturnType,
	ReadContractParameters,
	TransactionRequestEIP1559,
	WriteContractParameters,
};
import {encodeFunctionData} from 'viem';
import {logs} from 'named-logs';
import {evaluateGuard} from './guard.js';
import type {ExecuteGuard, GuardEvaluation} from './guard.js';

export type {Abi, Artifact, Environment, MinimalDeployment, PendingExecution};

export {read, readByName} from './read.js';
export type {ReadFunction, ReadFunctionByName, ReadingArgs} from './read.js';

export {evaluateGuard} from './guard.js';
export type {CallGuard, CallGuardEvaluation, ExecuteGuard, GuardEvaluation, GuardOutputSelector} from './guard.js';

const logger = logs('@rocketh/read-execute');

type TransactionData = Omit<TransactionRequestEIP1559, 'from' | 'nonce'> & {account: string};

/**
 * The guard's generics are independent of the executed contract's (it usually reads ANOTHER
 * contract), and the implementation body does not need them: it hands the guard to the
 * evaluator whole. They are therefore erased inside, and restored for callers by the two
 * call signatures of {@link ExecuteFunction}.
 */
type AnyGuardFunctionName = ContractFunctionName<Abi, 'pure' | 'view'>;
type AnyGuard = ExecuteGuard<Abi, AnyGuardFunctionName>;
type LooseExecute = (
	deployment: MinimalDeployment<Abi>,
	args: ExecutionArgs<Abi, ContractFunctionName<Abi, 'nonpayable' | 'payable'>> & {guard?: AnyGuard},
) => Promise<EIP1193TransactionReceipt | GuardedExecutionResult<Abi, AnyGuardFunctionName>>;

/**
 * A guarded execution: the same arguments as an unguarded one, plus the on-chain condition
 * under which the call is still needed. The guard's ABI (`TGuardAbi`) is independent of the
 * executed contract's, because the effect of a privileged call is usually observable on
 * ANOTHER contract; it defaults to the executed contract's ABI when the guard names no `on`.
 */
export type GuardedExecutionArgs<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName>,
	TGuardAbi extends Abi,
	TGuardFunctionName extends ContractFunctionName<TGuardAbi, 'pure' | 'view'>,
	TGuardArgs extends ContractFunctionArgs<TGuardAbi, 'pure' | 'view', TGuardFunctionName>,
> = ExecutionArgs<TAbi, TFunctionName, TArgs> & {
	guard: ExecuteGuard<TGuardAbi, TGuardFunctionName, TGuardArgs>;
};

/**
 * The call was NOT needed: the chain already satisfies the guard.
 *
 * Deliberately not named after a transaction, because none exists on this path: nothing was
 * built, nothing was broadcast, and the unknown-signer seam was never consulted. The
 * evaluation is the only evidence of why nothing happened.
 */
export type SkippedExecution<
	TGuardAbi extends Abi,
	TGuardFunctionName extends ContractFunctionName<TGuardAbi, 'pure' | 'view'>,
> = {
	outcome: 'skipped';
	evaluation: GuardEvaluation<TGuardAbi, TGuardFunctionName>;
};

/** The call was still needed, so it was sent exactly as an unguarded call would have been. */
export type SentExecution<
	TGuardAbi extends Abi,
	TGuardFunctionName extends ContractFunctionName<TGuardAbi, 'pure' | 'view'>,
> = {
	outcome: 'sent';
	receipt: EIP1193TransactionReceipt;
	evaluation: GuardEvaluation<TGuardAbi, TGuardFunctionName>;
};

/** What a GUARDED execution returns. An unguarded one still returns a bare receipt. */
export type GuardedExecutionResult<
	TGuardAbi extends Abi,
	TGuardFunctionName extends ContractFunctionName<TGuardAbi, 'pure' | 'view'>,
> = SkippedExecution<TGuardAbi, TGuardFunctionName> | SentExecution<TGuardAbi, TGuardFunctionName>;

/**
 * `execute`'s type, conditional on the presence of a `guard`.
 *
 * The two call signatures are what keeps the guard ADDITIVE: without a guard the signature
 * is identical to the one that shipped before guards existed, `Promise<EIP1193TransactionReceipt>`,
 * so the internal call sites in `@rocketh/proxy` and `@rocketh/diamond` and every user
 * script in the wild are untouched and nobody has to start handling an absent receipt. With
 * a guard, the skipped-or-sent result is returned instead, and the receipt is reachable only
 * after discriminating on `outcome`.
 */
export type ExecuteFunction = {
	<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>,
		TGuardAbi extends Abi = TAbi,
		TGuardFunctionName extends ContractFunctionName<TGuardAbi, 'pure' | 'view'> = ContractFunctionName<
			TGuardAbi,
			'pure' | 'view'
		>,
		TGuardArgs extends ContractFunctionArgs<TGuardAbi, 'pure' | 'view', TGuardFunctionName> = ContractFunctionArgs<
			TGuardAbi,
			'pure' | 'view',
			TGuardFunctionName
		>,
	>(
		deployment: MinimalDeployment<TAbi>,
		args: GuardedExecutionArgs<TAbi, TFunctionName, TArgs, TGuardAbi, TGuardFunctionName, TGuardArgs>,
	): Promise<GuardedExecutionResult<TGuardAbi, TGuardFunctionName>>;
	<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>,
	>(
		deployment: MinimalDeployment<TAbi>,
		// `guard?: undefined` accepts everything the pre-guard signature accepted, while making a
		// POSSIBLY-present guard (`guard: mayBeUndefined`) match NEITHER signature: the result type
		// cannot be decided at compile time in that case, so it is a compile error rather than a
		// receipt type that a skipped call would violate at runtime.
		args: ExecutionArgs<TAbi, TFunctionName, TArgs> & {guard?: undefined},
	): Promise<EIP1193TransactionReceipt>;
};

export type ExecuteFunctionByName = {
	<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>,
		TGuardAbi extends Abi = TAbi,
		TGuardFunctionName extends ContractFunctionName<TGuardAbi, 'pure' | 'view'> = ContractFunctionName<
			TGuardAbi,
			'pure' | 'view'
		>,
		TGuardArgs extends ContractFunctionArgs<TGuardAbi, 'pure' | 'view', TGuardFunctionName> = ContractFunctionArgs<
			TGuardAbi,
			'pure' | 'view',
			TGuardFunctionName
		>,
	>(
		name: string,
		args: GuardedExecutionArgs<TAbi, TFunctionName, TArgs, TGuardAbi, TGuardFunctionName, TGuardArgs>,
	): Promise<GuardedExecutionResult<TGuardAbi, TGuardFunctionName>>;
	<
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>,
	>(
		name: string,
		args: ExecutionArgs<TAbi, TFunctionName, TArgs> & {guard?: undefined},
	): Promise<EIP1193TransactionReceipt>;
};

export type TxFunction = (tx: TransactionData, options?: {message?: string}) => Promise<EIP1193TransactionReceipt>;

export type ExecutionArgs<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
	TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'nonpayable' | 'payable',
		TFunctionName
	>,
> = Omit<WriteContractParameters<TAbi, TFunctionName, TArgs>, 'address' | 'abi' | 'account' | 'chain'> & {
	account: string;
	message?: string;
};

export function execute(env: Environment): ExecuteFunction {
	const executeImplementation = async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
		TArgs extends ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'nonpayable' | 'payable',
			TFunctionName
		>,
	>(
		deployment: MinimalDeployment<TAbi>,
		args: ExecutionArgs<TAbi, TFunctionName, TArgs> & {guard?: AnyGuard},
	): Promise<EIP1193TransactionReceipt | GuardedExecutionResult<Abi, AnyGuardFunctionName>> => {
		const {account, guard, ...viemArgs} = args;

		// The guard is evaluated BEFORE anything is built. A satisfied guard therefore costs one
		// read and reaches neither the broadcast choke point nor the unknown-signer seam behind
		// it: "is this needed" and "can we sign it" stay orthogonal (ADR 0013, ADR 0006).
		// It never catches: a guard that throws has told us nothing, and treating that as "not
		// satisfied" would re-execute a privileged call that may already have happened.
		const evaluation = guard
			? await evaluateGuard(env)(guard, deployment as unknown as MinimalDeployment<Abi>)
			: undefined;
		if (evaluation?.satisfied) {
			return {outcome: 'skipped', evaluation};
		}

		const address = env.resolveAccount(account);

		const artifactToUse = deployment as unknown as Artifact<TAbi>;
		const abi = artifactToUse.abi;
		const calldata = encodeFunctionData<TAbi, TFunctionName>({
			abi,
			functionName: viemArgs.functionName,
			args: viemArgs.args,
		} as any);

		const txParam: EIP1193TransactionData = {
			to: deployment.address,
			type: '0x2',
			from: address,
			chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
			data: calldata,
			gas: viemArgs.gas && (`0x${viemArgs.gas.toString(16)}` as `0x${string}`),
			maxFeePerGas: viemArgs.maxFeePerGas ? (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`) : undefined,
			maxPriorityFeePerGas: viemArgs.maxPriorityFeePerGas
				? (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`)
				: undefined,
			accessList: viemArgs.accessList as any, // TODO type
			nonce: viemArgs.nonce ? (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`) : undefined,
		};
		if (viemArgs.value) {
			txParam.value = `0x${viemArgs.value?.toString(16)}` as `0x${string}`;
		}

		const receipt = await env.broadcastExecution(
			{
				type: 'object',
				data: txParam,
			},
			{
				message: args.message,
				// Declare that this transaction IS a contract call, so that an unsignable `from`
				// (typically a Safe owning the contract) surfaces an `UnknownSignerError` naming
				// the function to run out-of-band instead of only the address. The calldata alone
				// cannot say it: only this call site knows the function name and the decoded args.
				// The deployment NAME is not passed: the environment resolves it at the throw site.
				contract: {
					method: viemArgs.functionName,
					args: (viemArgs.args ?? []) as readonly unknown[],
				},
			},
		);
		return evaluation ? {outcome: 'sent', receipt, evaluation} : receipt;
	};

	return executeImplementation as unknown as ExecuteFunction;
}

export function executeByName(env: Environment): ExecuteFunctionByName {
	const executeByNameImplementation = async (
		name: string,
		args: ExecutionArgs<Abi, ContractFunctionName<Abi, 'nonpayable' | 'payable'>> & {guard?: AnyGuard},
	): Promise<EIP1193TransactionReceipt | GuardedExecutionResult<Abi, AnyGuardFunctionName>> => {
		const deployment = env.getOrNull<Abi>(name);
		if (!deployment) {
			throw new Error(`no deployment named ${name}`);
		}

		return (execute(env) as unknown as LooseExecute)(deployment, args);
	};

	return executeByNameImplementation as unknown as ExecuteFunctionByName;
}

export function tx(env: Environment): TxFunction {
	return async (txData: TransactionData, options?: {message?: string}) => {
		const {account, ...viemArgs} = txData;
		const address = env.resolveAccount(account);

		const txParam: EIP1193TransactionData = {
			type: '0x2',
			to: txData.to || undefined,
			from: address,
			chainId: `0x${env.network.chain.id.toString(16)}` as `0x${string}`,
			data: txData.data,
			gas: viemArgs.gas ? (`0x${viemArgs.gas.toString(16)}` as `0x${string}`) : undefined,
			maxFeePerGas: viemArgs.maxFeePerGas ? (`0x${viemArgs.maxFeePerGas.toString(16)}` as `0x${string}`) : undefined,
			maxPriorityFeePerGas: viemArgs.maxPriorityFeePerGas
				? (`0x${viemArgs.maxPriorityFeePerGas.toString(16)}` as `0x${string}`)
				: undefined,
			// nonce: viemArgs.nonce ? (`0x${viemArgs.nonce.toString(16)}` as `0x${string}`) : undefined,
			accessList: viemArgs.accessList as any, // TODO check
		};
		if (viemArgs.value) {
			txParam.value = `0x${viemArgs.value?.toString(16)}` as `0x${string}`;
		}

		const receipt = await env.broadcastExecution(
			{
				type: 'object',
				data: txParam,
			},
			options,
		);
		return receipt;
	};
}
