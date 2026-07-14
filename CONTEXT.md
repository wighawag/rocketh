# CONTEXT — rocketh domain language

The domain glossary for `rocketh`. Agents and skills use THIS vocabulary when naming modules, tests, and discussing the system. Architectural rationale lives in `docs/adr/` (decisions); product framing lives in `work/specs/`.

## What rocketh is

Rocketh is a framework-agnostic smart-contract deployment system for Ethereum-compatible networks. A TypeScript ESM monorepo (Nx + pnpm workspaces) of composable packages — `rocketh` (core environment + executor), `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/diamond`, `@rocketh/node`, and others — whose deployment scripts run anywhere, including the browser.

## Core domain terms

- **deployment** — a saved record of a deployed contract (address, ABI, transaction receipt, args, and optionally `tags`/`dependencies`), persisted per environment and tracked across runs for idempotency.
- **deploy script** — a user-authored module that performs deployments; declares `tags` (what it provides) and `dependencies` (tags it needs first). The executor builds a dependency graph from these to order execution.
- **environment** — the per-run context (`Environment`) carrying accounts, network, artifacts, and the `save`/read API. Created by `createEnvironment`; consumed by curried deployment functions like `deploy(env)(...)`.
- **executor** — the engine (`packages/rocketh/src/executor/`) that resolves scripts into a dependency graph, runs them in order, and handles `--reset`/`--tags`.
- **named account** — an account referenced by name (e.g. `deployer`, `admin`) rather than address, resolved per network from config.
- **artifact** — compiled-contract metadata (ABI + bytecode) a deployment is built from; merged/typed via `@rocketh/core` utilities and `abitype`.
- **executor adapter** — a runtime that supplies environment capabilities: `@rocketh/node` (filesystem) vs `@rocketh/web` (browser). Deployment logic stays adapter-agnostic.
- **proxy / diamond** — upgradeable-contract patterns: ERC1967/UUPS/Transparent/ERC173 proxies (`@rocketh/proxy`) and EIP-2535 Diamonds (`@rocketh/diamond`).
- **work/ contract** — the on-disk system this repo uses, defined by the reference docs in **`work/protocol/`** (copied here by `setup`): `WORK-CONTRACT.md` (the contract), `CLAIM-PROTOCOL.md`, `REVIEW-PROTOCOL.md`, `SURFACE-PROTOCOL.md`, `TASKING-PROTOCOL.md`, `task-template.md`, `spec-template.md`, `ADR-FORMAT.md`. Three REGIME umbrellas — `notes/` (capture buckets), `tasks/` (the build board: `backlog` staging, `ready` pool, `done`, `cancelled`), `specs/` (spec lifecycle: `proposed`, `ready`, `tasked`, `dropped`) — plus top-level `questions/` and `protocol/`. One markdown file per item, status = the folder it lives in (never a field). Capture buckets: `notes/ideas/` (proposed), `notes/observations/` (spotted, unverified, append-only), `notes/findings/` (verified external/domain ground truth, each with a `source:`). ADRs (`docs/adr/`, format in `work/protocol/ADR-FORMAT.md`) record what WE decided and why.

## Architecture shape

- **Package dependency flow:** `rocketh-core` (types/utilities) → `rocketh` (environment + executor) → `@rocketh/deploy` (basic deployment) → `@rocketh/proxy`, `@rocketh/diamond` (advanced patterns) → `@rocketh/node` (filesystem). See `AGENTS.md` for the full package list and conventions.
- **Patterns:** functional + curried (no classes — `docs/adr/0001-curried-functional-api.md`); ESM with `.js`-extensioned relative imports; `viem` for Ethereum utilities; `abitype`/`Abi` for ABI typing; `eip-1193` provider types; `named-logs` for logging.

## Buckets this repo uses

- `work/specs/` — product framing for coherent multi-task efforts (e.g. tag-tracking + selective-reset).
- `work/notes/ideas/` — proposed wishes / sketches, including ones blocked on external tooling.
- `work/notes/observations/` — spotted-but-unverified concerns (e.g. from code reviews) about *our own* code.
- `work/notes/findings/` — reserved for verified **external** ground truth (third-party APIs, EIPs, wire formats), each with a `source:`. (Our own architecture lives here in `CONTEXT.md`, not in `findings/`.)
- `docs/adr/` — decisions WE made and why (the folder is the index; e.g. the curried API, browser-capable core, vendored v1 proxy artifacts, non-strict matching, and modular-packages decisions all live here).

## Conventions

Standing per-change rules agents must follow in this repo.

- **Every change requires a changeset.** Do **not** run `pnpm changeset` (it is interactive and will hang an unattended agent). Instead, **write the file directly**: create `.changeset/<short-slug>.md` with YAML frontmatter listing each changed package and its semver bump, followed by a one-line summary:

  ```md
  ---
  "rocketh": patch
  "@rocketh/deploy": minor
  ---

  Summary of the change.
  ```

  Use `patch` for fixes, `minor` for backwards-compatible features, `major` for breaking changes (flag a breaking change for human confirmation rather than deciding it alone). If the change touches a package but should **not** trigger a release (docs, internal refactor), write an **empty changeset** — the same file with empty frontmatter (`---` then `---`) and a summary. This is enforced by the `verify` gate (`changeset status --since=main` fails when packages changed but no changeset was added).

## Skills this repo uses

- Required: `setup` (onboarding/migration), `to-spec`, `to-task`.
- Recommended: `review`, `grill-me`.
