export type InternalEnvironment = {
	exportDeploymentsAsTypes(): Promise<void>;
	recoverTransactionsIfAny(): Promise<void>;
	recordMigration(id: string): void;
};
