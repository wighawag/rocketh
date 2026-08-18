---
'hardhat-deploy': patch
---

Remove the `postinstall` script. Installing this package no longer runs code in your project.

The script existed to catch a v1 user who installed v2 by accident: it ran `hardhat --version`, read `hardhat.config.*` looking for `namedAccounts`, `require('hardhat-deploy')` and `module.exports`, printed a migration notice, and wrote a `.hardhat-deploy-v2-notice` marker file into the project root. The intent was good and the mechanism was the wrong one.

**It executed a binary from the project's `PATH` at install time, and wrote a file into a repository, for a warning.** A dependency lifecycle script is the classic arbitrary-code-execution surface of an install, and this project's own guidance (and its own `pnpm-workspace.yaml`, which sets `strictDepBuilds` and denies every build script in the tree) is that they should be reviewed and refused by default. Shipping one meant every hardened consumer had to make a review decision about `hardhat-deploy`, and get nothing for it.

**And for most users it never ran.** pnpm 10 does not run dependency lifecycle scripts unless the package is explicitly allowed, so the notice was silent for exactly the audience most likely to be doing a careful install. The trust cost was paid in full; the benefit was not.

Nothing is lost that was not already covered:

- `peerDependencies` declares `hardhat: ^3.6.0`, so installing v2 into a hardhat 2 project is reported by the package manager itself, at install time, with no code execution.
- The CommonJS entry (`require('hardhat-deploy')`, which is what a v1 config does) still prints the migration message when it is loaded, and that check has the advantage of firing when the mistake is actually made rather than when a package is installed.
- The migration guide is unchanged: <https://rocketh.dev/hardhat-deploy/documentation/how-to/migration-from-v1.html>
