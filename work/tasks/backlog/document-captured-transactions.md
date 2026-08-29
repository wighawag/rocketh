---
title: 'Document captured transactions: what the list holds, what is promised, and how to batch or replay it'
slug: document-captured-transactions
spec: captured-transactions
needsAnswers: true
blockedBy: [capture-broadcast-transactions-on-the-environment, write-captured-transactions-to-a-file]
covers: [3, 6]
---

<!-- open-questions -->

## Open questions

1. **How is a `type: 'raw'` entry meant to be replayed in a Solidity fixture, and should the page tell the reader to skip it?** The list contains one on every fresh-node run: `@rocketh/deploy` relays the Nick's-method deterministic-deployment factory bootstrap (`packages/rocketh-deploy/src/index.ts`) whenever the Create2 factory is absent, which is exactly the fresh memory node a fixture uses. A pre-signed RLP payload cannot be pranked and no Foundry cheatcode submits one, so the honest options are: tell the reader to SKIP raw entries and ensure the factory exists another way (Foundry pre-deploys its own deterministic deployer, and `vm.etch` can place one), or document a specific recipe. Nothing in the repo decides this today, and the writer must not invent a recipe the code does not support. Answer before writing the fixture section.

<!-- /open-questions -->

## What to build

The user-facing documentation for captured transactions, written for the two people who will arrive at it: the operator rehearsing a governance-owned upgrade on a fork who now has to turn the output into Safe proposals, and the team who deploys in TypeScript, tests in Solidity, and wants their real deployment sequence as a test fixture.

**The page covers:**

- What the list IS: the transactions this run broadcast, in the true order it broadcast them, with who sent each one. Confirm the shipped shape against the types and the tests rather than writing it from memory.
- The two ways to get it: on the environment a run returns (in process, no file, no path to agree on), and as a file when the CLI flag asks for one. Document the flag exactly as it shipped, including its `--help` wording.
- **Ordering is the only promise, and rocketh does not segment.** Say this plainly, because it is the whole shape of the feature: rocketh never decides what constitutes one proposal. The user segments the list themselves, and `signability` is what they segment on. A boundary is a change in `signability` OR in `from` between consecutive entries: two consecutive `impersonated` entries from DIFFERENT Safe addresses are two proposals, not one, which is the multi-Safe case the stories call out, and `impersonated` is precisely the set that could not have signed for itself, which on a fork rehearsal is the set the Safe must execute. Show a worked example of reading the split points out of the output, since the story this answers is "I want to learn that from the output rather than from a proposal that reverts".
- **Why intent and not a signed transaction.** A signed transaction commits to its nonce as part of the signature, so only that sender at that nonce can ever replay it; an intent replays at any nonce, under any prank, in any order. And for an impersonated sender there is no signed payload anywhere to capture, because the node fabricates the sender. Intent is therefore MORE replayable here, not a lossy substitute.
- **Why there are no gas or fee fields, and no nonce.** Recording them invites a consumer to replay them, and nobody wants the fee market of the moment the fork ran.
- **The replay guarantee and its condition** (this is the Solidity fixture story): replaying the captured transactions in order, from the same senders, against a node fresh from genesis reproduces the same contract addresses, because the nonces then match exactly. State the condition rather than the headline alone, and note it has FOUR terms: the CAPTURE run must itself have started from a fresh chain (capture on a fork of mainnet and replay on a fresh node gives different addresses), and the replay must be in order, from the same senders, against a fresh chain. Document how a raw pre-signed transaction in the list is meant to be replayed, exactly as it shipped.
- **What a fixture run must turn ON, and why it is not the default.** A Solidity-fixture run is a MEMORY run, not a fork, and `autoImpersonate` defaults on only for a fork. So a governance-owned step in a fixture run does NOT impersonate by default: the account classifies `unsignable`, reaches the unknown-signer seam, and throws or asks instead of executing. That flow needs `autoImpersonate: true` set explicitly for the run, and the page should say so, because it is discovered otherwise by a fixture that is silently missing its privileged steps. Say why the default is not simply flipped: the unknown-signer scenarios deliberately build an unsignable account on a memory-shaped environment, and defaulting impersonation on would silently disable the deferral path they exercise.
- **Every INTENT entry is replayable in Solidity, whatever its signability.** A Solidity test needs no key and no node capability to send as another address: `vm.prank` sets `msg.sender` directly and is unconditional, unlike `ffi`, which the test profile gates. So `impersonated` entries replay exactly like `local` ones, and there is no "allow impersonation" setting to find. The thing that requires real impersonation is the CAPTURE side (the node must support it), not the replay side. **State the scope of that claim honestly: it is about intent entries.** A `type: 'raw'` entry is a pre-signed payload and no Foundry cheatcode submits one, so it cannot be pranked; see the open question below, and do not write a replay recipe for it that the code does not support.
- **But an `unsignable` entry in a fixture run is a SIGNAL, not something to replay around.** It means that run hit the seam rather than executing the step, so the list records what rocketh ASKED for and a human answered out of band. Two consequences worth stating: the captured intent is the request, and the transaction that actually landed may have been wrapped (a Safe execution goes TO the Safe carrying the call inside it), so the intent is the cleaner thing to replay; and its presence in a fixture run almost always means impersonation was off, which is the previous bullet. The remedy is to fix the run, not to filter the list.
- **A failed run produces no output**, so a file is never a HALF-WRITTEN one, and a previous file is left untouched. Do NOT write that the file is therefore always a whole plan, because there is a second way to be incomplete that does not involve failure: a transaction DEFERRED under the `throw` policy (which `catchUnknownSigner` swallows so the script continues) produces no entry and the run SUCCEEDS, so the file is written missing exactly the privileged calls the operator has to execute. The fork-runs page actively routes readers to that path when it tells them to turn impersonation off, and this page adds a pointer from the unknown-signers page inviting the same reader in, so it must say plainly that the list is what the run DID and not what it still owes. Say why: on a fork or a memory node nothing real happened, so a halved list is not a smaller truth but a misleading one, and executing a partial batch is worse than executing none. Say which run modes that reasoning is FOR, since nothing stops the flag on a run against a real network, where a mid-run failure means transactions really were sent and the file is still not written.
- **Nothing happens unless asked**: no flag, no new file, no behaviour change.
- Pointers from the pages a reader reaches this from: the fork-runs page (rehearsing a Safe-governed upgrade is the main reason to do this) and the unknown-signers page (this is the alternative to deferring each privileged call one at a time).

