# Observation: concerns from the 2026-05-20 internal code review

Spotted, unverified concerns distilled from an internal code-review report (`reviews/20260520_1445.md`, dated 2026-05-20). These are signals about OUR code, not verified bugs and not external ground truth — each may or may not warrant action. Append `## Update` notes rather than rewriting. Line references were re-checked against the tree at migration time but may drift.

## Type safety — `as any` at typed boundaries

- `packages/rocketh-deploy/src/index.ts:325` — `encodeDeployData(argsToUse as any); // TODO any` (still present).
- `packages/rocketh-proxy/src/index.ts` — `args as any[]` casts around proxy execute/init args; `diamondConstructorArgs as any` in `rocketh-diamond/src/index.ts:441`.
- These bypass the ABI typing the project otherwise prides itself on. (Note: many other `as any` hits are in tests/utils and are lower-stakes.)

## Silent error handling — empty catch blocks

- `packages/rocketh/src/environment/index.ts:651` — `} catch (err) {}` (still present).
- `packages/rocketh-proxy/src/index.ts:477` — `} catch (err) {}` around an owner `_read` (still present).
- Swallowed errors can mask real failures. Either handle, or add a comment explaining why the error is intentionally ignored.

## Missing test coverage for `strictBytecodeMatch`

- A grep for `strictBytecodeMatch` across `*.test.ts` returned **no matches** at migration time — the recently-added feature appears to have no direct tests. Confirmed concern from the review.

## Magic values undocumented

- CBOR-length handling in `rocketh-deploy/src/index.ts` (parsing the trailing metadata length) uses bare numeric logic; the review flagged it should be a named constant with explanation.
- Proxy storage-slot constants (ERC1967 implementation/admin slots) appear as bare hex literals in `rocketh-proxy/src/index.ts`; review suggested named constants.

## Possible code duplication

- Bytecode-matching logic appears across deploy/proxy/diamond; the review suggested extracting shared logic to `@rocketh/core`. (Unverified — needs a real look before acting.)

## Docs drift

- `documentation.md` was flagged as referencing an older `rocketh.ts` pattern where the current convention is `rocketh/config.ts`; `strictBytecodeMatch` is undocumented. (Cross-check: the README/getting-started already uses `rocketh/config.ts`.)

## Provenance / caveats

- Source: `reviews/20260520_1445.md` (an LLM-generated review). Treat as a checklist of LEADS, not a verified defect list — the review itself noted the integration-test mock always reports `newlyDeployed: true`, limiting what its tests prove.
- Each concrete item, if pursued, should become its own slice (e.g. "add strictBytecodeMatch tests", "remove silent catches in environment/proxy") rather than one mega-task.
