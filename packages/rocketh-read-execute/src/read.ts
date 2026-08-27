import type {Abi} from 'abitype';
import type {Artifact, Environment, MinimalDeployment} from '@rocketh/core/types';
import type {
	ContractFunctionArgs,
	ContractFunctionName,
	DecodeFunctionResultReturnType,
	ReadContractParameters,
} from 'viem';
import {decodeFunctionResult, encodeFunctionData, AbiDecodingZeroDataError} from 'viem';

export type ReadFunction = <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
>(
	deployment: MinimalDeployment<TAbi>,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>,
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>>;

export type ReadFunctionByName = <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
>(
	name: string,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>,
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>>;

export type ReadingArgs<
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
> = Omit<
	ReadContractParameters<TAbi, TFunctionName, TArgs>,
	'address' | 'abi' | 'account' | 'blockOverrides' | 'factory' | 'factoryData' | 'stateOverride'
> & {
	account?: string;
};

export function read(
	env: Environment,
): <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
>(
	deployment: MinimalDeployment<TAbi>,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>,
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>> {
	return async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>,
	>(
		deployment: MinimalDeployment<TAbi>,
		args: ReadingArgs<TAbi, TFunctionName, TArgs>,
	) => {
		const {account, ...viemArgs} = args;
		const address = account ? env.resolveAccountOrUndefined(account) : undefined;

		const artifactToUse = deployment as unknown as Artifact<TAbi>;
		const abi = artifactToUse.abi;
		const calldata = encodeFunctionData<TAbi, TFunctionName>({
			abi,
			functionName: viemArgs.functionName,
			args: viemArgs.args,
		} as any);

		const callObject: Record<string, any> = {
			to: deployment.address,
			data: calldata,
		};
		if (address) {
			callObject.from = address;
		}
		if (viemArgs.authorizationList) {
			callObject.authorizationList = viemArgs.authorizationList;
		}

		const blockNumberOrTag = viemArgs.blockNumber || viemArgs.blockTag || 'latest';

		const retryConfig = env.context.retry;
		let currentResult: `0x${string}` = (await env.network.provider.request({
			method: 'eth_call',
			params: [callObject, blockNumberOrTag] as any, // TODO fix eip-1193 package
		})) as `0x${string}`;

		for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
			try {
				const parsed = decodeFunctionResult<TAbi, TFunctionName>({
					abi,
					functionName: viemArgs.functionName,
					data: currentResult,
					args: viemArgs.args,
				} as any);

				return parsed as DecodeFunctionResultReturnType<TAbi, TFunctionName>;
			} catch (error: any) {
				if (!(error instanceof AbiDecodingZeroDataError)) {
					throw error;
				}

				// `fromAddressToNamedABIOrNull` can THROW despite its name: it merges the ABIs of
				// every deployment registered at this address, and `mergeArtifacts` throws
				// `ABI conflict: ...` when two of them share a function selector. So it returns
				// `null` for "no match" but throws for "several conflicting matches".
				//
				// Here that throw would REPLACE the decode error we are in the middle of handling,
				// which is the error the caller actually needs: an address with a conflicting ABI
				// registration would report a bookkeeping problem instead of "this call returned no
				// data". A conflict is treated exactly like no match — we cannot tell whether the
				// address is still a contract worth retrying — so the original error is rethrown.
				let deploymentInfo: ReturnType<typeof env.fromAddressToNamedABIOrNull> = null;
				try {
					deploymentInfo = env.fromAddressToNamedABIOrNull(deployment.address);
				} catch (lookupError) {
					throw error;
				}
				if (!deploymentInfo) {
					throw error;
				}

				if (attempt === retryConfig.maxRetries) {
					throw error;
				}

				await new Promise((resolve) => setTimeout(resolve, retryConfig.delay));

				currentResult = (await env.network.provider.request({
					method: 'eth_call',
					params: [callObject, blockNumberOrTag] as any,
				})) as `0x${string}`;
			}
		}
		throw new Error('unreachable');
	};
}

export function readByName(
	env: Environment,
): <
	TAbi extends Abi,
	TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
	TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
		TAbi,
		'pure' | 'view',
		TFunctionName
	>,
>(
	name: string,
	args: ReadingArgs<TAbi, TFunctionName, TArgs>,
) => Promise<DecodeFunctionResultReturnType<TAbi, TFunctionName>> {
	return async <
		TAbi extends Abi,
		TFunctionName extends ContractFunctionName<TAbi, 'pure' | 'view'>,
		TArgs extends ContractFunctionArgs<TAbi, 'pure' | 'view', TFunctionName> = ContractFunctionArgs<
			TAbi,
			'pure' | 'view',
			TFunctionName
		>,
	>(
		name: string,
		args: ReadingArgs<TAbi, TFunctionName, TArgs>,
	) => {
		const deployment = env.getOrNull<TAbi>(name);
		if (!deployment) {
			throw new Error(`no deployment named ${name}`);
		}

		return read(env)(deployment, args);
	};
}
