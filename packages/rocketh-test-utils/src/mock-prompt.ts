/**
 * `createMockPromptExecutor` — a fake human, so an extension package can drive the
 * INTERACTIVE unknown-signer path (the `'ask'` policy) with no TTY.
 *
 * It is a PROMPT double, and nothing more. The environment stays the real one:
 * inject this through `createTestEnvironment`'s EXISTING run-parameter pass-through
 * (`executionParams.promptExecutor`), because the capability rides `ExecutionParams`
 * exactly as `autoImpersonate` does (ADR 0007). There is deliberately no harness
 * option for it, and this file fabricates no `Environment` and reimplements no
 * broadcast path — see the *test environment* vs *mock environment* entry in
 * `CONTEXT.md` for why that line matters here.
 *
 * DECISION — the CAPABILITY-ABSENT shape is `createMockPromptExecutor()` with no
 * `textAnswers`, which returns an executor with NO `promptText` method at all. This
 * mirrors the domain rule it exists to test: the ABSENCE of the method IS the
 * capability signal (`env.canPromptForText()` is pure method presence), so a fake
 * that has no answers scripted has nothing to answer WITH. The alternatives were a
 * second builder (`createConfirmOnlyPromptExecutor`, as `packages/rocketh`'s local
 * tests have) and a `canPromptForText` option — the first doubles a published
 * package's API surface for one line of behaviour, the second re-uses the name of
 * the environment predicate for a constructor knob, which is exactly the kind of
 * re-meaning that later reads as a second source of truth. A test that wants the
 * capability PRESENT but every ask to be a failure passes an empty script
 * (`{textAnswers: []}`), which is a present-but-exhausted prompt.
 */

import type {PromptExecutor, TextPromptAnswer, TextPromptRequest} from '@rocketh/core/types';

/** A confirm ask, as `PromptExecutor.prompt` receives it. */
export type MockConfirmPromptRequest = {type: 'confirm'; name: string; message: string};
/**
 * A free-text ask, as `PromptExecutor.promptText` receives it — the request type
 * ITSELF, so a field added to the abstraction is recorded here without this double
 * having to be widened again.
 *
 * It carries `initial`, the starting value the asker offered, which is how a test
 * proves a RE-ASK carried the previous answer over rather than asking from scratch:
 * `promptExecutor.textRequests[1].initial`. A real prompt would show it; this one only
 * records it, and answers from its script regardless — the script IS what the human
 * typed, and a human is free to ignore what they were offered.
 */
export type MockTextPromptRequest = TextPromptRequest;
export type MockPromptRequest = MockConfirmPromptRequest | MockTextPromptRequest;

/**
 * What a scripted answer to a TEXT prompt can be:
 *
 * - a `string` — answered verbatim as `{value}`. This is how BOTH canned answers are
 *   expressed: a transaction hash (`'0x…'`) continues the run, and `'cannot sign'`
 *   declines it. The double stays out of that vocabulary on purpose: what a given
 *   answer MEANS is the resolver's business, not the fake human's.
 * - a `TextPromptAnswer` — e.g. `{cancelled: true}` for a human who hit Ctrl-C.
 * - an `Error` — THROWN, standing in for a prompt with no terminal behind it.
 */
export type MockTextAnswer = string | TextPromptAnswer | Error;

export type CreateMockPromptExecutorOptions = {
	/**
	 * Answers for successive TEXT prompts, consumed in order.
	 *
	 * OMIT this (the whole options object, even) for the CAPABILITY-ABSENT shape: the
	 * returned executor then has no `promptText` method at all, which is what
	 * `@rocketh/web`'s confirm-only prompt and a non-TTY `@rocketh/node` run look like,
	 * and what makes `'ask'` degrade to `'throw'`.
	 */
	textAnswers?: MockTextAnswer[];
};

export type MockPromptExecutor = PromptExecutor & {
	/**
	 * Every request this prompt was asked, in order — confirm and text alike.
	 *
	 * An EMPTY array is the assertion that nobody was ever asked anything, which is a
	 * real requirement: `catchUnknownSigner` must defer WITHOUT consulting a prompt,
	 * and a run with no text capability must not reach for one either.
	 */
	readonly requests: MockPromptRequest[];
	/** The TEXT asks only (what the interactive unknown-signer resolver makes). */
	readonly textRequests: MockTextPromptRequest[];
	/** Whether `exit()` was called. */
	readonly exited: boolean;
};

/**
 * Build a fake prompt. See the module doc for how the capability-absent shape is
 * expressed and why.
 *
 * @example a canned hash — the run CONTINUES with the transaction executed out-of-band
 * ```typescript
 * const promptExecutor = createMockPromptExecutor({textAnswers: [PASTED_HASH]});
 * const {env} = await createTestEnvironment({
 *   accounts: {admin: SAFE_ADDRESS},
 *   executionParams: {autoImpersonate: false, onUnknownSigner: 'ask', promptExecutor},
 * });
 * ```
 *
 * @example "cannot sign" — the run DEFERS with `UnknownSignerError`
 * ```typescript
 * const promptExecutor = createMockPromptExecutor({textAnswers: ['cannot sign']});
 * ```
 *
 * @example no text ability at all — `'ask'` degrades to `'throw'`, nobody is asked
 * ```typescript
 * const promptExecutor = createMockPromptExecutor();
 * expect(promptExecutor.requests).toEqual([]);
 * ```
 */
export function createMockPromptExecutor(options: CreateMockPromptExecutorOptions = {}): MockPromptExecutor {
	const requests: MockPromptRequest[] = [];
	let exited = false;

	const executor: MockPromptExecutor = {
		requests,
		get textRequests() {
			return requests.filter((request): request is MockTextPromptRequest => request.type === 'text');
		},
		get exited() {
			return exited;
		},
		async prompt(request: MockConfirmPromptRequest) {
			requests.push(request);
			return {proceed: true};
		},
		exit() {
			exited = true;
		},
	};

	if (options.textAnswers) {
		// A script, so the answers a test cares about are the answers, in order. Copied,
		//  so a caller reusing one array across two executors does not have the first one
		//  eat the second one's answers.
		const answers = [...options.textAnswers];
		executor.promptText = async (request: MockTextPromptRequest) => {
			requests.push(request);
			const next = answers.shift();
			if (next === undefined) {
				// Loudly, rather than looping or inventing an answer. Note the interactive
				//  resolver TREATS a throwing prompt as "could not reach a human" and defers,
				//  so this surfaces in a test as an unexpected `UnknownSignerError`; assert on
				//  `textRequests` to see how many times it was actually asked.
				throw new Error(
					`mock prompt: asked for text ${requests.filter((r) => r.type === 'text').length} time(s) but only ` +
						`${options.textAnswers?.length ?? 0} answer(s) were scripted (last question: "${request.message}")`,
				);
			}
			if (next instanceof Error) {
				throw next;
			}
			return typeof next === 'string' ? {value: next} : next;
		};
	}

	return executor;
}
