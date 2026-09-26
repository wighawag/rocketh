# Security Policy

## Reporting a vulnerability

Report privately through GitHub: **[open a security advisory](https://github.com/wighawag/rocketh/security/advisories/new)**.

Please do not open a public issue, a pull request or a discussion for something that could be used against a live deployment before there is a fix.

If you cannot use that form, email **wighawag@gmail.com** with `rocketh security` in the subject. Plain email is not confidential, so if the details are dangerous on their own, send a message that says only which package is affected and ask for a private channel before sending the rest.

A useful report says which package and version, what an attacker or an unlucky operator gets out of it, and the shortest path you know that reproduces it. A failing test against this repository is the fastest possible version of that, and `@rocketh/test-utils` builds a real environment against a mock provider, so most paths can be reproduced without a node.

This project is maintained by one person. You will get an acknowledgement and an honest assessment rather than a service-level guarantee, and a fix will be published as a normal release with the advisory once it is out.

There is no bug bounty; nothing here is funded that way. Reporters are credited in the advisory under whatever name they give, unless they ask not to be. If you intend to publish on your own schedule, say so in the first message and the fix will be worked to that date where it is possible at all: a date known in advance is far better handled than one discovered on the day.

## What this project is, for the purpose of a threat model

Rocketh is deployment ORCHESTRATION. It constructs transactions, records what it deployed, and refuses to repeat work that is already done. It is not, and should not be made into, the authority that AUTHORIZES a privileged change to a live contract.

That distinction decides what counts as a vulnerability here. A path through which rocketh silently does something OTHER than what the script asked for is a vulnerability. A path through which a deploy script that already holds an admin key does something bad with it is the deployment environment's design, not a flaw in the tool, and the answer to it is in [Production hardening](./documentation/production-hardening/index.md): keep the signing authority outside the process.

## Trust boundaries

The parts, what crosses between them, and which side is trusted. TRUSTED here means rocketh does not defend against it: a report that one of these can be abused from the trusted side is a report about the boundary, not about the code.

- **The deploy script → rocketh.** Not a boundary. A deploy script is developer-authored TypeScript that the executor runs in the same process as rocketh and every dependency the project has, so it can already do anything the process can. This is the first accepted property below, and it is why "a script could call X" is never the finding.
- **rocketh → the transaction it broadcasts.** This IS the boundary that matters, and it carries INTENT: what the script asked for must equal what leaves the process. A divergence here is the vulnerability class named above. Everything else on this list is a boundary rocketh observes; this is the one it is responsible for.
- **rocketh → the EIP-1193 provider and the RPC endpoint.** Off-process and across a network, trusted for NEITHER truth nor confidentiality. Two answers from it are load-bearing anyway: `eth_chainId` decides which chain the run believes it is on, and `eth_accounts` decides which accounts the node claims to hold, which feeds signability. A receipt says a transaction was mined, not that the intended state transition happened, which is why Production hardening says to read the chain again afterwards.
- **rocketh → the signing authority.** The boundary MOVES with the signer variant, and that is the whole point of the distinction in `CONTEXT.md`. With `signerOnly` rocketh holds signing material in-process, so the process boundary is the key boundary. With `wallet` or `remote` the approval happens on the other side and rocketh only proposes: it builds the transaction and someone else decides. An account rocketh cannot sign for at all is the unknown-signer path, and keeping privileged accounts on that side is the recommendation in [Production hardening](./documentation/production-hardening/index.md).
- **Deployment records, artifacts and config on disk → rocketh.** Trusted local input, deliberately. Records are read back for idempotency and an address in one becomes the target of the next upgrade and reaches the frontend through the export; artifacts are the project's own compiler output. The defence is review and a protected branch, not parsing, which is the last accepted property below.
- **The vendored Solidity → every user.** Different from the above, because it ships from HERE rather than from the user's project: the sources under `packages/rocketh-diamond/` and `packages/rocketh-proxy/` determine the code of the default proxy and diamond contracts everywhere. `pnpm verify:artifacts` keeps the committed artifacts equal to a rebuild of those sources, and this is in scope below.
- **`@rocketh/verifier` → Etherscan, Blockscout, Sourcify.** Outbound. It sends contract source and metadata, plus `ETHERSCAN_API_KEY` from the environment where one is configured: source that was going to be public, and a key that was not. Their answers decide only what rocketh REPORTS about verification; no deployment depends on them.
- **The npm registry → the user, and back.** The distribution boundary. Outbound is covered under "Verifying what you install" below. Inbound is the dependency tree, governed by `pnpm-workspace.yaml`: `minimumReleaseAge`, `trustPolicy: no-downgrade`, `blockExoticSubdeps` and `strictDepBuilds`, each with its reasoning inline there.
- **CI → the registry.** The publishing boundary, and the smallest one: `.github/workflows/release.yml` is the only workflow that publishes, it holds no long-lived npm credential, and it authenticates through trusted publishing over OIDC. What to do when this boundary is the one that failed is below.

## In scope

- The packages published from this repository (`rocketh`, `@rocketh/*`, `hardhat-deploy`).
- The Solidity vendored under `packages/rocketh-diamond/` and `packages/rocketh-proxy/`, and the bundled artifacts generated from it. These determine the addresses and the code of the default diamond and proxy contracts, and `pnpm verify:artifacts` in CI is what keeps the committed artifacts equal to a rebuild of those sources.
- The release pipeline in `.github/workflows/release.yml`, which publishes to npm through trusted publishing (OIDC, no long-lived token) with provenance.

## Out of scope

Report these as ordinary issues, or not at all.

- **The documentation site** (`rocketh.dev`, built from `docs/` and published to GitHub Pages by `.github/workflows/deploy.yml`). It is static, has no accounts, no backend and no data to reach. Wrong or dangerous ADVICE on it is in scope, because someone will follow it; report that as a normal issue unless it discloses something not yet fixed.
- **`demoes/`.** Example repositories, published nowhere, meant to be read and run by hand.
- **Advisories in third-party dependencies**, on their own. Dependabot alerts cover the tree, the security floors are pinned in `overrides:` in `pnpm-workspace.yaml`, and `minimumReleaseAge` there keeps an install off a release less than a week old. What IS in scope is a dependency advisory that rocketh's own usage makes reachable: name the call path.
- **Anything that presupposes control of the operator's machine**, their shell, their deploy scripts, their config or their `node_modules`. At that point the private key is the smaller problem, and see the first accepted property below.

## Already known, documented, and not a report

These are accepted properties with their reasoning recorded. A report that one of them exists will be closed as known; a report that one of them is WORSE than documented is very welcome.

- **A deploy script is arbitrary code.** Running someone else's deployment repository executes their scripts, their config and their dependencies.
- **`catchUnknownSigner` catches what rocketh cannot sign, and does not prevent an account it CAN sign for from broadcasting.** See the documentation section above.
- **The interactive pasted-transaction check ranks evidence, it does not prove intent.** It accepts a transaction that is the requested one, one sent to the account rocketh needed to act as, or one carrying rocketh's calldata inside its input; when nothing links the two it asks rather than refuses, because governance executed by proposal id genuinely carries no trace of the payload. No wallet ABI is decoded, so an operator who confirms the wrong transaction is believed.
- **The unknown-signer policy frame is dynamic scope over a sequential run.** Running two actions concurrently inside one wrapper leaks the frame between them (ADR 0006).
- **The playground executes real deploy scripts in the reader's browser, by design.** `@rocketh/playground` boots an in-memory EVM in the tab and runs the actual `@rocketh/deploy` and `@rocketh/proxy` code paths. The scripts it runs are FIXED and bundled from `packages/rocketh-playground/src/fixture/`: there is no editor and no reader-supplied code is evaluated, no network is contacted and no key of the reader's is ever in reach. A path that gets reader-controlled input into that execution, or out of the widget's shadow root into the host page, would be a real finding and is not this.
- **`linkedData` is public.** It is copied into every export and therefore into the frontend bundle.
- **Deployment records are trusted local input.** Environment names, deployment names and output paths are developer-controlled configuration, not untrusted input.

## What a published advisory from here will contain

The reporting section above says how something gets in. This is what comes back out, so that neither side has to guess. Every advisory published from this repository has five parts, in this order, and the fill-in form is [`docs/advisory-template.md`](./docs/advisory-template.md).

1. **Affected component and versions.** Which package, and the version range, per package.
2. **Mitigating factors.** What has to be true for it to bite: a configuration, a signer variant, a network, an interactive run. Stated before the impact, because for most findings here it is the part that decides whether a reader is affected at all.
3. **Impact.** What an attacker, or an unlucky operator, gets out of it.
4. **Fixed in.** The versions carrying the fix, and what upgrading takes.
5. **Credit.** The reporter's chosen name, unless they asked not to be named.

**A version range PER PACKAGE, because of how this monorepo publishes.** The eighteen packages version independently (`fixed` and `linked` are both empty in `.changeset/config.json`), and versions genuinely diverge. Internal REGULAR dependencies are declared `workspace:*`, which pnpm replaces at publish time with an exact version, so `@rocketh/core` is pinned exactly by nearly every package that depends on it (ADR 0011). Internal PEER dependencies are `workspace:^` and do not force that lockstep. So a flaw in core is a coordinated multi-package release and its advisory lists each affected package with its own fixed version, while a flaw confined to one package is one line.

**CVE policy.** A CVE is requested from the GitHub CNA when a real flaw ships a fix. The advisory is published as soon as the fix is out rather than held for an identifier to arrive, and the CVE is added to the advisory once assigned. A withdrawn report, or a finding that turns out to be one of the accepted properties above, gets no advisory and no CVE.

## Supported versions

Pre-1.0. Fixes go onto the latest published version of the affected package; there are no maintained release branches.

## If the publishing path is compromised

For the case where the maintainer's account, a repository secret or the release pipeline is the thing that went wrong, rather than the code. Written in advance because it is not something anyone composes well under pressure, and kept here rather than in a private document so that it outlives the maintainer's memory of it.

**0. Before anything.** Make coffee. Nothing in the next hour is improved by a fast wrong action, and several of the actions below are hard to undo: npm only allows unpublishing within 72 hours of a release except under narrow conditions, and a revoked trusted publisher has to be re-registered by hand, per package.

**Triage: establish what is actually true.**

1. Compare the versions on npmjs.com against the tags in this repository. A version on the registry with no matching tag and no matching Version Packages commit is the signal that matters.
2. Open the provenance attestation of any suspect version on npmjs.com. It links a published version back to the workflow run that built it, so a version published from somewhere else fails here visibly.
3. Read the recent runs of `release.yml`, then the recent commits on `main`. Publishing only happens when a Version Packages PR merges and removes the changeset files, so an unexplained publish means either a commit you did not make or a workflow you did not run.
4. Check the repository's secrets and deploy keys, and the account's active sessions, tokens and SSH keys. `release.yml` needs no npm credential, but other workflows in this repository do hold secrets.

**Mitigation: stop the bleeding, in this order.**

5. **Revoke the trusted publisher registration** on npmjs.com for the affected packages. This is what actually stops CI publishing, because it is npm's side of the OIDC handshake: with no registration, `changeset publish` from this workflow cannot authenticate. Disabling or deleting `release.yml` alone is weaker, since anyone who can push to `main` can restore it.
6. Disable the `release` workflow too, so a merge to `main` does not re-attempt a publish while you are still working.
7. Remember the local path. `pnpm release` in `package.json` runs `changeset publish` from a developer machine. It is NOT how releases are made here: publishing goes through the workflow over OIDC trusted publishing, so steps 5 and 6 do stop the real path. The script still exists, though, so it remains a path a compromised developer machine could take, and an attacker with the maintainer's logged-in npm session does not need this repository at all. Revoking npm sessions and tokens is therefore part of stopping publishing, not a follow-up to it.
8. Rotate what the repository holds: `ANTHROPIC_API_KEY` and `DORFL_GH_TOKEN` are real secrets on the automation workflows even though the release path has none. `DORFL_GH_TOKEN` is scoped more narrowly than the default `GITHUB_TOKEN`, so it is the smaller blast radius of the two, but rotate it anyway: narrower is not harmless.
9. Only then decide about the packages themselves. Deprecate a malicious version with a message pointing at the advisory; prefer that to unpublishing, which breaks the lockfile of everyone who already resolved it and is mostly unavailable after 72 hours anyway.

**Disclosure.**

10. Publish an advisory in the shape above, with the affected versions named exactly. "Do not install versions X through Y" is the sentence downstream users need first; put it before the explanation.
11. Say plainly what was and was not established. An unexplained publish with no evidence of what it contained should be described that way, not upgraded into a certainty in either direction.
12. Ship a clean version and name it in the advisory. Tell users to check `npm audit signatures` and the provenance attestation rather than asking them to trust the statement.

**Learning.**

13. Write down what the first reliable signal was and how long it took to notice, and add the check that would have produced it sooner.
14. If the path used is not described in the trust boundaries above, add it there. That section, not this runbook, is where the next person looks first.

This is a one-person project, so none of the above assumes a second pair of hands. It does assume access to the npmjs.com account and to this repository's settings. If the compromise is the account itself and neither is reachable, then npm Support and GitHub Support are the only remaining levers: contacting both replaces steps 5 to 8, and everything from step 10 still applies.

## Verifying what you install

Every package is published from this repository's release workflow with npm provenance. `npm audit signatures` (or `pnpm audit signatures`) checks that what you resolved carries a registry signature, and the provenance attestation on npmjs.com links a published version back to the workflow run that built it.

Neither of those says the code is safe. They say it came from here.
