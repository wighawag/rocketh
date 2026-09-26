---
title: 'Production hardening: which items could become defaults or warnings'
slug: production-hardening-defaults-and-warnings
---

# Idea: turn production-hardening prose into defaults and warnings

Status: incubating. This is an INVENTORY, not a proposal to build all of it. It is the input to the planned rewrite of `documentation/production-hardening/index.md`: the page currently asks the operator to remember nine things, and a page that asks the reader to remember something the code could assert is a page carrying work the code should carry.

Each entry below records what the prose asks for, what a default or warning would look like in code, why it is not the default today, and what would break if it changed. Ranked by harm prevented over disruption caused. Several entries conclude NO, deliberately: an inventory that recommends everything is a list nobody can act on, and the strongest sections of the page are the ones where the right answer is advice rather than enforcement.

Every claim here was read off the code at the time of writing; anchors are given so a reader can re-check rather than trust this file.

## 1. Refuse a diamond cut that removes the last path to `diamondCut`

**The prose asks:** read the cut plan before approving, especially the removals, because "the worst case is removing the last path to `diamondCut` itself, which makes the diamond permanently immutable".

**What the code does today:** it prints. `formatDiamondCutPlan` (`packages/rocketh-diamond/src/report.ts:55`) builds a plan with removals first and in their own block, and `packages/rocketh-diamond/src/index.ts:499` passes it to `env.showMessage`. It refuses nothing, by design, because legitimate upgrades remove functions.

**What a default would look like:** at that same call site, before `_execute`, compute the `diamondCut` selector from the already-imported `DiamondCutFacet` artifact (`artifactDiamondCutFact`, imported at `packages/rocketh-diamond/src/index.ts:7`) and check whether the post-cut selector set still contains it. If it does not, throw unless the caller passed something explicit such as `allowLockingDiamond: true` on `DiamondDeployOptions`. Not a prompt: this is the one case where the mistake is unrecoverable, so the ceiling argument that governs `onUnknownSigner` (a non-interactive run must not hang) says refuse rather than ask.

**Why it is not the default today:** nobody did it. The plan-printing work established the vocabulary (`FacetCutAction.Remove`, selector-to-signature resolution) that makes the check cheap, and the check was simply never the next step.

**What would break:** a deliberate lock-down, meaning someone intentionally sealing a diamond by removing `diamondCut`. That is real but rare, and the opt-in flag preserves it. The risk to weigh is the detection being wrong in the other direction: a cut that removes `diamondCut` from one facet while adding it from another must not trip, so the check has to run against the resulting selector set, not against the removal list.

**Ratio:** the best in this file. The harm is catastrophic and irreversible, the signal is exact rather than heuristic, and the escape hatch is one option.

## 2. Warn when an export could have been verified and was not

**The prose asks:** pass `rocketh-export --verify` on the build that ships, noting that "the moment it matters is exactly the moment nothing forces you to pass it".

**What the code does today:** `--verify` is an opt-in CLI flag (`packages/rocketh-export/src/cli.ts:29`). When passed it checks two things (`packages/rocketh-export/src/index.ts:263-281`): that `eth_chainId` matches the chain recorded for the environment, and that every exported address has code. When not passed, nothing is checked and nothing is said.

**What a warning would look like:** in the export path where the chain config is already consulted for an `rpcUrl` (`packages/rocketh-export/src/index.ts:338-374` resolves exactly this), emit a `console.warn` when an `rpcUrl` or a provider IS available and `--verify` was not requested. Per ADR 0009 the notice belongs on `console`, not on the `named-logs` logger, because `logs()` is a permanent no-op unless a factory was hooked first and the `rocketh-export` CLI does not hook one. Silent when there is no endpoint, since then there is nothing to verify and the warning would be noise on precisely the offline build the opt-in exists to protect.

**Why it is not the default today:** the flag is opt-in for a documented and correct reason, quoted in the source: export reads and writes files, so it works with no network, and adding an RPC round trip to the default path "would make every offline build fail".

**What would break:** nothing functional, since this is a warning rather than a behaviour change. The cost is noise for anyone who exports locally with an `rpcUrl` configured and does not want the check, which argues for making it suppressible.

**Ratio:** high. It closes the gap the documentation itself names, without touching the offline guarantee that justifies the current default.

## 3. Warn when `autoImpersonate` is on for a run that is not a fork

**The prose asks:** check `autoImpersonate` is off, because "an impersonated account is signable and therefore never reaches the unknown-signer path".

**What the code does today:** it is resolved in `resolveExecutionParams` (`packages/rocketh/src/executor/index.ts:547-552`) as execution param, then chain config, then defaulting to `fork !== undefined`. So it is already off by default for a non-fork run, and on for a fork, which is the right pair of defaults. The gap is the middle case: a shared config that sets it explicitly for a chain that is not a fork.

**What a warning would look like:** immediately after that resolution block, warn when `autoImpersonate` is true and `fork === undefined`, naming which layer set it.

