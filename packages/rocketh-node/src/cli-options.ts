import {Command} from 'commander';
import type {ForkInput} from '@rocketh/core/types';

/**
 * The `rocketh` command's OPTION SURFACE, defined here rather than in `cli.ts` so that it can be
 * parsed by a test. `cli.ts` is a bin script: importing it runs a deployment, so nothing in it is
 * reachable from a test, and the flags it declares would otherwise be pinned by nothing.
 *
 * The version is a parameter because reading `package.json` is the bin script's business.
 */
export function buildCLIProgram(version: string): Command {
	const commandName = 'rocketh';
	return new Command()
		.name(commandName)
		.version(version)
		.usage(`${commandName}`)
		.description('execute deploy scripts and store the deployments')
		.option('-s, --scripts <value>', 'path the folder containing the deploy scripts to execute')
		.option('-t, --tags <value>', 'comma separated list of tags to execute')
		.option('-d, --deployments <value>', 'folder where deployments are saved')
		.option('--skip-gas-report', 'if set skip gas report')
		.option('--log-level <value>', 'set the log level')
		.option('--skip-prompts', 'if set skip any prompts (this also forces --on-unknown-signer throw)')
		.option(
			'--on-unknown-signer <value>',
			"what to do when a transaction's `from` cannot be signed for: throw | ask | auto (default: auto)",
		)
		.option('--save-deployments', 'if set, save deployments')
		.option('--reset', 'if set, delete all deployments first')
		.requiredOption('-e, --environment <value>', 'environment to use')
		.option(
			'--is-fork',
			// An ASSERTION about the node this run attaches to, which is what the user is telling us,
			//  and the description says so in that voice. The reserved name `--fork` reads as an
			//  IMPERATIVE, and rocketh forks nothing: it attaches to a node somebody else forked. See
			//  the naming section of ADR 0014, and `resolveEnvironmentInput` below.
			'the node being attached to is a fork of the environment named by -e (its deployments are read, and not written)',
		);
}

/**
 * What core is told the run is against: an environment NAME, or the `ForkInput` that says the
 * node is simulating that network.
 *
 * `-e mainnet --is-fork` carries everything a fork input needs, because a fork run's environment
 * name IS the forked network's name: it is the deployment folder the run reads, which is the
 * whole point of forking (ADR 0014). Nothing else is inferred here, and above all no `chainId`:
 * `@rocketh/node` does hold a name-to-chain map, but it is keyed by viem's kebab-cased chain name
 * (mainnet's key is `ethereum`), so a match against an environment name would be a coincidence.
 * The run instead asks the node itself, which on a fork is both possible and honest.
 *
 * This must be applied AFTER the raw options are spread into the execution parameters: the spread
 * carries commander's `environment`, which is always the string, and would overwrite a fork input
 * built before it. Same reason `onUnknownSigner` is fixed up after the spread.
 */
export function resolveEnvironmentInput(options: {environment?: unknown; isFork?: unknown}): string | ForkInput {
	const environment = options.environment as string;
	return options.isFork ? {fork: environment} : environment;
}
