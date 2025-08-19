import {SignerProtocol} from '../environment/index.js';

export type InternalEnvironment = {
	exportDeploymentsAsTypes(): Promise<void>;
	recoverTransactionsIfAny(): Promise<void>;
	recordMigration(id: string): void;
	getSignerProtocol(protocol: string): SignerProtocol | undefined;
};
