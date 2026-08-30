import type {ExecutionParams} from '@rocketh/core/types';

/**
 * The run parameters `@rocketh/node` accepts: core's `ExecutionParams`, plus what only a
 * FILESYSTEM runtime can honour.
 *
 * The extra field lives here rather than on core's type because core and `rocketh` are
 * browser-capable and may not reach for the filesystem (ADR 0002), so an output PATH means
 * nothing to them: the whole of what this option does happens inside this package, after the
 * executor has returned the environment. Putting it in core would have widened a type every
 * package depends on for a field only one of them could ever read.
 *
 * It is deliberately NOT threaded through `resolveExecutionParams`: that function maps core's
 * run parameters to `ResolvedExecutionParams` field by field (no spread), so this one would have
 * to be added to both core types to survive the trip, and it has nothing to resolve.
 */
export type NodeExecutionParams<Extra extends Record<string, unknown> = Record<string, unknown>> =
	ExecutionParams<Extra> & {
		/**
		 * Where to write the transactions this run broadcast, or absent to write nothing at all.
		 *
		 * Set by `--write-transactions <file>`. The file is written ONCE, ATOMICALLY, at the end of
		 * a SUCCESSFUL run (see `writeCapturedTransactions`): a run that throws writes nothing and
		 * leaves any previous file untouched, because a partial batch is not a smaller truth but a
		 * misleading one.
		 */
		writeTransactions?: string;
	};
