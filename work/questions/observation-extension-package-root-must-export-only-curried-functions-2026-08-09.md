<!-- dorfl-sidecar: item=observation:extension-package-root-must-export-only-curried-functions-2026-08-09 type=observation slug=extension-package-root-must-export-only-curried-functions-2026-08-09 allAnswered=false -->

Item: [`observation:extension-package-root-must-export-only-curried-functions-2026-08-09`](../notes/observations/extension-package-root-must-export-only-curried-functions-2026-08-09.md)

## Q1

**Should the fix be documentation-only (a sentence in AGENTS.md/CONTEXT.md and withEnvironment's JSDoc), a code guard in withEnvironment (skip non-function entries, or throw naming the offending key), or both?**

> The observation itself lists these as possible follow-ups without choosing: 'a sentence in AGENTS.md/CONTEXT.md, and/or making withEnvironment skip non-function entries (or throw a message naming the offending key) instead of blindly calling them.' The two paths have different costs — docs alone leaves the failure at deploy-script run time; a throw shifts detection to first extension-load but is a runtime change to rocketh-core (packages/rocketh-core/src/environment.ts:56-70).

_Suggested default: Both: add the constraint to AGENTS.md/CONTEXT.md and withEnvironment's JSDoc, and make withEnvironment throw a named-key error on a non-function root export (fail-fast beats silent self-returning getters)._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
