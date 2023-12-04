import {TenderlyApiService} from './TenderlyApiService';
import {ApiContract, ContractResponse, TenderlyContractUploadRequest} from './types';
import {TenderlyPublicNetwork} from './types/Network';

export const TENDERLY_API_BASE_URL = 'https://api.tenderly.co';
export const TENDERLY_DASHBOARD_BASE_URL = 'https://dashboard.tenderly.co';

export const ReverseNetworkMap: Record<string, string> = {
	'42': 'kovan',
	'5': 'goerli',
	'1': 'mainnet',
	'4': 'rinkeby',
	'3': 'ropsten',
	'80001': 'matic-mumbai',
	'137': 'matic-mainnet',
	'100': 'xdai',
	'99': 'poa',
	'56': 'binance',
	'97': 'rialto',
	'30': 'rsk',
	'31': 'rsk-testnet',
	'43114': 'c-chain',
	'43113': 'c-chain-testnet',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processError(error: any) {
	if (error.response) {
		console.error(error.response.status, error.response.statusText, JSON.stringify(error.response.data, null, '  '));
	} else {
		console.error(error);
	}
	console.log(`There was an error during the request. Network fetch failed`);
}

export class TenderlyService {
	public static async getPublicNetworks(): Promise<TenderlyPublicNetwork[]> {
		let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
		const apiPath = '/api/v1/public-networks';

		if (TenderlyApiService.isAuthenticated()) {
			tenderlyApi = TenderlyApiService.configureInstance();
		}

		let response: TenderlyPublicNetwork[] = [];
		try {
			response = (await tenderlyApi.get(apiPath)).data;
		} catch (error) {
			processError(error);
		}
		return response;
	}

	public static async verifyContracts(request: TenderlyContractUploadRequest): Promise<void> {
		let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
		const apiPath = '/api/v1/public/verify-contracts';

		if (TenderlyApiService.isAuthenticated()) {
			tenderlyApi = TenderlyApiService.configureInstance();
		}

		try {
			const response = await tenderlyApi.post(apiPath, {...request});

			const responseData: ContractResponse = response.data;

			let contract: ApiContract;

			if (responseData.bytecode_mismatch_errors != null) {
				console.log(`Error: Bytecode mismatch detected. Contract verification failed`);
				return;
			}

			if (!responseData.contracts?.length) {
				console.log(`No new contracts have been verified`);
				return;
			}

			console.log('Smart Contracts successfully verified');
			console.group();
			for (contract of responseData.contracts) {
				const contractLink = `${TENDERLY_DASHBOARD_BASE_URL}/contract/${ReverseNetworkMap[contract.network_id]}/${
					contract.address
				}`;
				console.log(`Contract ${contract.address} verified. You can view the contract at ${contractLink}`);
			}
			console.groupEnd();
		} catch (error) {
			processError(error);
		}
	}

	public static async pushContracts(
		request: TenderlyContractUploadRequest,
		tenderlyProject: string,
		username: string
	): Promise<void> {
		const tenderlyApi = TenderlyApiService.configureInstance();

		try {
			const response = await tenderlyApi.post(`/api/v1/account/${username}/project/${tenderlyProject}/contracts`, {
				...request,
			});

			const responseData: ContractResponse = response.data;

			if (responseData.bytecode_mismatch_errors != null) {
				console.log(`Error: Bytecode mismatch detected. Contract push failed`);
				return;
			}

			if (!responseData.contracts?.length) {
				console.log(`No new contracts have been pushed`);
				return;
			}

			const dashLink = `${TENDERLY_DASHBOARD_BASE_URL}/${username}/${tenderlyProject}/contracts`;

			console.log(
				`Successfully pushed Smart Contracts for project ${tenderlyProject}. You can view your contracts at ${dashLink}`
			);
		} catch (error) {
			processError(error);
		}
	}
}
