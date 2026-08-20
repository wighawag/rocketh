# Testing your deploy scripts

The `@rocketh/test-utils` package provides `createTestEnvironment`, an async harness
that constructs a REAL rocketh environment against a mock EIP-1193 provider. It
lets you drive `deploy` / `execute` / read calls end-to-end without a node.

```bash
npm install -D @rocketh/test-utils
```

```typescript
import {describe, it, expect} from 'vitest';
import {deploy} from '@rocketh/deploy';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('MyContract deployment', () => {
	it('deploys with a named account', async () => {
		const {env, provider} = await createTestEnvironment({
			// UserConfig.accounts shape: a numbered index, a private key, a protocol
			//  string like 'privateKey:0x...', a bare address, or a per-network map.
			accounts: {deployer: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'},
			nodeAccounts: ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'],
		});

		const _deploy = deploy(env);
		const artifact = createMockArtifact('MyContract');
		const deployment = await _deploy('MyContract', {
			account: 'deployer',
			artifact,
			args: [],
		});

		expect(deployment.newlyDeployed).toBe(true);
		expect(provider.getRequests().some((r) => r.method === 'eth_sendTransaction')).toBe(true);
	});
});
```

The returned `provider` handle lets you set canned responses (`provider.setResponse`)
and inspect the calls the environment made (`provider.getRequests()`). The
`deploymentStore` is Map-backed and can be reused across two `createTestEnvironment`
calls to assert that deployments persist. The full options — including a partial
`UserConfig` / `ExecutionParams` pass-through, `autoImpersonate`, `autoMine`,
custom signer protocols — are documented in the package source.
