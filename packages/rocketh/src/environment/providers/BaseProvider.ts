import {
	EIP1193Accounts,
	EIP1193AccountsRequest,
	EIP1193AddChainError,
	EIP1193Block,
	EIP1193BlockNumberRequest,
	EIP1193BlockWithTransactions,
	EIP1193CallRequest,
	EIP1193ChainIdRequest,
	EIP1193CoinbaseRequest,
	EIP1193EstimateGasRequest,
	EIP1193GasPriceRequest,
	EIP1193GenericRequest,
	EIP1193GenericRequestProvider,
	EIP1193GetBalanceRequest,
	EIP1193GetBlockByHashRequest,
	EIP1193GetBlockByNumberRequest,
	EIP1193GetCodeRequest,
	EIP1193GetLogsRequest,
	EIP1193GetStorageAtRequest,
	EIP1193GetTransactionByBlockHashAndIndexRequest,
	EIP1193GetTransactionByBlockNumberAndIndexRequest,
	EIP1193GetTransactionByHashRequest,
	EIP1193GetTransactionCountByHashRequest,
	EIP1193GetTransactionCountByNumberRequest,
	EIP1193GetTransactionCountRequest,
	EIP1193GetTransactionReceiptRequest,
	EIP1193GetUncleByBlockHashAndIndexRequest,
	EIP1193GetUncleByBlockNumberAndIndexRequest,
	EIP1193GetUncleCountByBlockHashRequest,
	EIP1193GetUncleCountByBlockNumberRequest,
	EIP1193LegacySignRequest,
	EIP1193Log,
	EIP1193NetListeningRequest,
	EIP1193NetPeerCountRequest,
	EIP1193NetVersionRequest,
	EIP1193PTypedSignRequest,
	EIP1193PTypedSignv4Request,
	EIP1193PersonalSignRequest,
	EIP1193ProtocolVersionRequest,
	EIP1193ProviderWithoutEvents,
	EIP1193RequestAccountsRequest,
	EIP1193SendRawTransactionRequest,
	EIP1193SendTransactionRequest,
	EIP1193SignTransactionRequest,
	EIP1193SubscribeRequest,
	EIP1193SwitchChainError,
	EIP1193SyncingRequest,
	EIP1193SyncingStatus,
	EIP1193Transaction,
	EIP1193TransactionReceipt,
	EIP1193UnsubscribeRequest,
	EIP1193Web3ClientVersionRequest,
	EIP1193Web3SHARequest,
	ERIP1193AddChainRequest,
	ERIP1193SwitchChainRequest,
} from 'eip-1193';

export abstract class BaseProvider implements EIP1193ProviderWithoutEvents {
	constructor(protected provider: EIP1193GenericRequestProvider) {}
	request(args: EIP1193Web3ClientVersionRequest): Promise<string>;
	request(args: EIP1193Web3SHARequest): Promise<`0x${string}`>;
	request(args: EIP1193NetVersionRequest): Promise<`0x${string}`>;
	request(args: EIP1193NetListeningRequest): Promise<boolean>;
	request(args: EIP1193NetPeerCountRequest): Promise<`0x${string}`>;
	request(args: EIP1193ProtocolVersionRequest): Promise<string>;
	request(args: EIP1193SyncingRequest): Promise<false | EIP1193SyncingStatus>;
	request(args: EIP1193CoinbaseRequest): Promise<`0x${string}`>;
	request(args: EIP1193GasPriceRequest): Promise<`0x${string}`>;
	request(args: EIP1193AccountsRequest): Promise<EIP1193Accounts>;
	request(args: EIP1193BlockNumberRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetBalanceRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetStorageAtRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetTransactionCountRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetTransactionCountByHashRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetTransactionCountByNumberRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetUncleCountByBlockHashRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetUncleCountByBlockNumberRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetCodeRequest): Promise<`0x${string}`>;
	request(args: EIP1193LegacySignRequest): Promise<`0x${string}`>;
	request(args: EIP1193SignTransactionRequest): Promise<`0x${string}`>;
	request(args: EIP1193SendTransactionRequest): Promise<`0x${string}`>;
	request(args: EIP1193SendRawTransactionRequest): Promise<`0x${string}`>;
	request(args: EIP1193CallRequest): Promise<`0x${string}`>;
	request(args: EIP1193EstimateGasRequest): Promise<`0x${string}`>;
	request(args: EIP1193GetBlockByHashRequest<false>): Promise<EIP1193Block | null>;
	request(args: EIP1193GetBlockByHashRequest<true>): Promise<EIP1193BlockWithTransactions | null>;
	request(args: EIP1193GetBlockByNumberRequest<false>): Promise<EIP1193Block | null>;
	request(args: EIP1193GetBlockByNumberRequest<true>): Promise<EIP1193BlockWithTransactions | null>;
	request(args: EIP1193GetTransactionByHashRequest): Promise<EIP1193Transaction | null>;
	request(args: EIP1193GetTransactionByBlockHashAndIndexRequest): Promise<EIP1193Transaction | null>;
	request(args: EIP1193GetTransactionByBlockNumberAndIndexRequest): Promise<EIP1193Transaction | null>;
	request(args: EIP1193GetTransactionReceiptRequest): Promise<EIP1193TransactionReceipt | null>;
	request(args: EIP1193GetUncleByBlockHashAndIndexRequest): Promise<EIP1193Block | null>;
	request(args: EIP1193GetUncleByBlockNumberAndIndexRequest): Promise<EIP1193Block | null>;
	request(args: EIP1193GetLogsRequest): Promise<EIP1193Log[]>;
	request(args: EIP1193PersonalSignRequest): Promise<`0x${string}`>;
	request(args: EIP1193PTypedSignv4Request): Promise<`0x${string}`>;
	request(args: EIP1193PTypedSignRequest): Promise<`0x${string}`>;
	request(args: EIP1193ChainIdRequest): Promise<`0x${string}`>;
	request(args: EIP1193RequestAccountsRequest): Promise<EIP1193Accounts>;
	request(args: ERIP1193SwitchChainRequest): Promise<EIP1193SwitchChainError | null>;
	request(args: ERIP1193AddChainRequest): Promise<EIP1193AddChainError | null>;
	request(args: EIP1193SubscribeRequest): Promise<string>;
	request(args: EIP1193UnsubscribeRequest): Promise<boolean>;
	request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(args: V): Promise<T>;
	request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(args: V): Promise<T> {
		return this._request(args);
	}

	protected abstract _request<T = unknown, V extends EIP1193GenericRequest = EIP1193GenericRequest>(
		args: V
	): Promise<T>;
}
