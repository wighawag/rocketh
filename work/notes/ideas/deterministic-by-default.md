---
title: 'Deterministic by default: a run-level option, a CLI flag, and a namespaced bag extensions read'
type: idea
status: incubating
created: 2026-11-08
slug: deterministic-by-default
---

# Idea: make `deterministic: true` the default for a project, a chain or a run

Status: incubating. Wanted, not scheduled.

## Why

Some projects want EVERY deployment deterministic, and today each `deploy` / `deployViaProxy` / `deployViaRouter` call has to say so. wighawag's template tree is one: its LAN package replays a deploy on a box's own chain, which only works when every address depends on the init code alone (see ./replayable-deploys.md), so its AGENTS.md carries the rule "deploy every contract with `deterministic: true`" and the build refuses a call that forgets. A rule every call site must remember is exactly what a default is for: unless a call says `deterministic: false`, it would be deterministic.

## The catch: `deploy` is an extension

`deterministic` is an option of `@rocketh/deploy` (and of `@rocketh/proxy` and `@rocketh/router`, which forward it), not of rocketh itself. So rocketh cannot own the option's meaning; it can only carry a value from the user to the extensions, untouched. That is the general feature, and deterministic-by-default is its first user.

## Shape

A namespaced bag that rocketh resolves and hands to every extension, keyed by extension so two extensions cannot collide:

- **Project level**: `config.extensionOptions?: {deploy?: {deterministic?: boolean | DeterministicOption}, ...}` in `rocketh/config.ts`.
- **Chain level**: the same bag on `ChainUserConfig` (and `overrides`), because some chains have no deterministic-deployment factory and must be able to turn it back off without touching scripts.
- **Run level**: `ExecutionParams.extensionOptions`, and a generic CLI flag, e.g. `--extension-option deploy.deterministic=true` (repeatable, a dotted path and a JSON value), plus maybe a sugar flag `--deterministic` for this one.
- **Read by the extension** from the environment, e.g. `env.extensionOptions.deploy?.deterministic`, resolved most-specific first: the call's own option, then run, chain, project. An explicit `deterministic: false` on a call always wins.

Why not `env.extra`, which exists (`ExecutionParams.extra`, `packages/rocketh-core/src/types.ts`)? It is the USER's own run data, untyped and unnamespaced, and the CLI cannot set it. Carrying extension options in it would make a user's `extra.deploy` and an extension's option the same key. A separate, keyed bag keeps both.

## Things to get right

- **An explicit `false` must survive forwarding.** `@rocketh/proxy` passes `deterministic: options.deterministic || options.deterministicImplementation` to `deploy` (`packages/rocketh-proxy/src/index.ts:225`), which turns an explicit `false` into `undefined`. Under a default of `true`, that `false` would silently become deterministic. Every forwarding site needs `??`-style handling (or to forward `false` as `false`).
- **What the default means for proxies**: the proxy and the implementation both, as `deterministic: true` on `deployViaProxy` does today.
- **Reporting**: a deploy made deterministic by a DEFAULT rather than by the call should say so in its message, so nobody is surprised by a CREATE2 address (and by the CREATE2 gotcha: a constructor's `msg.sender` is the factory).
- **Typing**: each extension declares its slice of the bag (module augmentation, or a type parameter on `Environment`), so a typo in `extensionOptions.deplyo` is a type error rather than a silent no-op.
- **Whether a deploy record should note that the address was a default**, so a later run with the default off does not see a "changed" deployment where nothing changed but the setting.

## Related

./replayable-deploys.md (the other half of what the template tree needs from rocketh).
