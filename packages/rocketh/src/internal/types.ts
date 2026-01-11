export type InternalEnvironment = {
	recoverTransactionsIfAny(): Promise<void>;
	recordMigration(id: string): void;
};
