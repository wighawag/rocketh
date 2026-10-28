# @rocketh/test-utils

Test helpers for writing rocketh extensions. `createTestEnvironment` builds a real rocketh environment over a mock EIP-1193 provider, so a test runs your extension against the production account resolution, impersonation and broadcast paths with no node. There are mock artifacts, a mock provider and scripted prompts too.

To test your own contracts and deploy scripts, run the scripts with `loadAndExecuteDeploymentsFromFiles` instead (see the documentation below).

## Installation

```bash
pnpm add -D @rocketh/test-utils
# or
npm install --save-dev @rocketh/test-utils
```

`rocketh` is a peer dependency.

## Example

```typescript
import {expect, it} from 'vitest';
import {deploy} from '@rocketh/deploy';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

it('deploys', async () => {
	const {env} = await createTestEnvironment({
		accounts: {deployer: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'},
		nodeAccounts: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
	});
	const deployment = await deploy(env)('C', {account: 'deployer', artifact: createMockArtifact('C'), args: [42n]});
	expect(deployment.newlyDeployed).toBe(true);
});
```

## Documentation

- [Testing an extension](https://rocketh.dev/documentation/extending/testing/)
- [Tests with Hardhat fixtures](https://rocketh.dev/hardhat-deploy/tests/)

The whole documentation is at [rocketh.dev](https://rocketh.dev), the hardhat-deploy section at [rocketh.dev/hardhat-deploy](https://rocketh.dev/hardhat-deploy/).

## License

[MIT](https://github.com/wighawag/rocketh/blob/main/LICENSE)
