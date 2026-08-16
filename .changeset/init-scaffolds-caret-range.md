---
'hardhat-deploy': patch
---

`hardhat-deploy init` now scaffolds `hardhat-deploy` as a `^` range rather than an exact pin.

The `init` CLI substitutes the template's `"hardhat-deploy": "workspace:*"` sentinel for its own version when it copies the project, and it wrote that version bare. A project scaffolded by `2.0.22` therefore got `"hardhat-deploy": "2.0.22"`, pinned exactly and refusing every later patch, so it silently stayed on whichever CLI version happened to create it until someone edited the range by hand. It now writes `^2.0.22`, matching how the template already declares the rocketh packages.

This affects newly scaffolded projects only. An existing project keeps whatever its `package.json` already says, and can widen the pin itself.
