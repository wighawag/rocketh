/**
 * `@rocketh/playground` — run a real rocketh deploy script against a real EVM, in a browser.
 *
 * This entry point is FRAMEWORK-FREE on purpose: no DOM, no Svelte, no Vue. It runs under node
 * unchanged, which is what makes the deploy pipeline testable headlessly instead of only
 * behind a browser runner. The UI lives on the `@rocketh/playground/element` subpath and is a
 * consumer of this, never the other way round.
 */
export {createPlaygroundChain} from './core/chain.js';
export type {CreateChainOptions, PlaygroundChain} from './core/chain.js';
export {captureConsole} from './core/console-capture.js';
export type {CaptureConsoleOptions, ConsoleCapture} from './core/console-capture.js';
export {createLogStream, formatConsoleArguments} from './core/log-stream.js';
export type {LogChange, LogEntry, LogListener, LogSource, LogStream} from './core/log-stream.js';
export {buildUserConfig, createPlayground} from './core/playground.js';
export type {
	Playground,
	PlaygroundAccounts,
	PlaygroundDefinition,
	PlaygroundDeployment,
	PlaygroundExtensions,
	PlaygroundRunResult,
} from './core/playground.js';

export {greetingsRegistryPlayground} from './fixture/greetings-registry-playground.js';
export {GreetingsRegistry} from './fixture/greetings-registry.artifact.js';
