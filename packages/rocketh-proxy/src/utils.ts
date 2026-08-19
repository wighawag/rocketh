import {DeployResult} from '@rocketh/deploy';
import type {Abi, Deployment} from '@rocketh/core/types';

export function checkUpgradeIndex<TAbi extends Abi>(
	oldDeployment: Deployment<TAbi> | null,
	upgradeIndex?: number,
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
						`upgradeIndex === ${upgradeIndex} : expects Deployments numDeployments to be at least ${upgradeIndex}`,
					);
				}
			} else {
				throw new Error(
					`upgradeIndex > 1 : expects Deployments history to exists, or numDeployments to be greater than 1`,
				);
			}
		} else if (history.length > upgradeIndex - 1) {
			return {...oldDeployment, newlyDeployed: false};
		} else if (history.length < upgradeIndex - 1) {
			throw new Error(
				`upgradeIndex === ${upgradeIndex} : expects Deployments history length to be at least ${upgradeIndex - 1}`,
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
	},
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

/**
 * Whether the stored record already describes THIS implementation behind the proxy.
 *
 * Used only on the path where no upgrade was needed, because the chain already runs
 * the target implementation. The question there is whether the record knows that yet:
 * a governed upgrade is executed elsewhere, so the run that wanted it threw before
 * saving and this run has nothing to do but write down what it found.
 *
 * An upgrade this run PERFORMED must save unconditionally and must not come through
 * here. Two implementations can differ while their ABIs are identical, so a comparison
 * like this one would call that unchanged, skip the save, and freeze `numDeployments`
 * on a real upgrade. `upgradeIndex` reads that counter to work out which step of the
 * upgrade story has already run, so freezing it makes a script redo an upgrade or
 * throw. That was a real regression, caught by the upgradeIndex integration test.
 *
 * Compares the implementation's own `deployedBytecode` as well as the merged ABI, for
 * the same reason: an out-of-band upgrade to a new implementation with an unchanged
 * interface is invisible to an ABI-only check.
 *
 * A missing stored record, or a comparison that throws, counts as NOT described: a
 * redundant save is recoverable, a skipped one is the bug this exists to fix.
 */
export function recordDescribesImplementation(
	stored: {abi?: unknown; deployedBytecode?: unknown} | null | undefined,
	abi: unknown,
	implementationArtifact: {deployedBytecode?: unknown},
): boolean {
	if (!stored || !stored.abi) {
		return false;
	}
	try {
		return (
			stored.deployedBytecode === implementationArtifact.deployedBytecode &&
			JSON.stringify(stored.abi) === JSON.stringify(abi)
		);
	} catch {
		return false;
	}
}
