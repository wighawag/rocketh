import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import hre from 'hardhat';
import {artifacts, loadEnvironmentFromHardhat} from '../rocketh/environment.js';
import type {DeferredTransaction} from '../demo/pending.js';

/**
 * The OPERATOR side of the loop, and the half a README cannot convince you of.
 *
 * A deploy script that defers is only half a story. This script is the other half: it
 * takes the transactions `catchUnknownSigner` handed back and actually sends them
 * through the multisig, so you can then re-run the deploy script and watch it converge
 * to `null` because the CHAIN changed, not because anything was remembered.
 *
 * In a real project this is where a Safe UI, the Safe SDK or a hardware wallet would
 * sit. Nothing about it is a rocketh feature: rocketh's job ended when it printed the
 * transaction.
 *
 * Usage:
 *   pnpm act-as-governance <scenario>
 *
 * e.g. pnpm act-as-governance scenario-multisig
 */
const demoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
	const scenario = process.argv[2];
	if (!scenario) {
		console.error('usage: pnpm act-as-governance <scenario>');
		console.error('  e.g. pnpm act-as-governance scenario-multisig');
		process.exit(1);
	}

	const file = join(demoRoot, 'pending', `${scenario}.json`);
	let pending: {scenario: string; transactions: DeferredTransaction[]};
	try {
		pending = JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		console.log(`Nothing pending for "${scenario}" (no ${file}).`);
		console.log(
			'Either governance has caught up, or the deploy script has not run yet.',
		);
		return;
	}

	const env = await loadEnvironmentFromHardhat({hre});
	const multisig = env.get<typeof artifacts.SimpleMultisig.abi>('Multisig');
	const operator = env.namedAccounts.governanceOperator;

	console.log(
		`Replaying ${pending.transactions.length} transaction(s) for "${scenario}" through the multisig.`,
	);
	if (pending.transactions.length > 1) {
		// Only worth saying when there IS an order to get wrong. `scenario-ordered` has an
		//  on-chain guard that reverts if you replay its pair the other way round.
		console.log(
			'IN ORDER: some scenarios have an on-chain guard that reverts if you do not.',
		);
	}
	console.log('');

	for (const [index, transaction] of pending.transactions.entries()) {
		const label = `[${index + 1}/${pending.transactions.length}]`;

		// The only shape this demo knows how to replay. A transaction whose `from` is a
		//  timelock cannot be sent by anybody, which is the entire point of scenario 004:
		//  there, the deploy script has already translated it into a multisig-sendable
		//  `schedule` / `execute` call before writing it here.
		if (transaction.from.toLowerCase() !== multisig.address.toLowerCase()) {
			console.error(
				`${label} REFUSING: from is ${transaction.from}, which is not the multisig (${multisig.address}).`,
			);
			console.error(
				'         If that address is a contract, no operator can send from it. It needs a call-through',
			);
			console.error(
				'         translation first. See deploy/004_timelock_owned_admin.ts.',
			);
			process.exit(1);
		}

		console.log(
			`${label} to=${transaction.to} value=${transaction.value ?? '0'}`,
		);

		await env.execute(multisig, {
			account: operator,
			functionName: 'execTransaction',
			args: [
				transaction.to as `0x${string}`,
				BigInt(transaction.value ?? '0'),
				(transaction.data ?? '0x') as `0x${string}`,
			],
		});

		console.log(`${label} done`);
	}

	console.log('\nGovernance has executed. Re-run the deploy script:');
	console.log(`  pnpm deploy:dev localhost --tags ${scenario}`);
	console.log('It should now find the change on chain and skip the step.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
