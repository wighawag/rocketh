---
title: 'Migration guide: v1 named-owner accounts and proxy options → rocketh + @rocketh/proxy'
slug: v1-migration-guide-accounts-and-proxy-options
spec: unknown-signer-v1-migration
blockedBy: []
covers: [4, 5, 6]
---

## What to build

A migration guide, user-facing, that translates the two things a v1 team must translate to move to rocketh + `@rocketh/unknown-signer` + `@rocketh/proxy`:

1. **Named owner accounts.** v1's `namedAccounts` supports named entries for owners (`deployer`, `proxyOwner`, `safeOwner`, ...). Show the mapping to rocketh's named accounts (`accounts:` in the rocketh config, per-network overrides, address vs index vs external-signer forms). Point out which v1 config entries move as-is and which change SHAPE (the ones that do), with concrete before/after config snippets.
2. **Proxy options.** v1's proxy helper takes `{owner, methodName, execute: {methodName, args}, upgradeFunction, ...}`. Show the mapping to `@rocketh/proxy`'s options (`owner`, `execute` / `onUpgrade`, upgrade-method naming). Cover an upgrade script end-to-end so a migrating team can translate one without reading either package's source.

Plus THREE things the guide must say clearly, because each one is currently learned the expensive way:

- **The thunk divergence, prominently.** State that `catchUnknownSigner(execute(...))` becomes `catchUnknownSigner(() => execute(...))`, why (the promise has already started; there is no moment left to push the policy frame), and what happens if you forget (a loud runtime error naming the fix).
- **"Wrapping a call means accepting that the step did not happen."** Bluntly. Anything later in the same script that depends on the wrapped step must be gated on chain state, or must not be there. rocketh unwinds the wrapped ACTION, so `deployViaProxy`'s own post-upgrade `execute` / `onUpgrade` step is safe automatically, but the wrapper cannot protect the AUTHOR's next statement. (This is true of v1 too; it has simply never been written down.)
- **Nothing is persisted.** Idempotency comes from on-chain state alone. No unsigned-transactions file, no deployment-record mutation. Re-running the idempotent script after executing on the Safe is the flow, exactly as in v1.

The guide lives in TWO places (per the spec's decision — the migration guide belongs with the package and in the site docs, not in a `work/` note):

- **Package README** — `packages/rocketh-unknown-signer/README.md`: a "Migrating from hardhat-deploy v1" section (or standalone doc under the package) covering all of the above with runnable-looking snippets. Existing README already has the thunk-divergence section; fold the migration guide into a clear structure.
- **Site docs** — `documentation.md` (rendered by VitePress; the site's main doc): a corresponding migration section, or a link out to the README if the README is where the canonical version lives. Follow the site's existing structure. If a dedicated page in `.vitepress`'s navigation is warranted, add it and wire it in.

Do NOT invent new behaviour or new options — this is DOCUMENTATION of what is already true, pinned separately by the parity tests.

## Acceptance criteria

- [ ] `packages/rocketh-unknown-signer/README.md` has a "Migrating from hardhat-deploy v1" section (or clearly named subsections) covering: named-account mapping (with before/after snippets), proxy-option mapping (with before/after snippets), the thunk divergence (with the loud-error fix), the "wrapping means the step did not happen" statement, and the "nothing is persisted" restatement.
- [ ] `documentation.md` has an equivalent migration section (or a first-class link to the README canonical version) discoverable from the `@rocketh/unknown-signer` and `@rocketh/proxy` docs entries.
- [ ] Every code snippet in the guide is CORRECT against the current APIs (verify against `@rocketh/proxy`'s current option surface and `@rocketh/unknown-signer`'s exports; do not paste snippets that reference removed / renamed options).
- [ ] `pnpm docs:build` still succeeds if any VitePress markdown / nav config was touched.
- [ ] `pnpm format:check` passes on the edited docs.

## Blocked by

- None — can start immediately.

## Prompt

> Goal: write the migration guide a hardhat-deploy v1 team reads BEFORE porting their scripts. Purpose is mechanical translation: the team should be able to translate an upgrade script without reading either package's source, and without stepping on the three land mines (the thunk divergence, "the step did not happen", "nothing is persisted").
>
> FIRST, check this task against current reality. The spec `work/specs/tasked/unknown-signer-v1-migration.md` is the framing but do NOT trust its detail beyond the framing — read the actual APIs. Confirm: (a) `@rocketh/proxy`'s current options bag (open `packages/rocketh-proxy/src/index.ts` and any `types.ts` there); (b) the current rocketh named-accounts config shape (open `packages/rocketh/src/` and the rocketh config typedefs; see `documentation.md` for how the site presents them); (c) `@rocketh/unknown-signer`'s current README (`packages/rocketh-unknown-signer/README.md`) — the thunk section already exists, extend / restructure rather than duplicate.
>
> Vocabulary: "v1" = hardhat-deploy v1. Its equivalents in this repo's docs: see `hardhat-deploy/` (the vendored v1 site), specifically the how-to-deploy-contracts and namedAccounts pages, and `demoes/hardhat-deploy/proxies/` for a v1 script example.
>
> Where to look: `packages/rocketh-unknown-signer/{README.md,src/index.ts}`, `packages/rocketh-proxy/`, `packages/rocketh/`, `documentation.md`, `.vitepress/config.mts` (only if you need to wire a new page), `hardhat-deploy/` (for the v1 side of the mapping), `demoes/hardhat-deploy/proxies/` (for a real v1 script shape).
>
> Seams to describe: the config `accounts:` / `namedAccounts` boundary (what a user writes and how rocketh reads it), the `@rocketh/proxy` options bag (what `owner`, `execute`, `onUpgrade` mean now), and the `catchUnknownSigner` wrapper (thunk, return shape, no persistence).
>
> Done means: a v1 user can read the guide once and produce a compiling, correctly-behaving rocketh port of their upgrade script from it alone. Snippets compile-shaped against the CURRENT APIs. The three land mines are explicit and unmissable, not buried. `pnpm docs:build` passes.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report (e.g. whether the canonical migration guide lives in the README with a site-docs pointer, or vice versa; whether you added a new VitePress page; anything you had to choose because the mapping was not 1:1).
