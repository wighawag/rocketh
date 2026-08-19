import type {Artifact} from 'rocketh/types';
import * as artifacts from '../generated/artifacts/index.js';

/**
 * Which implementation the deploy scripts should CONVERGE ON, this run.
 *
 * A deploy script declares ONE desired implementation. It does not describe a
 * journey ("deploy v1, then upgrade it to v2"), it describes a destination, and
 * rocketh works out whether the chain is already there.
 *
 * That distinction is not stylistic, it is the difference between a script that
 * converges and one that cannot. `deployViaProxy` decides whether to upgrade by
 * reading the proxy's EIP-1967 implementation slot and comparing it to the
 * implementation it just resolved. Two calls under the same name in one script
 * therefore fight each other: the second upgrades to v2, and on the next run the
 * first sees v2 in the slot, wants v1 back, and issues a DOWNGRADE. When the owner
 * is a signable account that merely churns a redundant transaction every run. When
 * the owner is a multisig, the downgrade comes from an unsignable `from`, and if
 * that call is not wrapped it throws `UnknownSignerError` and kills the script.
 *
 * So: pick the target from the environment, and change the environment to upgrade.
 * That is also what a real project does, by editing the artifact its script names.
 *
 *   pnpm deploy:dev localhost --tags scenario-multisig                    # v1, deploys
 *   REGISTRY_VERSION=2 pnpm deploy:dev localhost --tags scenario-multisig # v2, defers
 */
export type RegistryVersion = 1 | 2;

export function targetVersion(): RegistryVersion {
	const raw = process.env.REGISTRY_VERSION ?? '1';
	if (raw !== '1' && raw !== '2') {
		throw new Error(
			`REGISTRY_VERSION must be "1" or "2", got ${JSON.stringify(raw)}`,
		);
	}
	return raw === '1' ? 1 : 2;
}

/**
 * WIDENED TO `Artifact` ON PURPOSE, and the cost is worth naming.
 *
 * The generated artifacts carry their ABI as a literal tuple type, and v2's is a
 * SUPERSET of v1's (it adds `getMessage`). The union of the two is therefore
 * assignable to neither, and handing it to `deployViaProxy` fails to compile with
 * "Source has 5 element(s) but target allows only 4".
 *
 * Widening to the generic `Artifact` makes the union assignable, at the price of
 * losing constructor-argument checking at the call sites (`args: [prefix]` is no
 * longer verified against the ABI). Acceptable HERE, because this demo is about the
 * governance flow rather than about ABI typing, and the alternative is writing the
 * whole `deployViaProxy` call twice in every scenario.
 *
 * A real project does not hit this: a deploy script names ONE artifact and keeps its
 * literal type. The union exists only because the demo has to show both versions.
 */
export function targetArtifact(): Artifact {
	return targetVersion() === 1
		? artifacts.GreetingsRegistry
		: artifacts.GreetingsRegistry2;
}
