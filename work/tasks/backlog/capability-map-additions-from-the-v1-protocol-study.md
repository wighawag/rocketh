---
title: 'Capability map: the four v1 patterns real protocols use that the map gets wrong or leaves out'
slug: capability-map-additions-from-the-v1-protocol-study
blockedBy: []
covers: []
---

## What to build

`work/notes/findings/v1-protocol-deploy-and-governance-patterns.md` read three production protocols' hardhat-deploy v1 deploy scripts and ported one script each to rocketh, as tests. Four things it found are not in the v1-to-v2 capability map (`documentation/migration/index.md`), or are in it wrongly, and a migrating team using any of them would either give up on a feature that has an answer or meet a compile error the map says will not happen. Each is already pinned by a test; this task only writes them down where the map's reader looks.

1. **`implementationName`, one implementation behind many proxies.** The map marks `implementationName` "not supported" with no alternative. Its main use (Metronome runs every debt token, deposit token and synthetic token proxy on one shared implementation record) is met by `deterministicImplementation: true`: identical creation code lands on one create2 address and the second proxy records it without broadcasting. Each proxy still gets its own `<name>_Implementation` record. Also worth one sentence: v1 needed a per-proxy re-check because it did not reliably upgrade every proxy sharing an implementation (hardhat-deploy issue 284, cited in Metronome's `deploy/helpers/index.ts:157-159`); rocketh decides per proxy from the implementation slot, so that re-check is not needed. Pinned: `packages/rocketh-unknown-signer/test/ported-protocols/metronome-synth.integration.test.ts`.
2. **`skipIfAlreadyDeployed` on a PROXY deploy.** The map's "Deploy and transaction options" table says `skipIfAlreadyDeployed` is "same", but `deployViaProxy` does not accept it (`ProxyDeployOptions` omits it), so a v1 proxy deploy carrying it fails to compile. In v1 the flag went to the implementation deploy, so the proxy was never upgraded once deployed; `upgradeIndex: 0` says exactly that. Add it to the Proxies table and qualify the options row. Pinned (including the compile error): `packages/rocketh-unknown-signer/test/ported-protocols/vesper.integration.test.ts`.
3. **Parameters for a deploy script** (v1 projects set fields on `hre` from a custom task, then `run('deploy')`). The map does not mention `extra`: `loadAndExecuteDeploymentsFromFiles({..., extra})` hands it to every script as `env.extra`. No CLI flag carries it; a project wrapper or environment variables do. Pinned: every test in the Vesper port runs with `extra`.
4. **An `id` assigned inside the script function** (`deployFunction.id = ...` before `return true`). v1 checks `func.id` BEFORE a script runs, so such an id never skipped anything in a fresh process; it was only written down. rocketh's `id` is static (the second argument of `deployScript`). The port is to DROP it, and a run-once script must not `return true` after a deferral (`documentation/script-lifecycle/`). Vesper does this in `upgrade-pool.js` and `deploy-vpool.js`.

Leave the run-wide fee flags row alone: those flags are being implemented separately and that work updates its own row. Do not edit the finding or `work/notes/findings/hardhat-deploy-v1-feature-surface.md`.

## Acceptance criteria

- [ ] `documentation/migration/index.md` carries all four, each in the section a reader of that v1 feature would look in, each naming the rocketh replacement and, where one exists, the caveat (shared implementation only for identical creation code; no CLI form for `extra`).
- [ ] The `skipIfAlreadyDeployed` row no longer claims "same" for proxy deploys.
- [ ] Every claim is traceable to the code or to the pinned tests named above; no claim is added that they do not show.
- [ ] If `skills/hardhat-deploy-migration/SKILL.md` or `hardhat-deploy/documentation/how-to/migration-from-v1/index.md` repeats a corrected claim, it is corrected too, and `packages/hardhat-deploy/test/migration-pairs/skill.test.ts` stays green (no pair the skill inlines is hand-edited).
- [ ] `pnpm format:check` passes, plus an empty changeset if the gate requires one.

## Blocked by

- None. Can start immediately.

## Prompt

> Goal: add four corrections to the v1-to-v2 capability map, `documentation/migration/index.md`, each already proven by a test: (1) `implementationName`'s shared implementation via `deterministicImplementation: true`; (2) `skipIfAlreadyDeployed` on a proxy deploy does not compile, `upgradeIndex: 0` is the equivalent; (3) `extra` as the way to pass parameters to deploy scripts; (4) a v1 `func.id` assigned inside the function is dropped in the port.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED): open the map and confirm each of the four is still missing or still wrong; run `pnpm --filter @rocketh/unknown-signer test` and confirm the ported-protocols tests named in the task still pass. A point already fixed is simply skipped; if a test no longer shows what the task claims, route to needs-attention rather than writing the claim.
>
> Read `work/notes/findings/v1-protocol-deploy-and-governance-patterns.md` (the "Pattern by pattern" tables and "What this contradicts or refines elsewhere") for the evidence and the protocol files it cites. Verify each behaviour in the code before you write it (`packages/rocketh-proxy/src/index.ts` for `ProxyDeployOptions` and `deterministicImplementation`, `packages/rocketh-deploy/src/index.ts` for a deterministic deploy that finds code already at its address, `packages/rocketh-core/src/types.ts` for `ExecutionParams.extra`, `packages/rocketh/src/executor/` for when `id` is read).
>
> Style: the map's own conventions (the four status words, one row per v1 capability, prose for anything a row cannot say), single-line paragraphs, no em dashes. Do not name who reported a pattern; the protocols may be named only as the source of public code, as the finding does, and the map has no need to name them.
>
> Done means: the acceptance criteria above.
>
> RECORD non-obvious in-scope decisions in a `## Decisions` block at the end of your final report.
