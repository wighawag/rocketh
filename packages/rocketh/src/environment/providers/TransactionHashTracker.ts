import {EIP1193GenericRequest, EIP1193GenericRequestProvider} from 'eip-1193';
import {BaseProvider} from './BaseProvider';

export class TransactionHashTracker extends BaseProvider {
	public transactionHashes: `0x${string}`[] = [];

	constructor(provider: EIP1193GenericRequestProvider) {
		super(provider);
	}

	protected async _request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(args: V): Promise<T> {
		const response = await this.provider.request<T>(args);
		if (args.method === 'eth_sendRawTransaction' || args.method === 'eth_sendTransaction') {
			this.transactionHashes.push(response as `0x${string}`);
		}
		return response;
	}
}
