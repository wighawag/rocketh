import prompts from 'prompts';
import type {PromptExecutor} from '@rocketh/core/types';

/**
 * The Node runtime's way of asking a human something, and the only one in this repo
 * that reaches a real person: `@rocketh/web` deliberately ships no text ability,
 * because a browser cannot sensibly ask a user to paste a transaction hash (ADR 0007).
 *
 * Supplying this on a run is what gives `env.canPromptForText()` a true answer — the
 * capability the interactive unknown-signer resolver needs.
 *
 * THE TEXT ABILITY IS ONLY SUPPLIED WHEN STDIN IS A TTY, and that gate lives HERE, in
 * the runtime, rather than inside `canPromptForText()`, which stays pure method
 * presence (ADR 0007). A runtime knows whether IT can reach a human; the capability
 * check only asks whether the ability was supplied. Where stdin is not a terminal the
 * ability is simply absent, so the policy falls through the same degrade path a
 * capability-less runtime takes and a CI run throws instead of prompting.
 *
 * The gate is not defensive tidiness: `prompts@2.4.2` against a non-TTY stdin NEVER
 * SETTLES. Measured in `docs/spikes/ask-policy-interactive-resolver/prompts-non-tty-behaviour.md`,
 * `stdin` from `/dev/null` leaves the promise for ever pending (node then exits when
 * the event loop drains, with no error and no output), and an open pipe with no data
 * hangs indefinitely. It never rejects, so a `try`/`catch` around the call cannot save
 * such a run: only not asking can.
 */
export function createNodePromptExecutor(options?: {
	/**
	 * Can this process reach a human on its stdin? Injectable ONLY so a test can drive
	 * both sides of the gate; production always reads the real stdin.
	 */
	isStdinInteractive?: () => boolean;
}): PromptExecutor {
	const isStdinInteractive = options?.isStdinInteractive ?? (() => process.stdin.isTTY === true);

	const executor: PromptExecutor = {
		async prompt(request: {type: 'confirm'; name: string; message: string}) {
			const answer = await prompts<string>(request);
			return {
				proceed: answer.proceed,
			};
		},
		exit() {
			process.exit();
		},
	};

	if (isStdinInteractive()) {
		executor.promptText = async (request: {type: 'text'; name: string; message: string}) => {
			const answer = await prompts<string>(request);
			// `prompts` keys its answer object BY `request.name`, so read it by name. Reading a
			// fixed key here would make every prompt not named that silently answer `undefined`.
			const value = answer[request.name];
			if (typeof value !== 'string') {
				// The user aborted (Ctrl-C): `prompts` resolves with the key absent.
				return {cancelled: true};
			}
			// An EMPTY string is a VALUE, not a cancellation: this is a generic text primitive and
			// only the caller knows what its prompt can accept, so the caller validates (a resolver
			// asking for a transaction hash rejects `''` itself). See `TextPromptAnswer`.
			return {value};
		};
	}

	return executor;
}
