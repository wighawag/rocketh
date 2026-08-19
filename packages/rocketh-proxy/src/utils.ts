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
 * On a fresh chain all three run in order. On a chain already at V3 all three are
 * no-ops. The same property lets a TEST replay an upgrade sequence from scratch, which
 * is the only way to exercise an upgrade path that has already happened in production.
 *
 * `numDeployments` IS THE MECHANISM, and the only one. It counts how many times this
 * record has been written, so it is exactly "how many steps of the story have run", and
 * therefore also the index of the step that runs next. Three outcomes:
 *
 * - more steps recorded than this index: this step already ran, hand back the existing
 *   deployment as not-newly-deployed;
 * - exactly this many: this step is the next one, proceed;
 * - fewer: the script is being asked to run a step whose predecessors have not run, so
 *   throw rather than silently apply an upgrade out of order.
 *
 * A record with no `numDeployments` counts as one step, which is what it is: written
 * once, never upgraded. That also carries records written before the counter was
 * persisted, where the field is simply absent.
 *
 * NO `history`. hardhat-deploy v1 consults a `history` array first and falls back to
 * this counter, and that shape was ported here, but rocketh has never written `history`
 * anywhere, so those branches could not run and the error messages advertised a field
 * users could not produce. Removed rather than reinstated, deliberately: one mechanism
 * that works beats two where one is decoration. See
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

	if (stepsRun > upgradeIndex) {
		return {...(oldDeployment as Deployment<TAbi>), newlyDeployed: false};
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
