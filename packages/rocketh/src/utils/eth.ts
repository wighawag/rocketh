import {EIP1193BlockTag, EIP1193ProviderWithoutEvents} from 'eip-1193';

function avg(arr: bigint[]) {
	const sum = arr.reduce((a: bigint, v: bigint) => a + v);
	return sum / BigInt(arr.length);
}

export type EstimateGasPriceOptions = {
	blockCount: number;
	newestBlock: EIP1193BlockTag;
	rewardPercentiles: number[];
};

export type RoughEstimateGasPriceOptions = {
	blockCount: number;
	newestBlock: EIP1193BlockTag;
	rewardPercentiles: [number, number, number];
};

export type GasPrice = {maxFeePerGas: bigint; maxPriorityFeePerGas: bigint};
export type EstimateGasPriceResult = GasPrice[];
export type RoughEstimateGasPriceResult = {slow: GasPrice; average: GasPrice; fast: GasPrice};

export async function getGasPriceEstimate(
	provider: EIP1193ProviderWithoutEvents,
	options?: Partial<EstimateGasPriceOptions>
): Promise<EstimateGasPriceResult> {
	const defaultOptions: EstimateGasPriceOptions = {
		blockCount: 20,
		newestBlock: 'pending',
		rewardPercentiles: [10, 50, 80],
	};
	const optionsResolved = options ? {...defaultOptions, ...options} : defaultOptions;

	const historicalBlocks = optionsResolved.blockCount;

	const rawFeeHistory = await provider.request({
		method: 'eth_feeHistory',
		params: [`0x${historicalBlocks.toString(16)}`, optionsResolved.newestBlock, optionsResolved.rewardPercentiles],
	});

	let blockNum = Number(rawFeeHistory.oldestBlock);
	const lastBlock = blockNum + rawFeeHistory.reward.length;
	let index = 0;
	const blocksHistory: {number: number; baseFeePerGas: bigint; gasUsedRatio: number; priorityFeePerGas: bigint[]}[] =
		[];
	while (blockNum < lastBlock) {
		blocksHistory.push({
			number: blockNum,
			baseFeePerGas: BigInt(rawFeeHistory.baseFeePerGas[index]),
			gasUsedRatio: Number(rawFeeHistory.gasUsedRatio[index]),
			priorityFeePerGas: rawFeeHistory.reward[index].map((x) => BigInt(x)),
		});
		blockNum += 1;
		index += 1;
	}

	const percentilePriorityFeeAverages: bigint[] = [];
	for (let i = 0; i < optionsResolved.rewardPercentiles.length; i++) {
		percentilePriorityFeeAverages.push(avg(blocksHistory.map((b) => b.priorityFeePerGas[i])));
	}

	const baseFeePerGas = BigInt(rawFeeHistory.baseFeePerGas[rawFeeHistory.baseFeePerGas.length - 1]);

	const result: EstimateGasPriceResult = [];
	for (let i = 0; i < optionsResolved.rewardPercentiles.length; i++) {
		result.push({
			maxFeePerGas: percentilePriorityFeeAverages[i] + baseFeePerGas,
			maxPriorityFeePerGas: percentilePriorityFeeAverages[i],
		});
	}
	return result;
}

export async function getRoughGasPriceEstimate(
	provider: EIP1193ProviderWithoutEvents,
	options?: Partial<RoughEstimateGasPriceOptions>
): Promise<RoughEstimateGasPriceResult> {
	const defaultOptions: EstimateGasPriceOptions = {
		blockCount: 20,
		newestBlock: 'pending',
		rewardPercentiles: [10, 50, 80],
	};
	const optionsResolved = options ? {...defaultOptions, ...options} : defaultOptions;

	if (optionsResolved.rewardPercentiles.length !== 3) {
		throw new Error(`rough gas estimate require 3 percentile, it defaults to [10,50,80]`);
	}

	const result = await getGasPriceEstimate(provider, optionsResolved);
	return {
		slow: result[0],
		average: result[1],
		fast: result[2],
	};
}
