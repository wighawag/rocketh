---
promotedFrom: observation:review-nits-unknown-signer-package-2026-08-09
---

## What to build

Add a short section (one line + a code snippet is enough) to `packages/rocketh-unknown-signer/README.md` telling consumers where `UnknownSignerError` lives, so a user who wants to do an `instanceof` check can discover it.

Background: Gate 2 review of `unknown-signer-package` ratified the decision to keep the package root export surface function-only (because `withEnvironment` calls every root entry as `value(env)` and would refuse a spread-in class by name) and to re-export `UnknownSignerError` from a dedicated `./errors` subpath (see `packages/rocketh-unknown-signer/package.json` `exports` map and `packages/rocketh-unknown-signer/src/errors.ts`). That decision is now pinned in `AGENTS.md` and `CONTEXT.md`. The remaining residue from the review is purely documentation: the README currently never mentions the subpath, so an `instanceof` consumer has no discoverable path to the class.

Scope:
- Edit `packages/rocketh-unknown-signer/README.md` only.
- Mention that `UnknownSignerError` is exported from `@rocketh/unknown-signer/errors` (NOT from the package root), briefly explain WHY the root is function-only (curried-extension contract enforced by `withEnvironment`), and show a minimal `import {UnknownSignerError} from '@rocketh/unknown-signer/errors'` + `instanceof` snippet.
- Do not change any source, exports, or tests. No changeset needed unless the repo convention requires one for README-only edits — check `.changeset/` neighbours before adding one.

Out of scope:
- The missing-Decisions-block commit-message pattern (handled by the repo-wide process observation).
- The tests-not-typechecked finding (handled by `observation:test-files-are-outside-pnpm-typecheck-2026-08-09`).
- Any code change to the errors module, the `catchUnknownSigner` showMessage channel, or the cross-realm look-alike rule — those were all ratified as-is.

## Acceptance

- `packages/rocketh-unknown-signer/README.md` contains a discoverable reference to the `./errors` subpath and shows an `instanceof UnknownSignerError` example.
- `pnpm format:check` passes.

## Prompt

> Add a short README section to `packages/rocketh-unknown-signer/README.md` documenting that `UnknownSignerError` is re-exported from the `@rocketh/unknown-signer/errors` subpath, not from the package root. Briefly explain the reason (the package root export surface must contain only curried `(env) => …` functions because `packages/rocketh-core/src/environment.ts` `withEnvironment` calls every root entry as `value(env)` and refuses a class by name — see `AGENTS.md` and `CONTEXT.md` for the pinned rule). Include a minimal code snippet showing `import {UnknownSignerError} from '@rocketh/unknown-signer/errors'` and an `instanceof` check inside a `catch`. Do NOT modify source, exports, tests, or any other package. Verify the subpath actually exists by reading `packages/rocketh-unknown-signer/package.json` `exports` and `packages/rocketh-unknown-signer/src/errors.ts` before writing the snippet. Run `pnpm format:check` (or `pnpm format` then re-check) before finishing. This is the sole live residue from the Gate 2 review of `unknown-signer-package`; all other findings from that review were ratified as-is or are tracked on other observations.