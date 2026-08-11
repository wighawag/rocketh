# pnpm typecheck:tests fails at `npx tsc` bootstrap

Date: 2026-08-11

The second phase of `pnpm typecheck` (script `typecheck:tests` in root
`package.json`) loops `npx tsc --noEmit -p packages/*/tsconfig.test.json`. On a
clean `origin/main` checkout (no local changes) the very first iteration fails
with npm's "This is not the tsc command you are looking for" banner — `npx tsc`
declines to run because TypeScript is not a direct dep of the CWD's manifest.
The first phase (`pnpm -r --parallel exec tsc --noEmit`) and `pnpm build` both
pass. Spotted while completing `broadcast-signer-switch-exhaustiveness-default`;
not fixed (out of scope).