**Do NOT document reading the list mid-run from inside a deploy script.** A deploy script does hold the same environment object, so it CAN, but that is an accepted consequence of putting a run-scoped result where run-scoped results belong, not a feature. Documenting it would turn it into a contract. There is also deliberately no hook, no callback, no stdout mode, and no join point for one script to consume what earlier scripts captured, so do not describe any.

**Also in scope: pin the term in the glossary.** `CONTEXT.md` is this repo's domain language. It pins the deployment record, and it mentions `PendingTransaction` only in passing, inside the signability entry (about how `transaction.origin` is normalised); there is no standalone entry for the pending-transaction record, so do not describe one as already pinned. The distinction still has to be drawn, because that record is the other transaction-shaped file on disk: a pending transaction is written before the wait and DELETED once the transaction confirms, and it exists for RECOVERY rather than for reporting (see the delete on the broadcast funnels in the environment module). A captured transaction is a third thing, and the next author will otherwise re-fork the term or try to build a consumer on the pending-transaction files. Add a short entry saying what a captured transaction is (the run-scoped, ordered, in-memory list of what this run broadcast, with the file as one sink), and that it has no authority: nothing in rocketh ever reads it back to decide anything.

**Also in scope: a correction owed to ADR 0012.** It rejects a `'collect'` policy partly on the grounds that the seam must return a real transaction hash, so collecting "would have to fabricate a hash, a receipt, and for a deploy an address". That is weaker now: the execute-state guard already made "this call produced no transaction" a representable return. The argument does not collapse (a deploy still has an address dependent code will use), but the ADR states a design constraint as an impossibility. Add a short, dated correction to that ADR saying so, without rewriting the decision, which stands. `ADR-FORMAT.md` does NOT define a correction form (it only gives the `Status` frontmatter), so follow the precedent the ADRs themselves set: a trailing dated section, as in ADR 0006's `## Correction (2026-08-11): ...` and ADR 0012's own `## Amendment (2026-08-27): ...`.

While you are in ADR 0012, note the second, cheaper drift in the same file: its amendment closes by saying `deferred-transaction-collector` writes the collected transactions to an opt-in file. That spec now sits in `work/specs/dropped/` and this feature is what replaced it, so a reader following that sentence lands on a dropped document. Fold a clause into your correction naming the superseding spec instead.

Repo rules apply to prose: no em dashes, and no hard wrapping inside a paragraph.

## Acceptance criteria

