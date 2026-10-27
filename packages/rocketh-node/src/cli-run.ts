import {UnresolvableAccountsError} from 'rocketh';

/** Where the bin script reports a failure. A parameter, so a test can capture both. */
export type CLIReporter = {
	error(message: string): void;
	exit(code: number): void;
};

const processReporter: CLIReporter = {
	error: (message) => console.error(message),
	exit: (code) => process.exit(code),
};

/**
 * Run the deployment the `rocketh` bin script was asked for, reporting a CONFIGURATION mistake the
 * way a bad flag is reported: its message on stderr and a non-zero exit, with no stack trace. A
 * stack trace says "rocketh crashed", which sends the user looking for a bug that is not there.
 *
 * Only errors that are known to be configuration mistakes are reported this way, today the named
 * accounts that cannot be resolved (`UnresolvableAccountsError`, whose default message already
 * gives the fix for this entry point: the `accounts` of `rocketh/config.ts`). Anything else is
 * rethrown untouched, so a genuine bug keeps its stack.
 */
export async function runFromCLI(run: () => Promise<unknown>, reporter: CLIReporter = processReporter): Promise<void> {
	try {
		await run();
	} catch (err) {
		if (err instanceof UnresolvableAccountsError) {
			reporter.error(err.message);
			reporter.exit(1);
			return;
		}
		throw err;
	}
}
