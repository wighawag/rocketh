---
'hardhat-deploy': patch
---

`hardhat-deploy init` now works with pnpm 11. pnpm 11 stops an install at `ERR_PNPM_IGNORED_BUILDS` until each dependency's build script is allowed or denied in `pnpm-workspace.yaml`, so `init --install` (and a `pnpm install` run by hand afterwards) failed for every pnpm 11 user. The scaffolded project now ships a `pnpm-workspace.yaml` that denies the two it pulls in (esbuild and @parcel/watcher, neither of which needs its script), and `--install` no longer passes `--ignore-workspace`, which made pnpm ignore that file. The file also makes the project a workspace root of its own, which is what keeps it out of a parent workspace.
