---
'rocketh': patch
---

Document how to run rocketh against something valuable, in one place, and add a security policy.

The operational advice that decides whether a deployment tool is safe to point at mainnet was spread across an ADR, a changeset, three sections of the documentation and a rebuttal in a notes file. A reader with an upgrade to perform had no page to read, so `documentation.md` now has a **Production hardening** section that collects it and says which parts are defaults you should check rather than features you must install:

- keep the signing authority outside the deployment environment, and set `onUnknownSigner: 'throw'` when the run administers something live;
- `catchUnknownSigner` catches what rocketh CANNOT sign, and is not a "never broadcast" switch;
- `autoImpersonate` is off by default and belongs to fork testing, so the thing to check is that it is not switched on for a production chain;
- rehearse on a fork, and read the chain again afterwards, because a successful receipt says a transaction was mined, not that the intended state transition happened;
- read the diamond cut plan, especially the removals, since a declarative selector diff removes by design;
- pass `--verify` on the export that ships, and treat the generated file as a build artifact rather than a record;
- review a deployment-record address change like a code change, and pin the tooling exactly in a repository whose job is to administer live contracts.

`SECURITY.md` gives vulnerability reports a private channel (a GitHub security advisory) and, more usefully, states the boundary that decides what a vulnerability here even is: rocketh silently doing something other than what the script asked for is one, and a deploy script misusing an admin key it was handed is the deployment environment's design. It also lists the accepted, documented properties that are not worth reporting, so a reader can tell the difference between something already known and something new.

Also fixed: the deploy-script example under "Deploying Contracts" still imported from `#rocketh`, the subpath-imports alias that setup no longer uses. It reads `../rocketh/deploy.js`, like every other example on the page.
