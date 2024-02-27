import {EIP1193GenericRequest, EIP1193GenericRequestProvider} from 'eip-1193';
import {BaseProvider} from './BaseProvider';

export class TransactionHashTracker extends BaseProvider {
	public transactionHashes: `0x${string}`[] = [];

	constructor(provider: EIP1193GenericRequestProvider) {
		super(provider);
	}

	protected async _request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(args: V): Promise<T> {
		let response;
		try {
			response = await this.provider.request<T>(args);
		} catch (err) {
			console.error(`failed to execute ${args.method}`, args);
			throw err;
		}

		if (args.method === 'eth_sendRawTransaction' || args.method === 'eth_sendTransaction') {
			this.transactionHashes.push(response as `0x${string}`);
		}
		return response;
	}
}
