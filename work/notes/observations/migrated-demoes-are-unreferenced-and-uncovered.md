---
title: 'The migrated demoes are linked to the OLD repo, are outside the workspace, and are outside CI'
type: observation
status: spotted
spotted: 2026-08-18
needsAnswers: true
---

# The demoes came into the monorepo but nothing points at them or runs them

Spotted while adding `demoes/hardhat-deploy/governance/`, when working out whether a new demo would be maintained or would rot. Not investigated further; recorded so the question is asked once rather than rediscovered.

`eb94bbd` ("chore(hardhat-deploy): migrate demoes, skills, and docs into the monorepo") brought `demoes/hardhat-deploy/{basic,diamond,proxies,router}` into this repo. Three things about them look unfinished:

1. **The docs still link the UPSTREAM copies, not these.** Both `skills/hardhat-deploy-migration/SKILL.md:2002-2004` and `hardhat-deploy/documentation/how-to/migration-from-v1.md:1418-1420` link to `https://github.com/wighawag/hardhat-deploy/tree/main/demoes/{basic,diamond,proxies}`. So a reader following the docs lands on the copies in the other repo, and the migrated ones are referenced by nothing. Two copies exist and the documented one is not the one in this tree.
2. **They are not in the pnpm workspace.** `pnpm-workspace.yaml` lists `packages/*` and `website` only. Yet `demoes/hardhat-deploy/proxies/package.json` declares `"hardhat-deploy": "workspace:*"`, which cannot resolve from this repo's workspace. That dependency presumably resolved in the repo they came from.
3. **They are not in CI.** No workflow in `.github/workflows/` references `demoes/`. Nothing installs, compiles, typechecks or runs them, so a breaking change in `@rocketh/proxy` or `rocketh` would not be caught by them.

There is contrary evidence that they ARE meant to be live code: `packages/rocketh-export/CHANGELOG.md:22` reasons carefully about the `demoes/hardhat-deploy/proxies` export script being broken by a flag rename, and `2bd7128` ("fix(demoes): pass the environment with -e, not the removed -n") fixed exactly that. So they are being maintained by hand, without a gate that would have caught it automatically. The CHANGELOG entry notes that the script "already fails earlier and unrelatedly", which is the shape of a project nobody runs.

## Why it matters

Whether a demo is a **documentation artifact** (hand-maintained, linked from the docs, allowed to lag) or a **tested example** (in the workspace, compiled in CI, a real consumer of the packages) is a decision, and right now the tree does not say which one these are. It determines whether adding a demo is cheap or is a maintenance commitment, and it decided nothing about `demoes/hardhat-deploy/governance/`, which was written to match its siblings exactly and therefore inherits whatever the answer turns out to be.

At minimum, item 1 is a straightforward fix regardless of the answer: the two doc links should point at the copies in this repo.

## Update, 2026-08-18

The maintainer answered the decision this note was waiting on: the demoes are meant to be **full-fledged demos**, kept in the repo, on the grounds that a demo that really runs teaches us things a test does not.

That answer earned itself immediately. `demoes/hardhat-deploy/governance/` was first written copying the sibling shape from `demoes/hardhat-deploy/proxies/deploy/003_transparent_test.ts`, which calls `deployViaProxy` TWICE under one name (v1, then v2) to demonstrate an upgrade. Checking that shape against `packages/rocketh-proxy/src/index.ts` showed it cannot converge:

- both calls resolve to the same `<name>_Implementation` record (`:186`), and `optionsForImplementation` (`:159-166`) does not set `skipIfAlreadyDeployed`;
- the upgrade decision reads the EIP-1967 implementation slot and compares it to the implementation just resolved (`:463-471`);
- so on the SECOND run the first call sees v2 in the slot, wants v1 back, and issues a DOWNGRADE.

