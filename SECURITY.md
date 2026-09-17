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

That distinction decides what counts as a vulnerability here. A path through which rocketh silently does something OTHER than what the script asked for is a vulnerability. A path through which a deploy script that already holds an admin key does something bad with it is the deployment environment's design, not a flaw in the tool, and the answer to it is in [Production hardening](./documentation.md#production-hardening): keep the signing authority outside the process.

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

## Supported versions

Pre-1.0. Fixes go onto the latest published version of the affected package; there are no maintained release branches.

## Verifying what you install

Every package is published from this repository's release workflow with npm provenance. `npm audit signatures` (or `pnpm audit signatures`) checks that what you resolved carries a registry signature, and the provenance attestation on npmjs.com links a published version back to the workflow run that built it.

Neither of those says the code is safe. They say it came from here.
