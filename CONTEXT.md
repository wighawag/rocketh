# CONTEXT — rocketh domain language

The domain glossary for `rocketh`. Agents and skills use THIS vocabulary when naming modules, tests, and discussing the system. Architectural rationale lives in `docs/adr/` (decisions); product framing lives in `work/prd/`.

## What rocketh is

rocketh is a **framework-agnostic smart-contract deployment system** for Ethereum-compatible networks. It is a pnpm/Nx monorepo of small `@rocketh/*` packages that each extend a core deployment environment with a focused capability (deploy, proxy, diamond, verify, export, doc, …). It powers `hardhat-deploy` v2 under the hood but is deliberately decoupled from any one toolchain, and deploy scripts are written to run anywhere — including in the browser.

## Core domain terms

- **Environment** — the object a deploy script receives; holds named accounts, the deployment store, and the extension functions (`deploy`, `execute`, `read`, …). Created by `createEnvironment`; assembled from extensions via `setupDeployScripts` / `setupEnvironmentFromFiles`.
- **Executor** — drives the run: orders deploy scripts by tags/dependencies, sets per-script context, executes them, and handles `--reset`.
- **Deploy script** — a user file (default export) that performs deployments; declares `tags` and `dependencies` (both tag-based) in its options.
- **Deployment** — the saved record of a deployed contract (address, ABI, receipt, bytecode, args, …), persisted as one JSON file per contract per network.
- **Named accounts** — accounts referenced by name (`deployer`, `admin`) instead of raw address; resolved per-network from config.
- **Tags / dependencies** — a deploy script's own declared `tags`, and the tags it depends on. Used to select what runs (`--tags`) and to order execution. (Recording these ON deployments + tag-aware selective reset is the subject of a PRD in `work/prd/`.)
- **Extension** — a package that augments the environment with functions (e.g. `@rocketh/deploy` adds `deploy`; `@rocketh/read-execute` adds `read`/`execute`). Extensions are merged into one object and passed to the setup functions.
- **Proxy / Diamond patterns** — `@rocketh/proxy` (ERC1967, UUPS, Transparent, ERC173) and `@rocketh/diamond` (EIP-2535) add declarative upgradeable-deployment functions.
- **Artifact** — the compiler output (ABI + bytecode + metadata) a deployment is built from; re-exported per-project for easy import.
- **strictBytecodeMatch** — a deploy option controlling whether redeployment detection compares full bytecode strictly or strips the trailing CBOR metadata before comparing (proxies set it `false`).
- **Verifier / Export / Doc** — post-deployment packages: contract verification (Etherscan, Sourcify), exporting deployments for frontends, and generating contract docs.
- **work/ contract** — the on-disk system this repo uses, defined by the reference docs in **`work/protocol/`** (copied here by `setup`): `WORK-CONTRACT.md` (the contract), `CLAIM-PROTOCOL.md`, `slice-template.md`, `prd-template.md`, `ADR-FORMAT.md`. One markdown file per item, status = the folder it lives in (never a field). Capture buckets: `ideas/` (proposed), `observations/` (spotted, unverified, append-only), `findings/` (verified **external** ground truth, each with a `source:`). Our own architecture/vocabulary lives HERE (CONTEXT.md) and in `docs/`, not in `findings/`. ADRs (`docs/adr/`, format in `work/protocol/ADR-FORMAT.md`) record what WE decided and why.

## Buckets this repo currently uses

- `work/prd/` — the **tag-tracking + selective-reset** PRD (from the kilo plan).
- `work/ideas/` — blocked-on-external / exploratory wishes (zksync support, companion-network access).
- `work/observations/` — spotted, unverified concerns distilled from an internal code review (type-safety `any`s, silent catch blocks, missing test coverage, stale docs).
- `findings/` is currently **empty** — it is reserved for verified _external_ ground truth (a third-party API's real behaviour, a wire/artifact format, an EIP/spec), each with a `source:`. It is NOT for descriptions of our own code.
- `docs/adr/` — durable decisions + their _why_. Seeded during migration from the maintainer's answers: `0001` (vendor hardhat-deploy v1 proxy/diamond artifacts), `0002` (CBOR-stripped bytecode comparison + `strictBytecodeMatch`), `0003` (curried functional extension architecture), `0004` (framework-agnostic, browser-capable core).

## Skills this repo uses

- Required: `to-prd`, `to-slices`, `setup`.
- Recommended: `migrate` (convert existing material), `review`, `grill-me`.
