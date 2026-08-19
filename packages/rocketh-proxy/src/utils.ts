import {DeployResult} from '@rocketh/deploy';
import type {Abi, Deployment} from '@rocketh/core/types';

/**
 * Decide whether an `upgradeIndex` step has already run.
 *
 * `upgradeIndex` exists so a deploy script can TELL THE STORY OF AN UPGRADE and stay
 * idempotent while doing it. Every step stays in the script forever:
 *
 * ```typescript
 * deployViaProxy('Vault', {artifact: V1}, {upgradeIndex: 0});
 * deployViaProxy('Vault', {artifact: V2}, {upgradeIndex: 1});
 * deployViaProxy('Vault', {artifact: V3}, {upgradeIndex: 2});
 * ```
 *
 * On a fresh chain all three run in order; on a chain already at V3 all three are
 * no-ops. The same property lets a test replay an upgrade sequence from scratch.
 *
 * `numDeployments` is the mechanism, and the only one: it counts how many times this
 * record has been written, so it is both how many steps have run and the index of the
 * step that runs next. More recorded than asked for means this step already ran (hand
 * back the existing deployment); exactly as many means it is due (proceed); fewer means
 * its predecessors have not run (throw, rather than apply an upgrade out of order).
 *
 * A record with no `numDeployments` counts as one step, which is what it is: written
 * once, never upgraded. That is also what carries records written before the counter
 * was persisted.
 *
 * NO `history`: v1 consults one first, rocketh never wrote one, so those branches were
 * unreachable and their errors named a field users could not produce. See
 * `work/notes/observations/history-is-never-written-so-half-of-checkupgradeindex-is-dead.md`.
 */
export function checkUpgradeIndex<TAbi extends Abi>(
	oldDeployment: Deployment<TAbi> | null,
	upgradeIndex?: number,
): DeployResult<TAbi> | undefined {
	if (typeof upgradeIndex === 'undefined') {
		return;
	}

	// No record at all means no step has run. An existing record with no counter has
	//  had exactly one: it was deployed and never upgraded.
	const stepsRun = oldDeployment ? (oldDeployment.numDeployments as number | undefined) || 1 : 0;

	if (oldDeployment && stepsRun > upgradeIndex) {
		return {...oldDeployment, newlyDeployed: false};
	}

	if (stepsRun < upgradeIndex) {
		throw new Error(
			`upgradeIndex ${upgradeIndex}: this deployment has been recorded ${stepsRun} time(s), so step ${stepsRun} has not run yet. ` +
				`Steps must run in order, so run the earlier ones first.`,
		);
	}

	// stepsRun === upgradeIndex: this is the step that is due. Proceed.
	return;
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
 * Used only where no upgrade was needed because the chain already runs the target, so
 * the question is whether the record knows that yet. An upgrade this run PERFORMED
 * must save unconditionally and must not come through here: two implementations can
 * differ while their ABIs are identical, so this would call that unchanged and freeze
 * `numDeployments` on a real upgrade, which `upgradeIndex` reads. That was a genuine
 * regression, caught by the upgradeIndex integration test.
 *
 * Compares the implementation's own `deployedBytecode` as well as the merged ABI,
 * because an out-of-band upgrade to a new implementation with an unchanged interface is
 * invisible to an ABI-only check. Missing or unserialisable counts as NOT described;
 * see `Environment.save` in `@rocketh/core` for why erring that way is the safe side.
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
