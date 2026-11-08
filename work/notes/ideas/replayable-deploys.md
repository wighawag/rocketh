---
title: 'Replayable deploys: record a run so another chain can replay it, idempotently'
type: idea
status: incubating
created: 2026-11-08
slug: replayable-deploys
---

# Idea: replayable deploys as a rocketh capability

Status: incubating. Wanted, not scheduled.

## What exists today, outside rocketh

The template tree (`jolly-roger` and every game below it) packages a game for a LAN box (github:wighawag/ethereum-lan-node). The box runs its own chain, so its addresses cannot be learned by deploying to it in advance. The build therefore deploys into a throwaway in-process chain with the box's chain id, records every transaction, and the box replays the recording against its real chain on every boot. For that to be safe, every transaction must be one of:

- a CREATE2 deployment through the deterministic-deployment proxy (`deterministic: true`), so it lands at the same address on any chain that has the factory, and is skipped when that address already holds code;
- a setup call sent with `execute(..., {guard})` (@rocketh/read-execute), replayed only when the guard's read does not already return what it returned right after the call landed.

Anything else (an unguarded `execute`, a nonce-based deploy, a sender outside the known accounts) is refused at build time, because a box replaying it on every boot would repeat it.

This is about 300 lines of JS, and it is moving out of the template into ethereum-lan-node, where the Nix build copies it into the sandbox (`deploy-lan-build.ts`, `scripts/lan/{accounts,record,replayable}.ts`). Two pieces cannot move out, and they are why this note exists:

1. **The guard hook.** `execute` evaluates the guard and sends the transaction, but tells nobody which guard went with which transaction. So each repo wraps its extensions in `rocketh/deploy.ts` with `withGuardRecording(extensions)` (`rocketh/guard-recording.ts`), an inert wrapper that records `{tx hash -> guard read + expected result}` only when a recorder is installed on `globalThis`. Verified 2026-11-08 on template-commit-reveal@with/all: without that wrapper in `deploy.ts`, wrapping the extensions given to `setupEnvironmentFromFiles` is NOT enough, because deploy scripts take their `execute` from `deploy.ts`'s `setupDeployScripts(extensions)`, and the replay check then refuses the setup call.
2. **The in-repo check.** `contracts/test/js/DeterministicDeploys.test.ts` ran the same replayability check in the contract tests, so a template change that broke it failed at the level that wrote it. With the JS in a Nix build, the test has nothing to import, so it is being dropped and the check only fires in `nix build .#lan`.

## What rocketh could offer

- **An execution listener**, e.g. an environment option (or a `withEnvironment` hook) that `@rocketh/read-execute` notifies with `{receipt, guard, evaluation}` for each guarded `execute` it sends. The recorder then needs no wrapper in user code, and `guard-recording.ts` plus the `deploy.ts` line disappear from every repo.
- **The replay itself as a module** (say `@rocketh/replay`): run a deploy on a provider, return the replayable transactions (or the error naming the one that is not), and a small replayer for the other side. It is not LAN specific: any "deploy once, replay on N chains, idempotently" setup wants it (ephemeral test chains, a fleet of appchains, a pre-funded devnet image).
- **A test helper** (`expectReplayable(env)` or similar), so a repo can keep the early check in its contract tests by importing a published package instead of copied scripts.

## Open questions

- Is a chain without the deterministic-deployment proxy in scope (the replayer deploying the factory's pre-signed transaction first, as rocketh already does for local chains)?
- Should the recording format be rocketh's own (and versioned), so a replayer written in another language (today: `cast` in a shell script) can rely on it?
- `deterministic: true` is enforced only by this check. Would rocketh want a config-level "every deploy must be deterministic" switch instead?

## Where it would land

The template's `withGuardRecording`, `scripts/lan/*` and `DeterministicDeploys.test.ts` (jolly-roger, as of commit 923662a1), and ethereum-lan-node's copy of the build scripts once moved, are the reference implementation.
