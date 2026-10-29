---
name: example-skill
description: A throwaway skill that exists only to prove the skill harness on its own tests (packages/hardhat-deploy/test/skill-harness/). It is not a skill to install.
metadata:
  internal: true
  rocketh: '>=0.26.2'
---

# Example skill

This skill is a test fixture of the skill harness. Every check a user skill passes, it passes: its TypeScript blocks are marked copies of the files under `example-skill/` in the harness's example fixtures, its links resolve to pages of the repository, and its commands take the flags they are given.

## The project

The accounts, with the owner of the Registry declared by address:

<!-- fixture: example-skill/rocketh/config.ts -->

```ts
// rocketh/config.ts
import type {UserConfig} from 'rocketh/types';

import * as deployExtension from '@rocketh/deploy';
import * as readExecuteExtension from '@rocketh/read-execute';

export const config = {
	accounts: {
		deployer: 0,
		// the Registry's owner: a Safe, an account rocketh cannot sign for
		admin: '0x5afe5afe5afe5afe5afe5afe5afe5afe5afe5afe',
	},
	data: {},
} as const satisfies UserConfig;

export const extensions = {
	...deployExtension,
	...readExecuteExtension,
};

export type Extensions = typeof extensions;
export type Accounts = typeof config.accounts;
export type Data = typeof config.data;
```

The deploy scripts read `deployScript` and `artifacts` from `example-skill/rocketh/deploy.ts`, as in a real project.

<!-- fixture: example-skill/deploy/01_registry.ts -->

```ts
// deploy/01_registry.ts
import {deployScript, artifacts} from '../rocketh/deploy.js';

export default deployScript(
	async ({deploy, namedAccounts}) => {
		const {deployer, admin} = namedAccounts;

		await deploy('Registry', {account: deployer, artifact: artifacts.Registry, args: [admin]});
	},
	{tags: ['Registry']},
);
```

## A privileged step from an account rocketh cannot sign for

An unsignable `from` defers the step: it did not happen, and the run stops ([What makes the re-run converge](https://rocketh.dev/documentation/unknown-signers/#what-makes-the-re-run-converge)). See [references/run-once.md](references/run-once.md) for the script.

```bash
npx hardhat --network sepolia deploy --tags Registry
npx hardhat deploy --network sepolia --skip-prompts
pnpm rocketh -e sepolia --on-unknown-signer throw
anvil --fork-url https://example.invalid
```
