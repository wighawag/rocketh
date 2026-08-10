/**
 * Measures what `prompts` does when stdin is not a terminal. See
 * `prompts-non-tty-behaviour.md` next to this file for the recorded results.
 *
 * Run from a checkout with dependencies installed:
 *
 *   node docs/spikes/ask-policy-interactive-resolver/probe.mjs < /dev/null
 *   sleep 30 | node docs/spikes/ask-policy-interactive-resolver/probe.mjs
 *   (printf '0xabc\n'; sleep 5) | node docs/spikes/ask-policy-interactive-resolver/probe.mjs
 *
 * A case that prints neither RESOLVED nor REJECTED is one where the promise never
 * settles, which is the whole point: no `catch` can rescue such a run.
 */
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const prompts = (await import(require.resolve('prompts'))).default;

console.log('stdin.isTTY =', process.stdin.isTTY, '| stdout.isTTY =', process.stdout.isTTY);
const startedAt = Date.now();
try {
	const answer = await prompts({type: 'text', name: 'txHash', message: 'paste hash'});
	console.log('RESOLVED after', Date.now() - startedAt, 'ms with', JSON.stringify(answer));
} catch (err) {
	console.log('REJECTED after', Date.now() - startedAt, 'ms with', err && err.message);
}
console.log('script reached the end');
