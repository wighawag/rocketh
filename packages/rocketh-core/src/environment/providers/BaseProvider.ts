import {EIP1193GenericRequest, EIP1193GenericRequestProvider, EIP1193ProviderWithoutEvents} from 'eip-1193';

export abstract class BaseProvider implements EIP1193ProviderWithoutEvents {
	constructor(protected provider: EIP1193ProviderWithoutEvents) {}

	request(args: any): Promise<any> {
		return this._request(args);
	}

	protected abstract _request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(
		args: V
	): Promise<T>;
}
