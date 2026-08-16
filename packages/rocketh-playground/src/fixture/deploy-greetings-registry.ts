/**
 * The level-1 deploy script: an upgradeable `GreetingsRegistry` behind a proxy, with a
 * deterministic (CREATE2) implementation.
 *
 * It mirrors `template-ethereum-contracts`' `001_deploy_greetings_registry` deliberately,
 * because the point of the widget is that the reader watches the SAME script a real project
 * ships, not a demo written to succeed.
 *
 * NOTE, and deliberately NOT "fixed": `prefix` is passed as a CONSTRUCTOR argument and no
 * `execute: 'init'` is given to `deployViaProxy`. A constructor runs against the
 * IMPLEMENTATION's storage, never the proxy's, so the proxy's own `prefix` slot is never
 * written and messages read back WITHOUT the `proxy:` prefix. That is a genuine proxy footgun
 * and it is worth a tutorial step of its own, so the script keeps the behaviour rather than
 * quietly correcting it.
 */
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';
import * as readExecuteExtension from '@rocketh/read-execute';
import {setupDeployScripts} from 'rocketh';
import {GreetingsRegistry} from './greetings-registry.artifact.js';

/**
 * The extensions the script needs, spread into one object exactly as a `rocketh/config.ts`
 * does. `withEnvironment` calls every entry as `value(env)`, so this object may hold nothing
 * but curried `(env) => …` functions.
 */
export const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...proxyExtension,
};

const {deployScript} = setupDeployScripts(extensions);

export default deployScript(
	async (env) => {
		const {deployer, admin} = env.namedAccounts;

		// Prepended to every message the registry stores. See the note above for why the
		// reader will NOT see it come back.
		const prefix = 'proxy:';

		const deployment = await env.deployViaProxy(
			'GreetingsRegistry',
			{
				account: deployer,
				artifact: GreetingsRegistry,
				args: [prefix],
			},
			{
				owner: admin,
				linkedData: {prefix, admin},
				// CREATE2, so the implementation lands at the same address on every chain. This
				// is also the step that needs embedded-eth-node >= 0.4.0: an older
				// `eth_estimateGas` reported gas CONSUMED, and the inner CREATE2 reverted.
				deterministicImplementation: true,
			},
		);

		console.log(`GreetingsRegistry proxy deployed at ${deployment.address}`);

		const message = await env.read(deployment, {functionName: 'messages', args: [deployer]});
		console.log(`Current message for deployer: "${message}"`);
	},
	{tags: ['GreetingsRegistry', 'GreetingsRegistry_deploy']},
);
