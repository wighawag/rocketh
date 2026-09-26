---
title: 'Export (and verify, doc) after a deploy run, possibly through a single @rocketh/cli package'
slug: export-after-deploy-and-a-rocketh-cli-package
---

# Export after a deploy run, and where the command should live

hardhat-deploy v1 could write the frontend export at the end of the deploy run (`deploy --export <file>` / `--export-all <file>`, v1 tag v1.0.4 `src/index.ts:623-624`). rocketh cannot today, from either entry point: the `rocketh` CLI has no such option (`packages/rocketh-node/src/cli-options.ts`), and the hardhat plugin carries only a placeholder (`// TODO? export?: string;`, `packages/hardhat-deploy/src/tasks/deploy.ts:18`). A project runs two commands instead: `rocketh deploy ... && rocketh-export ...`.

This was staged as a task scoped to the hardhat plugin only (`work/tasks/cancelled/export-as-part-of-the-deploy-run.md`) and parked here, because the open questions are about design rather than build.

## Why the standalone CLI cannot simply import the exporter

The `rocketh` binary lives in `@rocketh/node`. `@rocketh/export` depends on `@rocketh/node` (a peer dependency): its library imports `loadDeploymentsFromFiles` (a one-line wrapper over rocketh's `loadDeploymentsFromStore` with the node filesystem store) and its CLI imports `readAndResolveConfig`. So `@rocketh/node` importing `@rocketh/export` closes a cycle in the nx project graph, which fails `pnpm build` (the same constraint `CONTEXT.md` records for `@rocketh/test-utils`). `@rocketh/verifier` and `@rocketh/doc` have the same shape: each depends on `@rocketh/node` and ships its own bin (`rocketh-verify`, `rocketh-doc`).

## Options

1. **Hardhat plugin only**, as the parked task specified. Cheapest, but the two entry points diverge, and `hardhat-deploy` gains `@rocketh/export` as a dependency (ask-first under `AGENTS.md`; regular dependency or optional peer was an open question).
2. **Both entry points invoke the installed `rocketh-export` bin after a successful run.** No build-graph dependency, so no cycle; export stays an optional install with a clear error when absent. Costs a child process and locating the bin; must be checked that however the bin is located does not register as an nx dependency.
3. **A `@rocketh/cli` package that owns the `rocketh` command.** It depends on `@rocketh/node`, `@rocketh/export`, `@rocketh/verifier` and `@rocketh/doc`, and exposes them as one command (`rocketh deploy --export ...`, and possibly `rocketh export` / `rocketh verify` / `rocketh doc` subcommands). `@rocketh/node` becomes a library with no bin, which removes the cycle structurally instead of routing around it. Things to weigh:
   - Moving the `rocketh` bin out of `@rocketh/node` breaks every project that invokes the `rocketh` command. It does NOT touch the library surface: the getting-started README and the `hardhat-deploy` init template install `@rocketh/node` but use it as a library (`setupEnvironmentFromFiles`) and deploy through `hardhat deploy`. A transition (keep a forwarding bin in `@rocketh/node` for a while) softens the break for CLI users.
   - A CLI-only user would install the verifier and doc generator too, unless those stay optional peers the CLI loads on demand (which reintroduces option 2's question for them).
   - A brand-new package cannot be first-published by CI: it needs a manual `npm publish` and a trusted-publisher registration (`CONTEXT.md`, changesets conventions).

## Open questions

- Is an export option worth having at all? The case for it is v1 parity and one-command pipelines. The case against: a `package.json` script already chains the two commands, and in the hardhat plugin it adds a dependency for a convenience. If nobody migrating asks for it, the two-command answer may be the right one, documented in the migration capability map.
- If it is worth having, is it worth a `@rocketh/cli` package (option 3), which pays off beyond export (one command for deploy, export, verify, doc), or is option 2 enough?
- Whichever is chosen, both entry points should behave the same way; the rules the parked task already fixed still apply: export only after a SUCCESSFUL run, refuse on an in-memory or fork run (nothing saved to export), and surface `@rocketh/export`'s own refusals unchanged.
