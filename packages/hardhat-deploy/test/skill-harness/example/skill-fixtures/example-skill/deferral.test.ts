/**
 * The throwaway skill's fixture test: it runs the fixture's deploy scripts through the executor
 * driver (`skill-fixtures/_shared/executor.ts`) on the shared node, with `admin` declared as an
 * address the node can neither sign for nor impersonate, and checks what `SKILL.md` claims: the
 * privileged step is DEFERRED (the run throws, nothing is sent for it, the run-once id is not
 * recorded), and a re-run on a node that impersonates the owner finishes the deployment.
 */

import {describe, it, expect} from 'vitest';
import {encodeFunctionData} from 'viem';
import {createMapDeploymentStore} from '@rocketh/test-utils';

import {createNode, sent, NODE_HELD_ACCOUNTS} from '../../../../skill-fixtures/_shared/node.js';
import {executeScripts} from '../../../../skill-fixtures/_shared/executor.js';
import {config, extensions} from './rocketh/config.js';
import {artifacts} from './rocketh/deploy.js';
import registry from './deploy/01_registry.js';
import setValue from './deploy/02_set_value.js';

const scripts = {'01_registry.ts': registry, '02_set_value.ts': setValue};
const DEPLOYER = NODE_HELD_ACCOUNTS[0].toLowerCase();
const ADMIN = config.accounts.admin.toLowerCase();
const SET_VALUE = encodeFunctionData({abi: artifacts.Registry.abi, functionName: 'setValue', args: [42n]});

describe('example-skill: an unsignable owner defers the privileged step', () => {
	it('throws UnknownSignerError for the step, sends nothing for it and records no run-once id', async () => {
		const {provider} = await createNode({accounts: config.accounts});
		const deploymentStore = createMapDeploymentStore();

		await expect(executeScripts({config, extensions, scripts, provider, deploymentStore})).rejects.toMatchObject({
			name: 'UnknownSignerError',
			data: {from: expect.stringMatching(new RegExp(ADMIN, 'i')), data: SET_VALUE},
		});
		// only the Registry deployment was sent
		expect(sent(provider)).toEqual([expect.objectContaining({from: DEPLOYER, to: undefined})]);

		// the deferred step did not happen: on a node that impersonates the owner (a fork
		// rehearsal), the re-run sends it, skips the deployment it already has, and records the id
		const {provider: later} = await createNode({accounts: config.accounts, impersonable: [ADMIN]});
		const env = await executeScripts({
			config,
			extensions,
			scripts,
			provider: later,
			deploymentStore,
			autoImpersonate: true,
		});
		expect(sent(later)).toEqual([{from: ADMIN, to: env.get('Registry').address.toLowerCase(), data: SET_VALUE}]);
		expect(env.hasMigrationBeenDone('set_value')).toBe(true);
	});
});
