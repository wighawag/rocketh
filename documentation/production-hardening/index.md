# Production hardening

Everything below is about one question: what stops a mistake, a stale file or a compromised dependency in the deployment environment from becoming a privileged change on a live chain. None of it is exotic, and most of it is a default you should check rather than a feature you must install.

The short version: rocketh is an orchestration layer. Treat it as the thing that CONSTRUCTS and RECORDS operations, and keep the authority that APPROVES them somewhere rocketh cannot reach.

## Keep the signing authority outside the deployment environment

A deploy script runs in a Node process alongside every dependency your project has. Anything in that process can read the environment it runs in, so an admin private key present there is a key that every one of those packages could reach.

For anything privileged (a proxy upgrade, a diamond cut, an ownership transfer, treasury administration) the deployment environment should not be able to sign at all. Use a Safe, a hardware wallet, a governance contract or an HSM as the account, let rocketh build the transaction, and approve it there.

rocketh is built for this: an account it cannot sign for is not an error condition but the expected shape of a privileged call. By default it prints the transaction, waits while you execute it under that authority, takes the hash back and continues the run. See [Handling unknown signers](../unknown-signers/).

For an UNATTENDED privileged run, set `onUnknownSigner: 'throw'` explicitly. `'auto'` (the default) already degrades to `throw` when there is no interactive resolver, but saying it outright is what makes the intent survive a future change to how the run is invoked.

## An unsignable account is what defers, not the wrapper

Whichever workflow you use, what defers a transaction is rocketh being UNABLE to sign for the `from`. It is not a "never broadcast" switch: an account the run CAN sign for still broadcasts, which is what lets a mixed run work, with ordinary deployments proceeding and the one privileged call deferred.

So a run that unexpectedly holds the admin key will send the admin transaction rather than defer it. If that matters, assert it rather than assume it, using the public `env.addressSignability` map shown in [Handling unknown signers](../unknown-signers/#catchunknownsigner-is-not-a-never-send-switch).

## Check `autoImpersonate` is off

`autoImpersonate` is a NODE CAPABILITY switch: it asks the node to sign as an account you do not hold the key for, which only a development node will do. It belongs in fork and local testing, where it is genuinely useful for rehearsing an upgrade as the real admin, and it defaults to **off** for every run except a fork, which turns it on because executing the privileged steps is the point of rehearsing. A run against a production chain is not a fork, so the default there is off.

The thing to check is that it is not switched on for a production chain in a shared config, since an impersonated account is signable and therefore never reaches the unknown-signer path.

## Rehearse on a fork, then verify the chain afterwards

A fork of the real chain at a recent block is the strongest check available before a privileged change, and it is stronger than any assertion about who could have signed: it proves the transaction actually does what you believe against the state that actually exists. Run the same scripts, with `autoImpersonate` on so the admin account can act (it is on by default for a fork run), and check the invariants you care about (ownership, facet mapping, balances, access control). [Rehearsing a deployment on a fork](../fork-runs/) is the how-to, including the one thing to declare so the rehearsal uses the forked network's settings rather than your dev node's.

After execution, read the chain again. A successful receipt says a transaction was mined, not that the intended state transition happened.

## Read the diamond cut plan, especially the removals

A diamond upgrade is declarative: whatever selector is on chain but absent from the declared facet set is REMOVED. That is the model working as designed, and it is also how a typo, a commented-out facet or a half-finished refactor turns into the removal of live functions. The worst case is removing the last path to `diamondCut` itself, which makes the diamond permanently immutable.

Rocketh prints the plan before it executes, with removals in their own block and selectors resolved to signatures where it can name them. It does not refuse anything, because a legitimate upgrade removes functions too. Read that block before approving the transaction, and treat a removal you did not expect as a stop.

## Verify what you export, and treat generated files as build artifacts

`rocketh-export --verify` asks the chain whether the addresses you are about to hand to a frontend are really there, and whether the environment is the network you think it is. It is opt-in so that offline builds keep working, which means the moment it matters is exactly the moment nothing forces you to pass it: add it to the build that ships.

The generated file is derived state. The deployment records are the primary record, and the chain is the authority above both.

## Treat deployment records as security-sensitive configuration

An address in a deployment record ends up in a frontend, in a verification call and in the next upgrade's target. A change to one deserves the same review as a change to contract code: commit them, protect the branch that holds the production environment, and read address changes in the diff rather than scrolling past them.

## Pin the tooling in a deployment repository

In a repository whose job is to administer live contracts, prefer exact versions of `rocketh` and the `@rocketh/*` packages over ranges, and update them in a deliberate pull request where the changelog and the lockfile diff are read. A library caret range is right for a library; it is not right for the thing that constructs your upgrade transactions.

This repository's own supply-chain settings (a release-age floor, a publish-trust policy, refusal of git and tarball dependencies, dependency build scripts denied by default) are in `pnpm-workspace.yaml`, with the reasoning inline, and are a reasonable starting point to copy.

## Do not put secrets in `linkedData`

See [`linkedData` is public](../exporting-and-verifying/#linkeddata-is-public): it is copied into every export and therefore into the bundle you ship.
