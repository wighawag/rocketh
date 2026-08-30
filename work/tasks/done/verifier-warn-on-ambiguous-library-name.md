---
title: 'Warn when a library name resolves ambiguously during verification, instead of silently taking the first hit'
slug: verifier-warn-on-ambiguous-library-name
blockedBy: []
covers: []
---

## What to build

When `@rocketh/verifier` cannot resolve a linked library's defining source from the compiler's `linkReferences`, it falls back to SCANNING the compilation metadata's `sources` map — first for an AST `ContractDefinition` with `contractKind: 'library'`, then, failing that, for a `library <Name>` declaration in the raw source text. Both passes return on the FIRST match.

If two sources in one compilation declare a library with the same name, the first hit wins arbitrarily, and nothing tells anyone it happened. Etherscan keys `settings.libraries` by the source file that DEFINES each library, so picking the wrong file produces a verification request that names a real library at the wrong path. The user sees a verification failure with no hint that an ambiguity was the cause, or — worse — a verification that succeeds against the wrong source mapping.

Make the ambiguity VISIBLE. When the fallback scan finds more than one candidate source for a library name, emit a warning naming the library and EVERY candidate path, and say which one was chosen. Keep taking the first hit: this task is about making a silent guess into a loud one, not about changing which candidate wins.

Two things to get right:

The warning must not fire on the common case. The `linkReferences` path is authoritative and involves no guessing, so a deployment that resolves there must stay silent. Likewise a scan that finds exactly one candidate is unambiguous and must stay silent. Only a genuine multi-candidate scan warns.

Do not let the AST pass and the regex pass disagree silently either. The regex fallback can match `library <Name>` inside a COMMENT or a string literal, which is a second, different way to pick a wrong source. If the regex pass is what produced a multi-candidate result, say so in the warning, because the fix a user reaches for differs (a stray mention in a comment is not the same problem as two real libraries sharing a name).

Whether to go further and prefer a `compilationTarget`-anchored resolution is explicitly OUT OF SCOPE here and should stay a separate decision; this task only stops the guess being invisible.

## Acceptance criteria

- [ ] A fallback scan that finds two or more sources declaring the same library name emits a warning naming the library, all candidate paths, and the chosen one.
- [ ] The chosen candidate is unchanged (still the first hit), so no existing verification changes behaviour.
- [ ] A deployment resolved through `linkReferences` emits NO warning.
- [ ] A fallback scan with exactly one candidate emits NO warning.
- [ ] The warning distinguishes an AST-pass ambiguity from a regex-pass ambiguity, since a regex hit may be a comment or string literal rather than a real declaration.
- [ ] Tests cover: the unambiguous AST case (silent), the two-real-libraries case (warns, names both), the regex-fallback ambiguity (warns, says it came from the text scan), and the `linkReferences` case (silent). Mirror the existing test style in this package.
- [ ] No change to what gets sent to Etherscan for any currently-working verification.

## Blocked by

- None — can start immediately.

## Prompt

Make an ambiguous library-name resolution VISIBLE during contract verification in `@rocketh/verifier`, instead of a silent arbitrary pick.

FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): confirm the fallback scan still returns on first match and that no warning already exists. If the resolution order has changed, do NOT build on the stale premise — route to needs-attention with the discrepancy as the reason.

Background. Etherscan's `settings.libraries` block is keyed by the source file that DEFINES each library, not by the consuming contract's file, so verification of a contract with linked libraries needs each library's defining source path. `@rocketh/verifier` resolves that in two ways, in `packages/rocketh-verifier/src/library-source.ts`. The authoritative one reads the compiler's `linkReferences` map, where the source path IS the map key, so no guessing is involved. The fallback, used when no usable `linkReferences` is on the deployment, SCANS the metadata `sources` map: first for an AST `ContractDefinition` node with `contractKind: 'library'` and a matching `name`, then for a `library <Name>` match over the raw `content`. Both passes return the first match they find.

The defect is not that first-hit-wins is wrong — it is that it is INVISIBLE. Two sources in one compilation can declare a library of the same name (test fixtures, forked or vendored dependency trees), and the regex pass can additionally match a mention inside a comment or a string literal. Either way the caller gets a confident answer with no indication a choice was made, and a wrong choice surfaces later as an opaque verification failure.

Build the warning, not a new resolution strategy. Collect ALL candidates in the fallback scan rather than returning on the first, keep returning the first as the chosen one, and when there is more than one, warn with the library name, every candidate path, and which was chosen. Say whether the ambiguity came from the AST pass or the text pass — a user fixes those differently. Use the package's existing logging (`named-logs`, as the rest of the repo does) rather than `console`.

Keep the quiet path quiet. `linkReferences` resolution and a single-candidate scan must emit nothing; a warning on every verification would train people to ignore it.

