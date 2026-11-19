/**
 * `@rocketh/playground/log`: the log plumbing alone, WITHOUT rocketh.
 *
 * WHY a subpath: a host that wants rocketh's own transcript must install `createLogFactory`'s
 * factory BEFORE any rocketh module is evaluated (see `core/log-factory.ts`). The root entry
 * re-exports `createPlayground`, which imports rocketh, so importing the helper from the root
 * would load rocketh first and defeat the point: ES modules evaluate a module's imports before
 * its body. Nothing reachable from this entry imports rocketh, viem or webevm.
 */
export {captureConsole} from './core/console-capture.js';
export type {CaptureConsoleOptions, ConsoleCapture} from './core/console-capture.js';
export {createLogFactory} from './core/log-factory.js';
export type {CreateLogFactoryOptions, LogFactoryTarget, NamedLogsFactory, NamedLogsLogger} from './core/log-factory.js';
export {createLogStream, formatConsoleArguments} from './core/log-stream.js';
export type {LogChange, LogEntry, LogListener, LogSource, LogStream} from './core/log-stream.js';
