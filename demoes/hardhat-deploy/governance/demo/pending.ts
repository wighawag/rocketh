import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * What `catchUnknownSigner` hands back: v1's shape exactly.
 */
export type DeferredTransaction = {
	from: string;
	to?: string;
	value?: string;
	data?: string;
};

/**
 * ROCKETH PERSISTS NOTHING. This file is DEMO SCAFFOLDING, not a rocketh feature, and
 * it lives in `demo/` rather than `rocketh/` to say so: `rocketh/` holds the real
 * wiring (`config.ts`, `deploy.ts`, `environment.ts`) and nothing else.
 *
 * It is not a preview of anything either. Under the design settled for unsignable
 * routes, a run REPORTS one transaction and then THROWS, so there is exactly one
 * surfaced item per run and no batch to accumulate. A file like this could not earn
 * its place in core even if someone wanted it to.
 *
 * `catchUnknownSigner` prints the transaction and returns it, and that is the whole
 * of its side effects: no unsigned-transactions file, no record mutation, exactly as
 * hardhat-deploy v1 behaved. Idempotency comes from on-chain state alone.
 *
 * The demo writes the deferred transactions to `pending/<scenario>.json` purely so
 * that `scripts/act-as-governance.ts` has something to read in a second terminal.
 * A real project might do exactly this, or paste from the printed block, or feed a
 * Safe SDK. That choice is the user's, and keeping it OUT of rocketh is what lets
 * a migrated v1 script behave identically.
 */
const demoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export function recordPending(
	scenario: string,
	transactions: (DeferredTransaction | null)[],
): void {
	const pending = transactions.filter(
		(tx): tx is DeferredTransaction => tx !== null,
	);
	const file = join(demoRoot, 'pending', `${scenario}.json`);

	if (pending.length === 0) {
		// A converged run leaves no pending file behind, so an empty `pending/`
		//  directory is the signal that governance has caught up with the scripts.
		rmSync(file, {force: true});
		return;
	}

	mkdirSync(dirname(file), {recursive: true});
	writeFileSync(
		file,
		`${JSON.stringify({scenario, transactions: pending}, null, 2)}\n`,
	);
	console.log(
		`\n[demo] ${pending.length} transaction(s) awaiting governance, written to pending/${scenario}.json`,
	);
	console.log(
		`[demo] execute them with:  pnpm act-as-governance ${scenario}\n`,
	);
}