Test at the seam: `findLibrarySourcePath` and its `linkReferences` sibling are exported and take plain data (a library name and a metadata `sources` map), so these are direct unit tests with hand-built fixtures — no chain, no harness needed. Cover the unambiguous AST case, two real libraries sharing a name, a regex hit inside a comment, and the `linkReferences` path.

Explicitly out of scope: preferring a `compilationTarget`-anchored resolution, changing which candidate wins, and hardening the regex to skip comments. Those are separate decisions; this task only stops the guess being silent. If you find yourself changing which source is chosen, stop and route to needs-attention.

RECORD non-obvious in-scope decisions in a `## Decisions` block in your final report, per the work contract — in particular the warning's wording and channel, and anything you discover about how often the fallback path is actually reached.

---

### Claiming this task

```sh
# atomically claim it (works with a GitHub remote OR a local --bare remote):
dorfl claim <slug> --arbiter <remote>      # default --arbiter origin
# then start work on the updated main:
git fetch <remote> && git switch -c work/<slug> <remote>/main
# on completion, in the work branch's PR/merge:
git mv work/tasks/ready/<slug>.md work/tasks/done/<slug>.md
```

## Decisions

- **Warning channel: `console.warn`, not `named-logs`.** The task prompt says to use `named-logs` "as the rest of the repo does", but that premise does not hold for this package or this message. `@rocketh/verifier` has no `named-logs` dependency and no logger (its existing output is `console.log` + chalk), and more importantly `docs/adr/0009-user-facing-notices-stay-on-console.md` already settles this class of message: `logs()` returns a permanent no-op unless a factory was hooked FIRST, and only `packages/rocketh-node/src/cli.ts` and `hardhat-deploy` do that. The verifier's own bin (`packages/rocketh-verifier/src/cli.ts`) does not, so routing this through `named-logs` would delete, for the primary way this code runs, exactly the message the task exists to surface. It would also make the notice suppressible by `--log-level error`, which ADR 0009 explicitly rejects for user-facing notices. Alternatives considered and rejected: adding `named-logs` + `hookup()` to the verifier CLI (a user-visible logging-default change for the whole `rocketh-verify` command, far outside this task), and reusing `etherscan.ts`'s `logInfo` (chalk-yellow on stdout, but that helper is private to `etherscan.ts` and this is a stderr-worthy notice per ADR 0009). Touches: nothing else; `library-source.ts` stays dependency-free. A JSDoc at the `chooseFirst` site records the same rationale and cites ADR 0009. No new ADR: this applies an existing one rather than deciding something new.
- **Wording and shape: one `console.warn` per ambiguous resolution, prefixed `[@rocketh/verifier]`.** Format: `ambiguous library "<Name>": <n> candidate sources in the compilation metadata (<origin>): <paths…>. Using the first one: <chosen>. Etherscan keys settings.libraries by the source file that DEFINES the library, so verification will fail if that is the wrong one; a deployment carrying compiler linkReferences resolves this without guessing.` The `<origin>` clause is what distinguishes the passes: AST = "each declares it in its AST, so these are real duplicate declarations"; text = "these come from the raw-source text scan, so a match may be a mention inside a comment or a string literal rather than a declaration". The package prefix is needed because this module has no logger namespace to carry it. I deliberately did NOT de-duplicate repeated warnings across deployments (the etherscan loop calls the resolver once per linked library per deployment, so a repo-wide ambiguity can warn several times in one run): dedup requires module-level state and would suppress the per-contract context, and it is not in the acceptance criteria.
- **No new exported surface.** The candidate collectors stay module-private; `findLibrarySourcePath` / `findLibrarySourcePathFromLinkReferences` remain the only exports, and the tests drive the warning through `findLibrarySourcePath` exactly as the task's "test at the seam" instruction describes. Exporting a `findLibrarySourceCandidates` would have been a new public API on a package export surface for no acceptance-criterion gain.
- **How often the fallback is actually reached (asked for in the prompt, verified not assumed).** `packages/rocketh-deploy/src/index.ts:588` spreads the whole artifact (`...artifactToUse`) into the saved deployment, so `deployment.linkReferences` is present exactly when the user's compiler artifact carried it. The authoritative path therefore covers artifacts whose toolchain emits a populated top-level `linkReferences`. The scan is still reached in two live situations, not just "old artifacts": an artifact with an EMPTY `linkReferences: {}` (`findLibrarySourcePathFromLinkReferences` correctly returns `undefined` for it, and the repo's own fixtures at `packages/rocketh-test-utils/src/index.ts:235` and the playground artifacts are shaped that way), and libraries linked by raw name via `linkRawLibraries` when no link references exist. So the warning is not dead code, but it is bounded to contracts that both link libraries and lack usable link references. I did not change any of that; it is out of scope.