**Why it is not the default today:** the defaults are already correct, so this is about visibility of an override, not about changing behaviour.

**What would break:** nothing, but the honest caveat is that the warning is worth less than it first appears. A real production node rejects `hardhat_impersonateAccount`, so the configuration usually fails loudly on its own; the case the warning actually catches is a dev or fork-like node the operator believes is production. Worth doing, worth not overselling.

**Ratio:** good, because it is a handful of lines with no behavioural risk, but the harm prevented is narrower than the documentation's framing suggests.

## 4. Ship the `addressSignability` assertion instead of describing it

**The prose asks:** for a run that must not hold the admin key, "assert it rather than assume it, using the public `env.addressSignability` map".

**What the code does today:** the map is public on the environment (`packages/rocketh-core/src/types.ts:898`) and reports `'unsignable'` for any address it never saw during the run (`packages/rocketh-core/src/types.ts:800`). The assertion itself is left to the reader to write.

**What this would look like:** a small exported helper in `@rocketh/unknown-signer` (`packages/rocketh-unknown-signer/src/index.ts`), taking the environment and one or more addresses and throwing when any of them is signable. Purely additive, no default changes.

**Why it is not the default today:** it cannot be a default. Which accounts must be unsignable is project knowledge that rocketh has no way to infer.

**What would break:** nothing. The design question is the `'unsignable'`-by-omission semantics: an address never seen reads as unsignable, so a helper that asserts unsignability could pass on a typo'd address. It should probably require the address to have been resolved, or say clearly that it does not.

**Ratio:** moderate harm prevented, near-zero disruption. The argument for it is that a hand-rolled version of this check is easy to write subtly wrong, and this is the one page asking every reader to write it.

## 5. Name the resolved policy when an unknown signer stops a run

**The prose asks:** set `onUnknownSigner: 'throw'` explicitly for unattended privileged runs, because `'auto'` already degrades to `throw` when there is no interactive resolver, but "saying it outright is what makes the intent survive a future change to how the run is invoked".

**What the code does today:** `'auto'` is capability-aware and resolves to `ask` only where the run can genuinely reach a human, with capability acting as a ceiling (`packages/rocketh-core/src/types.ts:700-713`, resolution at `packages/rocketh/src/executor/index.ts:556-568`). So the safe behaviour already happens without the explicit setting. `UnknownSignerError` (`packages/rocketh-core/src/errors.ts:103`) carries the failure.

**What this would look like:** include in the error message whether the policy came from an explicit setting or from `'auto'`, and in the `'auto'` case say that the run had no prompt capability. Message-only.

**Why it is not the default today:** there is no default to change. This is the entry where the documentation is asking for a belt-and-braces setting that the capability ceiling already guarantees.

**What would break:** nothing.

**Ratio:** low harm prevented, near-zero cost. Listed mainly to record that the prose overstates the risk: a reader who skips this advice is already safe, and the page should say that rather than imply an unattended run might prompt.

## Not candidates, and why

These stay as advice. Recording the reasoning so the rewrite does not relitigate them.

- **Do not put secrets in `linkedData`.** `linkedData` is copied into the export (`packages/rocketh-export/src/index.ts:451` and `:563`) and is a documented accepted property in `SECURITY.md`. A scan for secret-shaped values would be a heuristic over developer-authored data, and the false positives would land on exactly the build that must not fail. The honest mitigation is the documentation plus the accepted-property entry, not a detector.
- **Pin the tooling, protect the branch holding production records, review address changes in the diff.** All three are properties of the USER's repository, not of anything rocketh executes. Rocketh cannot enforce them and should not try. If they ever become checkable it is as an advisory command that inspects a deployment repository and reports, never as a default that refuses to run.
- **Read the chain again after execution.** The page is right that a receipt proves mining and not the intended state transition, but "intended" is project knowledge. The generically checkable slice of it is precisely what export `--verify` already does (chain id matches, addresses have code), which is why entry 2 is the actionable form of this advice.
- **Rehearse on a fork.** A workflow recommendation. There is nothing to default: the fork machinery already exists and already turns `autoImpersonate` on for fork runs, which is the one piece of it that is a default and is already set correctly.

## What this implies for the page rewrite

Three of the nine sections are asking the reader to do something the code could do or say (entries 1, 2, 3). One is asking the reader to write a helper that should ship (entry 4). One is asking for a setting that is already guaranteed (entry 5), and the page should be honest that it is belt and braces. The remaining four are genuine operator advice about the deployment repository and should stay prose, which is a better page than nine items of undifferentiated instruction.

## Related

- `docs/adr/0009-user-facing-notices-stay-on-console.md`, which governs where any warning proposed here would be emitted.
- `docs/adr/0006-unknown-signer-seam-and-orthogonal-autoimpersonate.md`, the orthogonality that entries 3 and 5 both depend on.
- `SECURITY.md`, whose trust boundaries and accepted properties are the other half of this material. Entry 1 in particular is the boundary rocketh IS responsible for, meaning what the script asked for must equal what leaves the process.
