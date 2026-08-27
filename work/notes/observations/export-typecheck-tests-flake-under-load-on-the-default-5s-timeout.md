---
title: 'The four @rocketh/export "compiles for real consumers" tests run tsc in-process on the default 5s timeout, and time out under load'
type: observation
status: spotted
spotted: 2026-08-27
---

# What happens

The acceptance gate for `execute-guard-storage-kind`, a task touching only `@rocketh/read-execute`, failed with four unrelated reds:

```
FAIL |@rocketh/export| test/export.test.ts > the generated TypeScript compiles for real consumers > ...
Error: Test timed out in 5000ms.
```

One of them reported `8760ms` before the suite gave up.

# Why it is a flake and not a break

Measured on the same machine, unloaded, immediately afterwards: the same four tests pass in **923ms, 923ms, 951ms and 991ms**, and the whole 35-test file runs in 7.94s. So each has roughly five times headroom when the machine is idle, and needs a fivefold slowdown to fail.

They earn that slowdown honestly: each one COMPILES generated TypeScript with tsc in-process, which is CPU-bound and several orders of magnitude heavier than the assertion-only tests around it. The repo-wide `pnpm test` runs every package's suite together, and the acceptance gate runs that immediately after a full `pnpm build`, so the four heaviest tests in the monorepo are competing with everything else at the busiest moment there is. Nothing pins a timeout for them: `packages/rocketh-export/vitest.config.ts` sets none, so they inherit vitest's 5s default.

# Why it matters beyond one bounce

The failure lands on whichever task happens to be in the gate, and it names a package that task never touched. The first reading is always "did my change break export?", and answering that costs a local re-run at minimum. It is also self-reinforcing: the busier the machine, the likelier the bounce, and a bounce leads to a re-run, which is more load.

# Where a fix would go

- **Pin a generous `testTimeout` on these four** (or on the describe block, or on the file), since their cost is inherent and known rather than accidental. A tsc compilation is not a 5-second-class operation.
- Or **move them out of the default suite** into a slower lane that does not run shoulder to shoulder with the fast unit tests.

Raising the global default is the one thing not to do: the 5s default is doing useful work everywhere else.
