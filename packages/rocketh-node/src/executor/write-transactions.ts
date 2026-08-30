import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type {CapturedTransaction} from '@rocketh/core/types';

/**
 * The bytes a consumer outside this process reads: a JSON ARRAY of entries, in the order the run
 * broadcast them, and nothing else. No envelope, no version, no run metadata: the file has one
 * job and the whole of it is the ordered list, which a Safe batching tool or a Solidity
 * `setUp()` can walk without knowing anything about rocketh.
 *
 * Each entry is built key by key rather than passed through, for the same reason the CLI's
 * `toExecutionParams` refuses to spread: a field that ever lands on a captured entry (a gas
 * price, a nonce, a hash) must not be able to reach this file by accident and become a contract
 * with consumers who will happily replay it. What an entry may carry is decided HERE, and adding
 * a key to the file is then a deliberate edit rather than a side effect elsewhere.
 *
 * A field the transaction did not carry stays ABSENT rather than becoming `null`: a deployment
 * has no `to`, the deterministic-factory funding transfer genuinely has no `data`, and `'0x'`
 * data would turn a replay of that transfer into an empty CALL. `value` is passed through as the
 * 0x QUANTITY the broadcast choke point saw, never converted, so a replay hands a node back
 * exactly what this run sent it.
 *
 * Indented with two spaces and ending in a newline: an operator reads this file, and diffs it
 * between rehearsals.
 */
export function serializeCapturedTransactions(transactions: readonly CapturedTransaction[]): string {
	return `${JSON.stringify(transactions.map(toFileEntry), null, 2)}\n`;
}

function toFileEntry(transaction: CapturedTransaction): CapturedTransaction {
	switch (transaction.type) {
		case 'intent':
			return {
				type: 'intent',
				from: transaction.from,
				...(transaction.to !== undefined ? {to: transaction.to} : {}),
				...(transaction.value !== undefined ? {value: transaction.value} : {}),
				...(transaction.data !== undefined ? {data: transaction.data} : {}),
				// INTENT ONLY. A raw relay has no signer question to answer: rocketh holds no signer
				//  for it and never asked for one, and labelling it `unsignable` would tell a fixture
				//  consumer to skip the one entry it MUST replay on every fresh node.
				signability: transaction.signability,
			};
		case 'raw':
			return {type: 'raw', from: transaction.from, raw: transaction.raw};
		default: {
			// Exhaustive over the two arms of `CapturedTransaction`: a third arm fails to compile
			//  here rather than being silently dropped from (or leaked whole into) the file. The
			//  runtime throw covers a JS caller violating the type contract. Mirrors the idiom at
			//  the broadcast choke point's signer switch.
			const exhaustive: never = transaction;
			throw new Error(`unhandled captured transaction type: ${(exhaustive as {type: string}).type}`);
		}
	}
}

/**
 * Write the list to the path the user named, ATOMICALLY: into a temp file in the SAME directory,
 * then renamed over the target.
 *
 * This is the FILE SINK over the list a run keeps in memory (`env.capturedTransactions`), and it
 * lives in `@rocketh/node` because this is the only runtime allowed to touch a filesystem:
 * `@rocketh/core` and `rocketh` stay browser-capable (ADR 0002). It is deliberately NOT routed
 * through the `DeploymentStore` either. That abstraction is keyed by a deployments folder and an
 * environment name, while this is a path the USER named, and the file is not a deployment
 * record. Nothing in rocketh ever reads it back to decide anything, which is what keeps it clear
 * of ADR 0012's warning about records that acquire authority.
 *
 * Same directory because a rename is only atomic within one filesystem; the temp name is a
 * dotfile so a consumer watching the directory does not pick it up as a batch. The consequence
 * worth naming: the write REPLACES the path (it does not open and append to it), so pointing it
 * at a FIFO is not a supported way to stream the run.
 *
 * The parent directory is created when missing, so `--write-transactions out/batch.json` is the
 * user's answer rather than an ENOENT after a rehearsal has already run.
 *
 * Called ONCE, only after the run has succeeded (see the executor), so there is no truncate at
 * start, no append as it goes, and no `complete` flag: a run that throws never reaches here and
 * leaves whatever was at the path byte for byte as it found it.
 */
export function writeCapturedTransactions(filepath: string, transactions: readonly CapturedTransaction[]): void {
	const target = path.resolve(filepath);
	const directory = path.dirname(target);
	fs.mkdirSync(directory, {recursive: true});

	const temporary = path.join(directory, `.${path.basename(target)}.${randomUUID()}.tmp`);
	try {
		fs.writeFileSync(temporary, serializeCapturedTransactions(transactions));
		fs.renameSync(temporary, target);
	} catch (err) {
		// A failed write must not leave the temp file behind next to the batch a consumer reads.
		fs.rmSync(temporary, {force: true});
		throw err;
	}
}
