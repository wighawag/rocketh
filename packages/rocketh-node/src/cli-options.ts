import {Command} from 'commander';
import type {ExecutionParams, ForkInput, UnknownSignerPolicy} from '@rocketh/core/types';

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
 * What commander PARSES the option surface above into: one key per declared flag, in commander's
 * own shapes. A value-taking option is a `string` (commander does no conversion), a boolean flag
 * is `true` when given and ABSENT otherwise, and `environment` is required so it is always there.
 *
 * This type is the whole point of `toExecutionParams` below. It is deliberately NOT core's
 * `ExecutionParams`: the two differ, they differ per option, and asserting one to be the other is
 * what let `--tags` ship broken from `e2dbd6f7` until it was noticed (see `toExecutionParams`).
 * Declaring the parsed shape honestly is what turns the difference into something the compiler
 * can see.
 *
 * Keep it in step with `buildCLIProgram`: `packages/rocketh-node/test/cli-tags.test.ts` asserts
 * the declared options and these keys are the same set, so a flag added without a key here (the
 * step at which its core shape gets thought about at all) goes red rather than silently never
 * reaching core.
 */
export type RockethCLIOptions = {
	scripts?: string;
	tags?: string;
	deployments?: string;
	skipGasReport?: boolean;
	/** Read by the bin script to configure the logger; core has no home for it. */
	logLevel?: string;
	skipPrompts?: boolean;
	onUnknownSigner?: string;
	saveDeployments?: boolean;
	reset?: boolean;
	environment: string;
	isFork?: boolean;
};

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
 */
export function resolveEnvironmentInput(
	options: Pick<RockethCLIOptions, 'environment' | 'isFork'>,
): string | ForkInput {
	return options.isFork ? {fork: options.environment} : options.environment;
}

const UNKNOWN_SIGNER_POLICIES: readonly UnknownSignerPolicy[] = ['throw', 'ask', 'auto'];

function isUnknownSignerPolicy(value: string): value is UnknownSignerPolicy {
	return (UNKNOWN_SIGNER_POLICIES as readonly string[]).includes(value);
}

/**
 * The run-level policy for an `unsignable` `from`, or `undefined` to leave it to config (chain,
 * then top-level). Commander hands over whatever the user typed, so the value is validated here
 * rather than passed on raw.
 *
 * `--skip-prompts` says "skip any prompts", and the interactive unknown-signer resolver IS a
 * prompt, so it must force `throw` rather than only silencing the reset/gas-price confirmations.
 * It wins over an explicit value: asking to be prompted AND not prompted is a contradiction, and
 * the safe half is not prompting.
 *
 * Throwing is how the refusal LEAVES this module: it is the bin script that owns talking to a
 * terminal, so `cli.ts` turns this into the same message on stderr and the same exit code it
 * always printed. Exiting from here instead would make the option surface untestable.
 */
export function resolveUnknownSignerPolicy(
	options: Pick<RockethCLIOptions, 'skipPrompts' | 'onUnknownSigner'>,
): UnknownSignerPolicy | undefined {
	if (options.skipPrompts) {
		return 'throw';
	}
	const value = options.onUnknownSigner;
	if (value === undefined) {
		// leave it unset so config (chain, then top-level) still decides
		return undefined;
	}
	if (!isUnknownSignerPolicy(value)) {
		throw new Error(
			`invalid --on-unknown-signer value: ${JSON.stringify(value)}. Expected one of: ${UNKNOWN_SIGNER_POLICIES.join(', ')}.`,
		);
	}
	return value;
}

/**
 * The tags to select scripts by, as core's contract states them: a LIST, or `undefined` for no
 * filter at all.
 *
 * The option is documented as "comma separated", and a script tag containing a comma is refused
 * by an explicit throw in the executor's selection loop, so splitting on `,` is unambiguous.
 *
 * The empty string is guarded FIRST, and that guard is not cosmetic: splitting `''` yields
 * `['']`, which is a non-empty list, so the filter ENGAGES and matches nothing — a run that
 * silently does no work. `--tags ''` means the same as not passing the flag. hardhat-deploy
 * guards it identically (`args.tags && args.tags != '' ? args.tags : undefined`).
 *
 * Segments are NOT trimmed, matching hardhat-deploy: a tag is whatever the user typed between
 * commas, and quietly editing it would be a second way for the flag to mean something other than
 * it says.
 */
export function parseTags(value: string | undefined): string[] | undefined {
	if (value === undefined || value === '') {
		return undefined;
	}
	return value.split(',');
}

/**
 * The CLI's BOUNDARY: commander's parsed options in, core's `ExecutionParams` out, one explicit
 * entry per option.
 *
 * It is explicit because the alternative was tried and failed three times. `cli.ts` used to hand
 * core `...(options as ExecutionParams)` and then hand-write a fix-up for each option whose CLI
 * shape did not match its core shape. A cast tells the compiler to stop checking, so `--tags`
 * (a `string` reaching a `string[]` field) type-checked and shipped: the selection loop iterated
 * the value's CHARACTERS, which meant `--tags Token` selected nothing and `--tags cat` selected a
 * script tagged `a`. `--scripts` and `--deployments` were the other half of the same hole: they
 * belong in `ConfigOverrides`, not on the run parameters, so the spread left them as excess
 * properties nothing reads. `onUnknownSigner` and `environment` needed the same kind of fix-up
 * and got it only because a human noticed.
 *
 * With the mapping written out, an option whose CLI shape differs from its core shape is a BUILD
 * error at the one place that has to think about the difference. The order-sensitivity that came
 * with the spread (a transform written before it was silently overwritten) is gone with it.
 *
 * Throws when an option's VALUE is not one core accepts; see `resolveUnknownSignerPolicy`.
 */
export function toExecutionParams(options: RockethCLIOptions): ExecutionParams {
	return {
		environment: resolveEnvironmentInput(options),
		tags: parseTags(options.tags),
		askBeforeProceeding: options.skipPrompts ? false : true,
		reportGasUse: options.skipGasReport ? false : true,
		// set-only flag: absent must stay `undefined` so core's own default still decides (which is
		//  what keeps a fork run from writing into the forked network's records)
		saveDeployments: options.saveDeployments,
		reset: options.reset ? true : false,
		onUnknownSigner: resolveUnknownSignerPolicy(options),
		// Folders are CONFIG in core, not run parameters, and the sibling CLIs (`@rocketh/export`,
		//  `@rocketh/doc`, `@rocketh/verifier`) already route `--deployments` through the same
		//  `ConfigOverrides`. An entry left `undefined` overrides nothing (`resolveConfig` skips it),
		//  so the config file keeps answering when the flag is absent.
		config: {
			scripts: options.scripts,
			deployments: options.deployments,
		},
	};
}
