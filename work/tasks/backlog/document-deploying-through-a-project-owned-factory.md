---
title: 'Document deploying through a project-owned factory (CreateX, a permissioned create3), with read + execute + save'
slug: document-deploying-through-a-project-owned-factory
blockedBy: []
covers: []
---

## What to build

rocketh's `deterministic` option drives only factories of rocketh's own designs. The `deterministicDeployment` chain config can point it at another INSTANCE (factory address, bytecode, salt, deployment transaction), but the calldata and the address formula are code: `salt ++ creationCode` for create2, and `deployDeterministic(bytes,bytes32)` with a deployer-namespaced salt, from a factory that itself sits at its create2 address, for create3. A project whose contracts live at addresses derived by ANOTHER factory (CreateX, or a Safe-gated create3 such as the `Deployer3` one protocol uses) cannot express that through `deterministic`, and needs to keep doing what it did under hardhat-deploy v1: call its factory and record the deployment itself.

That works today and is pinned by `packages/rocketh-unknown-signer/test/ported-protocols/odyssey.integration.test.ts` (`deploy3One`): compute the address with a `read` on the factory, refuse a salt already used, `execute` the factory's deploy call, `save` the record with the artifact, the address and the encoded constructor arguments, and reuse the record when the creation code is unchanged. Write that recipe down, and say plainly what `deterministic` does and does not cover, so a migrating team neither assumes config can describe their factory nor gives up on rocketh because it cannot.

Decided not to build: a pluggable factory adapter behind `deterministic` (finding's open question 2). The docs say this is a recipe by design for now.

## Acceptance criteria

- [ ] A docs section (where deterministic deployment is documented, with a pointer from `documentation/migration/index.md` for v1 projects that deployed through their own factory) states what `deterministicDeployment` config can change (the factory instance) and what it cannot (calldata, address formula), citing the code.
- [ ] The section shows the `read` + `execute` + `save` recipe, including the reuse check and the salt-already-used refusal, and what the saved record must contain to be a well-formed deployment record (ADR 0015).
- [ ] The example is the tested one (or is checked by a test), so it cannot drift silently.
- [ ] `pnpm format:check` passes, plus an empty changeset if the gate requires one.

## Blocked by

- None. Can start immediately.

## Prompt

> Goal: document how a project deploys through its own deterministic factory with `read` + `execute` + `save`, and what rocketh's `deterministic` option and `deterministicDeployment` config do and do not cover.
>
> FIRST, check this task against current reality: open `packages/rocketh-deploy/src/index.ts` (the create2 and create3 derivations and `getCreate3Factory`) and `packages/rocketh-core/src/types.ts` (`Create2DeterministicDeploymentInfo`, `Create3DeterministicDeploymentInfo`) and confirm the claims about what config can and cannot change. If `deterministic` has grown a way to describe another factory, route to needs-attention.
>
> The tested recipe is `deploy3One` in `packages/rocketh-unknown-signer/test/ported-protocols/odyssey.integration.test.ts`; the real-world shape is in `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md` (Odyssey). That project's repository has no licence, so do not copy from it; the test's code is this repo's own. Read ADR 0015 for what a deployment record must carry.
>
> Style: single-line paragraphs, no em dashes. Do not name who reported the pattern.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report.
