---
title: review-gate non-blocking nits for 'unknown-signer-package' (Gate 2 approve)
date: 2026-08-09
status: open
reviewOf: unknown-signer-package
needsAnswers: true
---

## Non-blocking review findings

The PR/code review gate (Gate 2) APPROVED 'unknown-signer-package' but raised the
following non-blocking findings (nits). They do not block integration; this
is their durable home for triage — promote-to-task / keep / delete.

- Ratify: the task said src/index.ts should re-export UnknownSignerError, but the class is re-exported from a new ./errors subpath instead and the root stays function-only. The stated reason is verified correct (withEnvironment calls every root export as value(env), so a spread-in class would throw Class constructor cannot be invoked without new). Worth ratifying, and note the package README never mentions the subpath, so a consumer wanting an instanceof check will not discover it.
  (packages/rocketh-unknown-signer/src/errors.ts + package.json exports ./errors; packages/rocketh-core/src/environment.ts:39-60 (withEnvironment loops Object.entries and calls func(env)); README.md:244 shows the import \* as ... spread idiom. Captured as work/notes/observations/extension-package-root-must-export-only-curried-functions-2026-08-09.md.)
- Ratify a user-visible default: the deferred-transaction block is printed via env.showMessage (which is logger.log, so it is gated by the run log level) rather than v1's unconditional console.log. Under a quieter log level the user still gets the returned object but never sees the block telling them what to execute on the Safe. The choice is recorded in the module JSDoc but not in README.md, documentation.md or the changeset.
  (packages/rocketh-unknown-signer/src/index.ts catchUnknownSigner JSDoc (DECISION paragraph) and the env.showMessage call; packages/rocketh/src/environment/index.ts:1137 showMessage -> logger.log.)
- Ratify a new refusal: the cross-realm fallback only treats a by-name UnknownSignerError as ours if it also carries an object data with a from key; otherwise it rethrows. Sensible (a name-only look-alike would yield from: undefined), but it is an unspecified accept/reject rule the task did not name.
  (packages/rocketh-unknown-signer/src/index.ts isUnknownSignerError; tested at test/catchUnknownSigner.integration.test.ts (rethrows a look-alike error that carries no data).)
- The commit body is the one-line title only, with no Decisions block, so the three in-scope choices above (errors subpath, showMessage channel, look-alike rethrow rule) are discoverable only by reading JSDoc, the changeset and the notes. Same shape as the nits raised on the two preceding tasks in this chain, so it is a recurring pattern rather than a one-off.
  (git log -1 --format=%B HEAD; compare work/notes/ (review-gate nits for account-signability-classification and unknown-signer-broadcast-seam), which raise the identical missing-Decisions-block finding.)
- The acceptance criterion that a promise-form call does not COMPILE rests on a @ts-expect-error marker in a test file that no CI step type-checks (every package tsconfig includes src only, and the gate runs no typecheck over tests). The compile-time half was verified manually once. Worth deciding repo-wide whether tests get type-checked.
  (packages/rocketh-unknown-signer/tsconfig.json include: src/\*_/_.ts; root typecheck is pnpm -r exec tsc --noEmit; captured as work/notes/observations/test-files-are-outside-pnpm-typecheck-2026-08-09.md.)
