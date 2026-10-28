<div align="center">
<img alt="hardhat-deploy logo" src="https://rocketh.dev/hardhat-deploy-logo.svg" width="100"/><br/>
  <a href="https://rocketh.dev/hardhat-deploy/">hardhat-deploy</a>
<hr/>

<!-- <a href="https://npmjs.com/package/hardhat-deploy"><img alt="Version" src="https://img.shields.io/npm/v/hardhat-deploy" /></a> -->

<a href="https://github.com/wighawag/hardhat-deploy/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/wighawag/hardhat-deploy" /></a>
<a href="https://npmjs.com/package/hardhat-deploy"><img src="https://img.shields.io/npm/dw/hardhat-deploy" alt="weekly downloads" /></a>
<a href="https://npmjs.com/package/hardhat-deploy"><img alt="Dependents" src="https://img.shields.io/librariesio/dependents/npm/hardhat-deploy" /></a>

<!-- <a href="https://github.com/wighawag/hardhat-deploy/stargazers"><img alt="Github Stars" src="https://img.shields.io/github/stars/wighawag/hardhat-deploy" /></a> -->
<!-- <a href="https://npmjs.com/package/hardhat-deploy"><img alt="Node Version" src="https://img.shields.io/node/v/hardhat-deploy"></a> -->

<a href="https://github.com/wighawag/hardhat-deploy/issues"><img alt="Issues and PRs" src="https://img.shields.io/github/issues-pr/wighawag/hardhat-deploy" /></a>
<a href="https://github.com/wighawag/hardhat-deploy/actions"><img alt="Tests Status" src="https://img.shields.io/github/actions/workflow/status/wighawag/hardhat-deploy/test.yml?label=test" /></a>
<a href="https://github.com/wighawag/hardhat-deploy/commits/main/"><img alt="Commit activity" src="https://img.shields.io/github/commit-activity/w/wighawag/hardhat-deploy" /></a>
<a href="https://github.com/wighawag/hardhat-deploy/commits/main/"><img alt="Last commit" src="https://img.shields.io/github/last-commit/wighawag/hardhat-deploy" /></a>

<!-- <a href="https://npmjs.com/package/hardhat-deploy"><img alt="dependencies status" src="https://img.shields.io/librariesio/release/npm/hardhat-deploy" /></a>-->

</div>

<h1>hardhat-deploy</h1>

_A [Hardhat](https://hardhat.org) Plugin For Replicable Deployments And Easy Testing_

> **Note: This is the documentation for hardhat-deploy v2 that works with [hardhat v3](https://hardhat.org/docs)**
>
> Documentation for hardhat-deploy v1 can be found on the [v1 branch](https://github.com/wighawag/hardhat-deploy/tree/v1#readme)

## What it is

hardhat-deploy runs [rocketh](https://github.com/wighawag/rocketh) inside Hardhat 3. You write deploy scripts in your project's `deploy` folder, `hardhat deploy --network <name>` runs them and records what they deployed, and your tests run the same scripts as a fixture, so they test the contracts as deployed. Accounts are named (`deployer`, `admin`) per network instead of indexed, proxies and diamonds are declared and upgraded by re-running the script, and a proxy owned by a Safe is upgraded through the Safe, rehearsed on a fork first.

## Getting started

```bash
pnpm dlx hardhat-deploy init --install my-project
cd my-project
pnpm hardhat compile
pnpm hardhat deploy
```

or add it to a Hardhat 3 project: [Get started with hardhat-deploy](https://rocketh.dev/hardhat-deploy/getting-started/). For a complete project (a monorepo with watchers, verification, export and a slot for a frontend), start from [template-ethereum-contracts](https://github.com/wighawag/template-ethereum-contracts).

## A deploy script

```typescript
// deploy/001_deploy_greetings_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deployViaProxy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
			{owner: admin, execute: {init: {methodName: 'init', args: ['hello: ']}}},
		);
	},
	{tags: ['GreetingsRegistry']},
);
```

Run it again after changing `GreetingsRegistry` and the proxy is upgraded in place; run it unchanged and nothing is sent.

## What it gives you

- Deploy scripts with tags and dependencies, re-runnable by design ([Deploy scripts](https://rocketh.dev/documentation/deploy-scripts/))
- Named accounts per network, and signers from the environment ([Named accounts](https://rocketh.dev/documentation/named-accounts/))
- Proxies, diamonds, routers and deterministic addresses, declared ([Proxies](https://rocketh.dev/documentation/proxies/))
- Your deploy scripts as test fixtures ([Tests](https://rocketh.dev/hardhat-deploy/tests/))
- Fork rehearsals with `HARDHAT_FORK`, and Safe-owned upgrades end to end ([A Safe-owned project](https://rocketh.dev/documentation/safe-owned-project/))
- Typed artifacts from every compilation, and networks from environment variables ([Typed artifacts](https://rocketh.dev/hardhat-deploy/typed-artifacts/), [Networks](https://rocketh.dev/hardhat-deploy/networks/))
- Export for a frontend, verification, documentation ([Export, verify and document](https://rocketh.dev/documentation/exporting-and-verifying/))
- Hot Contract Replacement while you develop ([Development workflow](https://rocketh.dev/hardhat-deploy/development-workflow/))

## Documentation

The documentation is at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/), with a numbered path from setup to production.

Coming from v1? [What changed](https://rocketh.dev/hardhat-deploy/migration/) says what v2 does differently or does not do, and [the step-by-step migration](https://rocketh.dev/hardhat-deploy/migration/step-by-step/) walks a project through the port. To have an AI assistant do the port, give it [the migration skill](https://github.com/wighawag/rocketh/blob/main/skills/hardhat-deploy-migration/SKILL.md).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)

## Sponsor

If you find this project useful, please consider sponsoring it! Your support helps me continue developing and maintaining this tool.

<a href="https://github.com/sponsors/wighawag">
  <img src="https://img.shields.io/badge/Sponsor-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Sponsor on GitHub" />
</a>
