export type InternalEnvironment = {
	recoverTransactionsIfAny(): Promise<void>;
	recordMigration(id: string): void;
	loadDeployments(options?: {reset?: boolean}): Promise<void>;
};
