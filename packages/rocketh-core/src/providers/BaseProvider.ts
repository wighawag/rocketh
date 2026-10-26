import {EIP1193GenericRequest, EIP1193GenericRequestProvider, EIP1193CoreProvider} from 'eip-1193';

export abstract class BaseProvider implements EIP1193CoreProvider {
	constructor(protected provider: EIP1193CoreProvider) {}

	request(args: any): Promise<any> {
		return this._request(args);
	}

	protected abstract _request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(
		args: V,
	): Promise<T>;
}