- [ ] A documentation page explains what the captured list is, how to get it in process, and how to get it as a file
- [ ] The ordering promise is stated as the ONLY promise, with rocketh's refusal to segment stated as a deliberate boundary rather than a gap
- [ ] Segmenting on `signability` is documented with a worked example that shows where a batch splits and why `impersonated` is the set a Safe must execute
- [ ] The intent-not-raw decision is explained in terms of replayability, including why an impersonated sender has no signed payload to capture
- [ ] The absence of gas, fee and nonce fields is documented as deliberate, with the reason
- [ ] The fresh-node replay guarantee is documented WITH its condition, so a reader cannot take the address equality as unconditional
- [ ] The failure lifecycle is documented: a run that throws writes nothing and leaves any previous file untouched, why a partial batch would be dangerous, and which run modes that all-or-nothing reasoning is designed for
- [ ] The page does not document reading the list mid-run from a deploy script, and does not describe a hook, a callback or a stdout mode
- [ ] Every sample matches the shipped types, flag spelling and file shape rather than being written from this task
- [ ] The fork-runs page and the unknown-signers page each gain a pointer
- [ ] `CONTEXT.md` gains a short glossary entry for a captured transaction, distinguishing it from the pending-transaction record (written then deleted, for recovery) and from the deployment record
- [ ] `docs/adr/0012-a-record-asserts-only-what-rocketh-observed.md` carries a short, dated correction (in the shape ADR 0006 and 0012 already use) noting that the "would have to fabricate a hash" argument overstates a design constraint as an impossibility, with the decision itself left standing, and noting that the amendment's closing pointer to `deferred-transaction-collector` is now a dropped spec superseded by this feature
- [ ] No em dashes, and paragraphs are not hard-wrapped
- [ ] An empty changeset accompanies the change if no package code is touched
- [ ] `pnpm format:check` passes, and `pnpm typecheck` and `pnpm test` still pass

## Blocked by

- `capture-broadcast-transactions-on-the-environment`: the page documents the shipped entry shape.
- `write-captured-transactions-to-a-file`: the page documents the shipped flag, the file shape and the write lifecycle.

## Prompt

> Goal: document the captured-transactions feature for two readers. One has just rehearsed a governance-owned upgrade against a fork of mainnet and now has a list they must turn into Safe proposals; they need to know how to find the split points and what the list does and does not promise. The other deploys with rocketh's TypeScript scripts, tests in Solidity, and wants to rebuild the same deployment inside a Solidity test; they need to know that replay reproduces the same addresses, and under exactly what condition.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Read the shipped types, the tests and the `## Decisions` blocks in the two done records this task is blocked by BEFORE writing prose: this task was written before the feature existed, so where it and the code disagree, the CODE is right and you should say so in your report. In particular, how a raw pre-signed transaction is represented was an open question at tasking time and was answered during the build; document what landed.
>
> Domain vocabulary (`CONTEXT.md` pins it, read it): _signability_ (`local` / `node` / `impersonated` / `unsignable`) and what each value means, and _fork run_, which is a run against a node somebody else forked, is that network for RECORDS and is not that network for chain identity (ADR 0014). Use the repo's words; do not coin new ones.
>
> Where to look. The documentation site is a directory per section with an `index.md` plus a sidebar entry, and the sidebar lives in `.vitepress/config.mts` at the repo root; `documentation/fork-runs/index.md` is the closest sibling in audience and tone, and `documentation/unknown-signers/index.md` is where a Safe-governed team currently lands. The feature's own tests are the reliable source for correct samples. `docs/adr/0006`, `0012` and `0014` are the decisions that constrain the framing; link them rather than restating them at length.
>
> Two things to get right rather than smooth over. First, rocketh's refusal to segment is the feature's shape, not a missing half: it keeps rocketh from ever having to be CORRECT about what belongs in one proposal, only honest about ordering. Write it as a boundary a reader can rely on. Second, the address-equality guarantee is CONDITIONAL on replaying in order, from the same senders, against a fresh chain; a page that promises it unconditionally would mislead exactly the reader who came for it.
>
> Done means: an operator can read the page and turn a fork rehearsal into the right Safe proposals without reading the source, and a Solidity team can read it and know whether replay will give them the addresses they expect.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your FINAL REPORT: where you put the page and why, anywhere the shipped behaviour differed from this task, and how you worded the ADR 0012 correction. Do not write the done record, the commit message or the PR body, and do not edit this task file.
>
> Write any markdown emphasis in that block with UNDERSCORES (`_like this_`), not asterisks: the runner transcribes it verbatim into a file the repo's format gate checks, and `format:check` is the first link of that gate.
