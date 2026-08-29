---
---

Pin a 60s timeout on the four `@rocketh/export` tests that compile the generated TypeScript with tsc, which are the heaviest tests in the monorepo and were inheriting vitest's 5s default. Idle they take about a second each, but under the repo-wide `pnpm test` they compete with 90-odd other test files immediately after a full build and have been measured at 6186ms and 6670ms, so they timed out and failed acceptance gates for tasks that never touched this package (six times in one six-task drive). The budget is pinned on the suite that earns it rather than raised globally, so every other test keeps the 5s default. Test-only change; no package code and no behaviour changes.
