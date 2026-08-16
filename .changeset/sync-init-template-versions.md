---
'hardhat-deploy': patch
---

Point the `hardhat-deploy init` template at current package versions, and keep it there automatically.

The template shipped inside `hardhat-deploy` (`templates/basic/package.json`, what `npx hardhat-deploy init` scaffolds) listed the rocketh packages at ranges nothing kept up to date, so they had drifted many patch releases behind: `rocketh` at `^0.19.4` against a published `0.19.17`, `@rocketh/proxy` at `^0.19.7` against `0.19.21`. They now name the current versions.

Worth being precise about the impact, because it is smaller than it looks and the real risk is elsewhere. Inside one 0.x minor the drift was invisible: `^0.19.4` already resolves to the newest `0.19.x` on the registry, so scaffolded projects were getting up-to-date packages regardless. It would have stopped being invisible at the next MINOR. Once `0.20.0` or `1.0.0` ships, `^0.19.4` refuses it and every newly scaffolded project silently starts on the abandoned line, with `init` still appearing to work perfectly. That is the failure this prevents.

`scripts/sync-template-versions.ts` now rewrites those ranges from the workspace, and it runs as part of `changeset:version`, which is the `version-script` the release workflow already invokes. The template is not a workspace member (`pnpm-workspace.yaml` covers `packages/*` and the template sits a level deeper), so neither pnpm nor changesets was maintaining it and an explicit step was needed. `pnpm sync:template:check` fails on drift if it is ever wanted as a gate.

Ranges are written as `^<version>` rather than `latest` or `*` on purpose: the specifier ends up in the user's own `package.json` permanently, so a floating one would make their project re-resolve differently on every install forever. `^` of the just-released version gives the newest compatible package at scaffold time and a lockfile pins it after that, with no network call during `init` and a set of versions that were released together. `"hardhat-deploy": "workspace:*"` is left alone, since the `init` CLI substitutes that exact sentinel for its own version when copying the template.
