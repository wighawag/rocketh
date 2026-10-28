---
title: 'The sharing guide does not say that a published contracts package must declare what its compiled scripts import as dependencies'
type: observation
status: spotted
spotted: 2026-10-28
---

# What was seen

Seen in template-ethereum-contracts while bringing its `examples/deploy-export` and `examples/deploy-import` branches up to date (wighawag/template-ethereum-contracts#28 and #29), by installing the packed package into another project; not checked against rocketh's own packages.

The template's contracts package exports its compiled deploy scripts and `rocketh` folder, which import `rocketh`, `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/read-execute`, `@rocketh/signer`, `@rocketh/unknown-signer` and `@rocketh/viem` (whose peer is `viem`). It lists all of them as `devDependencies`. Installed from its tarball into a project with pnpm hoisting off, running the imported deploy script fails with `Cannot find package '@rocketh/signer'`. With normal hoisting it works only because the consuming project happens to have the same packages. Declaring them as `dependencies` of the published package fixes it.

# Why it matters

"Share contracts between projects" (`documentation/sharing-contracts/index.md`, "Publishing a contracts project") tells a project to export its compiled deploy scripts and `rocketh` folder, and shows the `exports` and `files` fields, but says nothing about how to declare what those compiled files import. A project following it publishes a package that breaks for some consumers and works for others by accident.

# Not done here

No page was changed. Open: whether `rocketh` itself should be a `peerDependency` of such a package (the environment the scripts receive comes from the consumer's rocketh) while the extensions stay `dependencies`, and what the page should recommend.
