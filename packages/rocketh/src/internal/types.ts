export type InternalEnvironment = {
	exportDeploymentsAsTypes(): Promise<void>;
	recoverTransactionsIfAny(): Promise<void>;
};
