import {DeployResult} from '@rocketh/deploy';
import {Abi, Deployment} from 'rocketh';

export function checkUpgradeIndex<TAbi extends Abi>(
	oldDeployment: Deployment<TAbi> | null,
	upgradeIndex?: number
): DeployResult<TAbi> | undefined {
	if (typeof upgradeIndex === 'undefined') {
		return;
	}
	if (upgradeIndex === 0) {
		if (oldDeployment) {
			return {...oldDeployment, newlyDeployed: false};
		}
	} else if (upgradeIndex === 1) {
		if (!oldDeployment) {
			throw new Error('upgradeIndex === 1 : expects Deployments to already exists');
		}
		const history: any[] | undefined = oldDeployment.history as any[] | undefined;
		const numDeployments: number | undefined = oldDeployment.numDeployments as number | undefined;
		if ((history && history.length > 0) || (numDeployments && numDeployments > 1)) {
			return {...oldDeployment, newlyDeployed: false};
		}
	} else {
		if (!oldDeployment) {
			throw new Error(`upgradeIndex === ${upgradeIndex} : expects Deployments to already exists`);
		}

		const history: any[] | undefined = oldDeployment.history as any[] | undefined;
		const numDeployments: number | undefined = oldDeployment.numDeployments as number | undefined;
		if (!history) {
			if (numDeployments && numDeployments > 1) {
				if (numDeployments > upgradeIndex) {
					return {...oldDeployment, newlyDeployed: false};
				} else if (numDeployments < upgradeIndex) {
					throw new Error(
						`upgradeIndex === ${upgradeIndex} : expects Deployments numDeployments to be at least ${upgradeIndex}`
					);
				}
			} else {
				throw new Error(
					`upgradeIndex > 1 : expects Deployments history to exists, or numDeployments to be greater than 1`
				);
			}
		} else if (history.length > upgradeIndex - 1) {
			return {...oldDeployment, newlyDeployed: false};
		} else if (history.length < upgradeIndex - 1) {
			throw new Error(
				`upgradeIndex === ${upgradeIndex} : expects Deployments history length to be at least ${upgradeIndex - 1}`
			);
		}
	}
}

export function replaceTemplateArgs(
	proxyArgsTemplate: string[],
	{
		implementationAddress,
		proxyAdmin,
		data,
		proxyAddress,
	}: {
		implementationAddress: string;
		proxyAdmin: string;
		data: string;
		proxyAddress?: string;
	}
): any[] {
	const proxyArgs: any[] = [];
	for (let i = 0; i < proxyArgsTemplate.length; i++) {
		const argValue = proxyArgsTemplate[i];
		if (argValue === '{implementation}') {
			proxyArgs.push(implementationAddress);
		} else if (argValue === '{admin}') {
			proxyArgs.push(proxyAdmin);
		} else if (argValue === '{data}') {
			proxyArgs.push(data);
		} else if (argValue === '{proxy}') {
			if (!proxyAddress) {
				throw new Error(`Expected proxy address but none was specified.`);
			}
			proxyArgs.push(proxyAddress);
		} else {
			proxyArgs.push(argValue);
		}
	}

	return proxyArgs;
}
