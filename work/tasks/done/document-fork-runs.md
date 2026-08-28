---
title: 'Document what a fork run is, what it inherits, and the two things it deliberately does not do'
slug: document-fork-runs
spec: fork-of-a-named-network
blockedBy: [fork-config-sub-key-on-the-environment]
covers: []
---

## What to build

The user-facing documentation for fork runs, which do not appear in the documentation site at all today despite being how a whole class of users already deploys.

**The page covers:**

- What a fork run IS, in the one sentence that explains every behaviour that follows: it is the forked network for the purposes of deployment RECORDS, and is not that network for the purposes of chain identity. Everything else is downstream of that.
- How to run one, and that the connection goes to a node the user already started (anvil or a hardhat node), on the conventional local port unless configured otherwise.
- What is INHERITED, and the CONDITION on it: a fork of mainnet is configured like mainnet, including the deterministic-deployment settings, the unknown-signer policy, confirmations, mining and the TAGS that deploy scripts branch on. This works without any configuration when the node reports the forked chain's own id, which anvil does. It does NOT work on a hardhat node, which reports 31337 while simulating mainnet, so there the settings fall back to whatever is configured for 31337 unless the user declares the forked network's chain id. Say this plainly with the one-line remedy: a page that promises inheritance unconditionally would be telling exactly the wrong audience the wrong thing.
- How to state what differs, with the `whenForked` key on the network's own environment entry, and the layering order.

> FORWARD-POINTER (planted by the conductor before this task was built): this task was written when the configuration key was spelled `fork`. It is shipped as **`whenForked`**, renamed deliberately in `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md` because `fork` reads as an imperative and invites the mode-switch misreading this page has to argue against. Document the key as `whenForked`, and confirm the spelling against the shipped type rather than against this task body.

- That impersonation is on by default for a fork, why (the Safe-owned steps execute, which is the point of rehearsing), and how to turn it off to exercise the deferral path instead.
- That declaring fork configuration does not fork anything by itself.

**Two non-goals that must be stated rather than left to be discovered:**

1. **Saving is unchanged, and a fork run can still write into the forked network's deployment folder.** The hardhat plugin suppresses it, so hardhat users are safe today, but the rule lives in that caller rather than in core. Anyone driving core directly should know. This is deliberately not fixed yet.
2. **There is no `--is-fork` flag on the CLI yet.** A fork is reachable through the hardhat plugin's environment variable, or by constructing the fork input programmatically. Name it `--is-fork` when referring to the planned flag, never `--fork`: the imperative is reserved for a future in-process engine that can actually create a fork (ADR 0014).

**Also worth a short section**, because it is the question every reader will arrive with: which chain id things use. Configuration and records follow the network being simulated; transactions follow the node, because a signed transaction's chain id must be one the node accepts. anvil and hardhat genuinely differ here and both are fine.

Repo rules apply to prose: no em dashes, and no hard wrapping inside a paragraph.

## Acceptance criteria

- [ ] A documentation page covers what a fork run is, how to run one, what is inherited, and how to override it
- [ ] The `whenForked` configuration key is documented with its layering order and a worked example
- [ ] The impersonation default is documented, with how to turn it off and why you would
- [ ] Both non-goals are stated plainly: saving behaviour, and the absence of a CLI flag
- [ ] Inheritance is documented as CONDITIONAL on the simulated chain id being known, with the declaration that fixes the hardhat case
- [ ] The two-chain-ids question is answered in the reader's terms, not the implementation's
- [ ] Every configuration sample matches the shipped types rather than being written from memory
- [ ] The unknown-signers page gains a pointer, since rehearsing Safe-owned steps on a fork is the main reason to do this
- [ ] No em dashes, and paragraphs are not hard-wrapped
- [ ] An empty changeset accompanies the change if no package code is touched
- [ ] `pnpm format:check` passes, and `pnpm typecheck` and `pnpm test` still pass

## Blocked by

- `fork-config-sub-key-on-the-environment`: the page documents shipped behaviour including the configuration key, so the whole chain must have landed. That task transitively depends on the other four.

## Prompt