With a signable owner (the sibling demo's case) that is invisible: it broadcasts a redundant redeploy-and-upgrade on every run. With an unsignable owner it is fatal, because that first call is not wrapped and throws `UnknownSignerError` out of the script.

Two consequences, neither yet acted on:

1. **`demoes/hardhat-deploy/proxies/deploy/003_transparent_test.ts` (and `002_uups_test.ts`, same shape) very likely churn a redundant implementation redeploy plus upgrade on every single run.** Not verified by running, only by reading the code path. If confirmed, the sibling demoes are teaching a pattern that only works because nobody is watching the transaction count.
2. The governance demo now selects ONE target implementation per run (`rocketh/target.ts`, `REGISTRY_VERSION`), which is both correct and closer to what a real project does.

This is the first concrete evidence for item 3 of the original note: nothing installs, compiles or runs the demoes, so a shape that cannot converge sat in the tree unnoticed.

## Update, 2026-08-19: the demoes were made workspace members, and what that found

`demoes/hardhat-deploy/*` are now in `pnpm-workspace.yaml`. They had to be: each declares `hardhat-deploy: workspace:*`, which cannot resolve outside a workspace, so `pnpm install` inside one fails outright. Four things came out of doing it, and one of them retracts a claim made in the update above.

**1. A semver range does NOT reliably link to the workspace package.** With `linkWorkspacePackages: true` and ranges like `@rocketh/proxy: ^0.19.12`, pnpm resolved `@rocketh/proxy`, `@rocketh/deploy`, `@rocketh/read-execute` and `@rocketh/unknown-signer` from the REGISTRY, each exactly one patch ahead of the workspace copy, while `rocketh`, `@rocketh/node` and `hardhat-deploy` did link. The mechanism behind the split was not established. What matters is the outcome: because `minimumReleaseAgeExclude` exempts this project's own packages from the seven-day floor, the newest publish is always available to win, so a demo on ranges tests PUBLISHED code essentially always. Only `workspace:*` guarantees the local package. `demoes/hardhat-deploy/governance` was switched to `workspace:*` and all ten then linked; the four siblings are still on ranges and still detached.

**2. Every demo was broken before this, and had been for a while.** `pnpm compile` failed identically in all of them: the `@nomicfoundation/hardhat-*` plugin ranges (`^3.0.x`) now resolve to versions requiring `hardhat@^3.8.0` or `^3.12.0`, while every demo pinned `hardhat: 3.4.5`, so the config failed to load with `does not provide an export named 'definePlugin'`. All five are now on `hardhat: ^3.12.0` and all five compile.

**3. `demoes/hardhat-deploy/router/test/utils/index.ts` imported facets that do not exist in that demo**, `Abi_GetMessageFacet` / `Abi_SetMessageFacet` from `generated/abis/GetMessageFacet.js`, where router's contracts are `GetMessage` / `SetMessage` with no `Facet` suffix. Copy-paste from the diamond demo that had never been typechecked. Fixed.

**4. RETRACTION.** The update above claimed the sibling proxies and UUPS demoes "very likely churn a redundant implementation redeploy plus upgrade on every single run", explicitly flagged as read from the code and not verified by running. It has now been run, from a clean `deployments/localhost`, three times:

- run 1 deploys everything, including each implementation twice, which is the intended deploy-then-upgrade demonstration;
- run 2 redeploys `UUPS_Implementation` ONCE more;
- run 3 is completely clean, reusing everything.

So it converges. It does **not** churn on every run, and the claim is withdrawn. The likely reason it settles is non-strict bytecode matching (`docs/adr/0004-non-strict-bytecode-matching-by-default.md`), which stops a differing artifact under an existing name from forcing a redeploy, but that mechanism was inferred and not confirmed.

The separate claim, that the same two-call shape would THROW `UnknownSignerError` on the second run when the proxy owner is unsignable, remains **untested**: the governance demo was restructured to one artifact per run before it could be observed. The run-2 redeploy above is consistent with it, since a redeployed implementation makes the on-chain slot differ and an unwrapped upgrade would then hit the seam, but consistent is not the same as demonstrated.

To make demo breakage visible from now on rather than discovered years later, each demo gained `"build": "hardhat compile"`, so `pnpm build` generates their artifacts before `pnpm typecheck` (which is `pnpm -r`, and therefore now covers them) runs in CI order. `pnpm build`, `pnpm typecheck` and `pnpm test` are all green with the five demoes in the workspace.
