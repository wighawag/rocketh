import {Config} from '../environment/types';

export type InternalEnvironment = {
	exportDeploymentsAsTypes(): Promise<void>;
	recoverTransactionsIfAny(): Promise<void>;
};