> Goal: document fork runs for the person about to rehearse a mainnet deployment against one, including the parts that will surprise them.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Read the shipped types and the tests before writing prose: this task was written before the feature existed, so where it and the code disagree, the CODE is right and you should say so in your report.
>
> READ FIRST: `docs/adr/0014-a-fork-run-simulates-one-chain-and-talks-to-another.md`. Do not restate it at length in the documentation; link it, and write for someone trying to get a rehearsal working. `work/notes/observations/what-fork-actually-does-today.md` is the investigation behind it and is useful for understanding, but it is an internal note and its corrections make it a poor thing to quote.
>
> Where to look. The documentation site is a directory per section with an `index.md`, and there is an existing unknown-signers section which is where a Safe-governed team lands. Follow that page's style. The fork feature's own tests are the reliable source for correct configuration samples.
>
> The section readers will actually search for is the chain id one, because it is where the tools disagree visibly. Frame it as two questions with two answers rather than as an implementation detail: what the run is SIMULATING decides configuration and records, what the node REPORTS decides what a transaction can say, and a signed transaction has to satisfy the node.
>
> Be careful to state the saving non-goal accurately: it is not that a fork cannot corrupt records, it is that the one shipped caller suppresses saving itself while core would not. That is a real caveat for anyone driving core directly, and understating it would be worse than omitting it.
>
> Done means: someone with anvil, a mainnet fork and a Safe-governed upgrade script can read the page and rehearse their deployment without reading the source.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT, including any place where the shipped behaviour differed from what this task assumed. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.

## Decisions

_Page location and name._ The page is `documentation/fork-runs/index.md`, sidebar label "Rehearsing on a Fork", inserted in "Going Further" right after "Testing Deploy Scripts". The directory reuses the existing glossary term _fork run_ (`CONTEXT.md`) rather than coining anything, and the label states the purpose the way sibling labels do ("Handling Unknown Signers", "Guarding Execute Calls"), which the repo already precedents as label ≠ directory. Alternative considered: folding the material into the existing unknown-signers page, rejected because a fork rehearsal is reached from testing and production-hardening too, and the chain-id section is what readers will search for on its own. Touches: `.vitepress/config.mts` and any later page that wants to link a fork rehearsal.

_Documented a shipped behaviour the task did not anticipate (no drift in the task's own claims, but a gap)._ On the programmatic path, `getChainIdForEnvironment` asks the node for its chain id ONLY when the caller passed a `provider`, and the fork input's `chainId` does not feed that resolution: with neither a provider nor `environments[<name>].chain`, a fork run throws `Could not find chainId for environment named "mainnet" (no provider)`. Verified by running the shipped function, not read off. The page therefore tells the anvil reader to declare `environments: {mainnet: {chain: 1}}`, which is the same one line that fixes the hardhat inheritance case, and notes that against anvil the declared id is also what the node reports so the two identities agree. Alternative considered: telling the reader to build and pass a provider (`eip-1193-jsonrpc-provider`), rejected as more machinery for the common case, though it is mentioned as the answer for attaching to a node whose reported id differs. Touches: the future `--is-fork` CLI task, which will hit exactly this and should read the id from the node it attaches to.

_Documented the latent `overrides.rpcUrl` trap in one sentence._ `work/notes/observations/a-fork-run-still-dials-the-environment-overrides-rpc-url.md` records that the environment `overrides` layer still supplies a fork run's endpoint, which for a real network's environment entry is that network's real endpoint. The page is where a reader learns to write `whenForked.rpcUrl`, so it says: an `overrides.rpcUrl` would otherwise be what a fork run dials, name the fork's endpoint in `whenForked` too. Stated as guidance, not as a promise about a fix. Touches: whoever later moves that rule into core, who should delete the sentence.

_Documented that `accounts` / `data` entries keyed by a chain NUMBER follow the CONNECTED chain._ Verified by running a real environment against both provider shapes: an entry keyed `1` resolves on an anvil fork and falls through to `default` on a hardhat one, while an entry keyed `mainnet` resolves on both because those lookups try the environment name first. The task did not mention this; it belongs in the chain-id section because it is the one place the two identities produce a user-visible difference in ordinary configuration. Touches: nothing in code, but it is a claim a future change to account/data resolution would invalidate.

_Added a pointer from `production-hardening` as well as from `unknown-signers`._ Only the unknown-signers pointer is an acceptance criterion; the "Rehearse on a fork" section of production-hardening is the other place a reader is told to do this with no instructions to follow, so it now links the how-to and mentions that impersonation is on by default for a fork. One sentence, no restructuring.
