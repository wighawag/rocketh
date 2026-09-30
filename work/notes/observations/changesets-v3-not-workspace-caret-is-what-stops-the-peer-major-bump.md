---
title: 'Changesets v3, not the `workspace:^` string, is what stops a 0.x minor from bumping peer-dependents to 1.0.0'
type: observation
status: spotted
spotted: 2026-09-29
---

# What is wrong

Commit `e68fa683` (#127) and the header of `scripts/check-no-major-graduation.ts` explain why a 0.x `minor` no longer pushes peer-dependents to `1.0.0`: "the internal peer ranges are the literal string `workspace:^`, which changesets never evaluates as a semver range, so the out-of-range peer rule cannot fire". The measurement in that commit is right (the peer-dependents do get a plain patch), but the stated cause is not.

# What actually prevents it

- Rocketh moved from `@changesets/cli` `^2.31.0` to `^3.0.0` in `b34e921c` (2026-08-11, the dependency bump), 18 days before `e68fa683`. Rocketh now resolves `@changesets/assemble-release-plan` 7.0.0, whose `dist/index.mjs` has no `shouldBumpMajor` at all: v3 removed the rule that bumps a peer-dependent to major.
- In changesets v2 (`@changesets/assemble-release-plan` 6.0.10), `getDependencyVersionRanges` DOES evaluate `workspace:^`: it becomes `^<the peer's current version>` (for example `^0.11.0`). `shouldBumpMajor` then bumps the dependent to major on any minor or major of its peer, unless `___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH.onlyUpdatePeerDependentsWhenOutOfRange` is set, and even then `^0.11.0` excludes `0.12.0`.
- Measured in wighawag/etherfold on 2026-09-29, still on changesets v2.31.0: `@etherfold/graphql` peers on `@etherfold/browser`, and `changeset version` bumps graphql `0.0.0` to `1.0.0` with the peer as `workspace:*` AND with it as `workspace:^`. Etherfold copied the `workspace:^` fix on the strength of this explanation, and it did not work until changesets itself was upgraded.

# Why it matters here

The explanation invites the wrong conclusion in both directions: that `workspace:^` is load-bearing (it is not, for this; it still matters for publishing a `^x.y.z` peer range instead of an exact pin, as `42d7ff62` says), and that a downgrade or a lockfile resolving changesets v2 would stay safe (it would not). The guard itself is right and is what actually protects a release under either version.

# Suggested correction

Reword the header of `scripts/check-no-major-graduation.ts` and its failure message ("a `minor` on one whose peer range stopped being `workspace:^`") to name changesets v3 as the reason, keep `workspace:^` for the publish-range reason only, and note that staying on `@changesets/cli` >= 3 is what keeps 0.x minors from cascading. The guard stays.
