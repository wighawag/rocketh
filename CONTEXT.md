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
- **signer** — what a resolved account signs with. The `Signer` union (`@rocketh/core/types`) has THREE variants and they are easy to get backwards, so they are pinned here: `signerOnly` = we hold signing material and sign LOCALLY (`eth_signTransaction` then `eth_sendRawTransaction`) — `privateKey` (`@rocketh/signer`) is the only protocol implemented in this repo and it returns this, and any user-supplied protocol exposing `eth_signTransaction` (a hardware wallet, an HSM) should too; `wallet` = an external wallet provider signs on the user's behalf (browser/injected); `remote` = the node/provider signs. Broadcast routes `wallet` and `remote` to `eth_sendTransaction`, and `signerOnly` to sign-then-send-raw. Note nothing in the repo currently CONSTRUCTS `wallet`; it exists for browser providers. Do not treat `wallet` as "the local signing one" — that is `signerOnly`.
- **signability** — whether rocketh can actually get a transaction signed for an address, which is NOT the same as having an entry in `addressSigners`: a named account declared as a bare address resolves to a `remote` signer whether or not the node knows it. Signability derives from the signer variant plus node state: signs without the node (`signerOnly` or `wallet`), node-held (`remote` and present in `eth_accounts`), impersonated (`remote`, absent from `eth_accounts`, impersonation succeeded), or unsignable (everything else). An unsignable `from` is what the unknown-signer seam exists for. Note `addressSigners` is keyed by LOWERCASED address (fixed in `09ea46d`), while the address values in `namedAccounts`/`unnamedAccounts` are deliberately left as resolved, because they are user-visible and reach deployment records and frontend exports.
- **artifact** — compiled-contract metadata (ABI + bytecode) a deployment is built from; merged/typed via `@rocketh/core` utilities and `abitype`.
- **test environment** vs **mock environment** — a _test environment_ (`createTestEnvironment`, `@rocketh/test-utils`) is a REAL environment from `createEnvironment` wired to a mock EIP-1193 provider, so a test exercises production account resolution, impersonation and the broadcast choke point. A _mock environment_ (`createMockEnvironment`) WAS the legacy fabricated stand-in that reimplemented the broadcast path and therefore never executed the real environment module; every caller was migrated off it and it has been REMOVED. The distinction is kept here so the two notions are not re-forked: there is now exactly one test-environment builder per side of the dependency edge, and neither fabricates an `Environment`. **Two homes, by design:** extension packages use the shared harness from `@rocketh/test-utils`, while `rocketh`'s OWN tests build a real environment locally (see `packages/rocketh/test/`), because `@rocketh/test-utils` depends on `rocketh` and the reverse edge would close an nx project-graph cycle that fails `pnpm build`. Do not reintroduce a second FABRICATED environment; two real-environment builders on opposite sides of that dependency edge is the intended shape.

- **extension** — a package whose root exports curried `(env) => …` functions that `withEnvironment` turns into methods on the environment a deploy script receives, so a script writes `deploy(...)` / `catchUnknownSigner(...)` with no `env` to thread. The user idiom is a namespace spread into `extensions` in `rocketh/config.ts`. The root surface may hold NOTHING but those curried functions (see `AGENTS.md`): every entry is called as `value(env)`, so a class throws and a constant becomes a self-returning getter, both only at deploy-script run time. Non-function exports go on a subpath.
- **executor adapter** — a runtime that supplies environment capabilities: `@rocketh/node` (filesystem) vs `@rocketh/web` (browser). Deployment logic stays adapter-agnostic.
- **proxy / diamond** — upgradeable-contract patterns: ERC1967/UUPS/Transparent/ERC173 proxies (`@rocketh/proxy`) and EIP-2535 Diamonds (`@rocketh/diamond`).
- **work/ contract** — the on-disk system this repo uses, defined by the reference docs in **`work/protocol/`** (copied here by `setup`): `WORK-CONTRACT.md` (the contract), `CLAIM-PROTOCOL.md`, `REVIEW-PROTOCOL.md`, `SURFACE-PROTOCOL.md`, `TASKING-PROTOCOL.md`, `task-template.md`, `spec-template.md`, `ADR-FORMAT.md`. Three REGIME umbrellas — `notes/` (capture buckets), `tasks/` (the build board: `backlog` staging, `ready` pool, `done`, `cancelled`), `specs/` (spec lifecycle: `proposed`, `ready`, `tasked`, `dropped`) — plus top-level `questions/` and `protocol/`. One markdown file per item, status = the folder it lives in (never a field). Capture buckets: `notes/ideas/` (proposed), `notes/observations/` (spotted, unverified, append-only), `notes/findings/` (verified external/domain ground truth, each with a `source:`). ADRs (`docs/adr/`, format in `work/protocol/ADR-FORMAT.md`) record what WE decided and why.

## Architecture shape

- **Package dependency flow:** `rocketh-core` (types/utilities) → `rocketh` (environment + executor) → `@rocketh/deploy` (basic deployment) → `@rocketh/proxy`, `@rocketh/diamond` (advanced patterns) → `@rocketh/node` (filesystem). See `AGENTS.md` for the full package list and conventions.
- **Patterns:** functional + curried (no classes — `docs/adr/0001-curried-functional-api.md`); ESM with `.js`-extensioned relative imports; `viem` for Ethereum utilities; `abitype`/`Abi` for ABI typing; `eip-1193` provider types; `named-logs` for logging.

## Buckets this repo uses

- `work/specs/` — product framing for coherent multi-task efforts (e.g. tag-tracking + selective-reset).
- `work/notes/ideas/` — proposed wishes / sketches, including ones blocked on external tooling.
- `work/notes/observations/` — spotted-but-unverified concerns (e.g. from code reviews) about _our own_ code.
- `work/notes/findings/` — reserved for verified **external** ground truth (third-party APIs, EIPs, wire formats), each with a `source:`. (Our own architecture lives here in `CONTEXT.md`, not in `findings/`.)
- `docs/adr/` — decisions WE made and why (the folder is the index; e.g. the curried API, browser-capable core, vendored v1 proxy artifacts, non-strict matching, and modular-packages decisions all live here).

## Conventions

Standing per-change rules agents must follow in this repo.

- **Every change requires a changeset.** Do **not** run `pnpm changeset` (it is interactive and will hang an unattended agent). Instead, **write the file directly**: create `.changeset/<short-slug>.md` with YAML frontmatter listing each changed package and its semver bump, followed by a one-line summary:

  ```md
  ---
  'rocketh': patch
  '@rocketh/deploy': minor
  ---

  Summary of the change.
  ```

  Use `patch` for fixes, `minor` for backwards-compatible features, `major` for breaking changes (flag a breaking change for human confirmation rather than deciding it alone). If the change touches a package but should **not** trigger a release (docs, internal refactor), write an **empty changeset** — the same file with empty frontmatter (`---` then `---`) and a summary. This is enforced by the `verify` gate (`changeset status --since=main` fails when packages changed but no changeset was added).

## Skills this repo uses

- Required: `setup` (onboarding/migration), `to-spec`, `to-task`.
- Recommended: `review`, `grill-me`.
