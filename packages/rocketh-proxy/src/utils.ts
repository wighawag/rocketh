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
 * Whether a stored ABI already describes what we are about to record.
 *
 * The proxy record is written whenever the chain agrees with the target
 * implementation, however it got there, which includes runs where rocketh did
 * nothing at all. `env.save` bumps `numDeployments` and rewrites the file, and that
 * counter means "how many times the recorded deployment CHANGED", so it must tick
 * for an upgrade rocketh is only now observing and must NOT tick for a re-run that
 * changed nothing. This comparison is what separates those two cases.
 *
 * Compared as ORDER-SENSITIVE JSON, deliberately. The candidate always comes from
 * `mergeABIs` over the same inputs in the same order, so a genuine no-op run
 * reproduces byte-identical output; anything that does differ is a real change worth
 * recording. A semantic ABI comparison would be more forgiving and much easier to
 * get subtly wrong, and being wrong in the lenient direction here means silently
 * keeping a stale ABI, which is the bug this exists to fix.
 *
 * A missing stored ABI counts as different: there is nothing recorded to trust.
 */
export function sameABI(stored: unknown, candidate: unknown): boolean {
	if (!stored) {
		return false;
	}
	try {
		return JSON.stringify(stored) === JSON.stringify(candidate);
	} catch {
		// Never let a comparison failure decide the outcome: fall back to "different",
		//  which re-records. A redundant save is recoverable; a skipped one is the bug.
		return false;
	}
}
