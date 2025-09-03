import {EIP1193GenericRequest, EIP1193ProviderWithoutEvents} from 'eip-1193';
import {BaseProvider} from './BaseProvider.js';

export class TransactionHashTrackerProvider extends BaseProvider implements EIP1193ProviderWithoutEvents {
	public transactionHashes: `0x${string}`[] = [];

	constructor(provider: EIP1193ProviderWithoutEvents) {
		super(provider);
	}

	protected async _request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(args: V): Promise<T> {
		const response = await this.provider.request(args as any);
		if (args.method === 'eth_sendRawTransaction' || args.method === 'eth_sendTransaction') {
			this.transactionHashes.push(response as `0x${string}`);
		}
		return response as T;
	}
}

export type TransactionHashTracker = EIP1193ProviderWithoutEvents & {
	transactionHashes: `0x${string}`[];
};
