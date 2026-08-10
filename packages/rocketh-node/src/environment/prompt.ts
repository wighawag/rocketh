import prompts from 'prompts';
import type {PromptExecutor} from '@rocketh/core/types';

/**
 * The Node runtime's way of asking a human something, and the only one in this repo
 * that reaches a real person: `@rocketh/web` deliberately ships no text ability,
 * because a browser cannot sensibly ask a user to paste a transaction hash (ADR 0007).
 *
 * Supplying this on a run is what gives `env.canPromptForText()` a true answer — the
 * capability the interactive unknown-signer resolver will need.
 */
export function createNodePromptExecutor(): PromptExecutor {
	return {
		async prompt(request: {type: 'confirm'; name: string; message: string}) {
			const answer = await prompts<string>(request);
			return {
				proceed: answer.proceed,
			};
		},
		async promptText(request: {type: 'text'; name: string; message: string}) {
			const answer = await prompts<string>(request);
			// `prompts` keys its answer object BY `request.name`, so read it by name. Reading a
			// fixed key here would make every prompt not named that silently answer `undefined`.
			const value = answer[request.name];
			if (typeof value !== 'string') {
				// The user aborted (Ctrl-C): `prompts` resolves with the key absent.
				return {cancelled: true};
			}
			return {value};
		},
		exit() {
			process.exit();
		},
	};
}
