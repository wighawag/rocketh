---
title: 'Foundry support: bring forge-deploy in, in steps, starting with forge artifacts'
type: idea
status: incubating
created: 2026-08-18
---

# Foundry support is intended, via forge-deploy, ported in steps

**Maintainer-stated roadmap intent, not a speculative idea.** Recorded because it changes how several existing conclusions should be read, and because it was said in passing in a conversation about something else.

## What was said

`forge-deploy` is a sibling project of this one. The intent is to bring it into this repo the same way `hardhat-deploy` was brought in, but with two differences:

- it gets **converted to TypeScript** (forge-deploy is currently not);
- it gets **ported in steps**, not in one migration.

The **first step** is being able to consume **forge artifacts**. Nothing else is committed to yet.

Explicitly **not now**. This is context for judging current work, not a queue item.

## Why it matters beyond itself

It changes the meaning of "is X a migration target for rocketh?". Until now that question implicitly meant "does X have a JavaScript/hardhat deployment layer we could migrate?", and a Foundry-native project answered no by construction. Once forge artifacts are consumable, a Foundry project is a candidate on artifacts alone, whatever its deploy scripts are written in.

The concrete case that prompted this: `work/notes/findings/governance-upgrade-topologies-in-the-wild.md` concluded that Aave V4 "is not a migration target for rocketh" because their deployment framework is written in Solidity and driven by `forge script`. That conclusion was drawn against the current artifact story and is amended in the finding itself. The governance shapes that finding recorded are unaffected: they are properties of the contracts, not of the toolchain.

## Open, and deliberately not answered here

- Whether consuming forge artifacts is a `@rocketh/node` concern, a separate package, or something the executor adapter resolves.
- Whether a Foundry project's DEPLOYMENT RECORDS interoperate, or only its artifacts. Artifacts are the stated first step; records are a different and larger question.
- What "like we did for hardhat-deploy" implies for the docs site, the demoes tree and the skills directory, all three of which grew a `hardhat-deploy/` section when that project came in.
