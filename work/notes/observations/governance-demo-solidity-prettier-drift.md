# Governance demo Solidity files fail the demo's own prettier check

2026-09-25. Running `npx prettier --check .` inside `demoes/hardhat-deploy/governance/` warns on `src/governance/Registrar.sol` and `src/governance/SimpleMultisig.sol` (pre-existing, reproduced on the unmodified tree). The repo-root `pnpm format:check` passes, so nothing gates it; the demo's own `pnpm format:check` would fail.
