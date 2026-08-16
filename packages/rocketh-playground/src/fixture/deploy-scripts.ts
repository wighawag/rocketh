/**
 * The four deploy scripts behind the documentation tutorial.
 *
 * They tell one story: deploy an upgradeable contract, find a bug in it, upgrade to a fixed
 * implementation, and watch what survives. Everything here is an ordinary rocketh deploy
 * script, including the two that only make a call, because that is what deploy scripts really
 * look like.
 */
import * as deployExtension from '@rocketh/deploy';
import * as proxyExtension from '@rocketh/proxy';
import * as readExecuteExtension from '@rocketh/read-execute';
import {setupDeployScripts} from 'rocketh';
import {GreetingsRegistryV2} from './greetings-registry-v2.artifact.js';
import {GreetingsRegistry} from './greetings-registry.artifact.js';

/**
 * The extensions the scripts need, spread into one object exactly as a `rocketh/config.ts`
 * does. `withEnvironment` calls every entry as `value(env)`, so this object may hold nothing
 * but curried `(env) => …` functions.
 */
export const extensions = {
	...deployExtension,
	...readExecuteExtension,
	...proxyExtension,
};

const {deployScript} = setupDeployScripts(extensions);

/** Prepended to greetings, eventually. Getting this to apply is the point of the tutorial. */
const PREFIX = 'proxy:';

/**
 * Step 1. Deploy `GreetingsRegistry` behind a proxy, with a CREATE2 implementation.
 *
 * This is `template-ethereum-contracts`' script, unchanged, including the mistake: `prefix` is
 * passed as a CONSTRUCTOR argument. A constructor runs against the IMPLEMENTATION's storage,
 * never the proxy's, so the proxy's `_prefix` slot is never written. Step 2 shows the damage.
 */
export const deployV1 = deployScript(
	async (env) => {
		const {deployer, admin} = env.namedAccounts;

		const deployment = await env.deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: GreetingsRegistry, args: [PREFIX]},
			{
				owner: admin,
				linkedData: {prefix: PREFIX, admin},
				// CREATE2, so the implementation lands at the same address on every chain. This
				// is also the step that needs embedded-eth-node >= 0.4.0: an older
				// `eth_estimateGas` reported gas CONSUMED, and the inner CREATE2 reverted.
				deterministicImplementation: true,
			},
		);

		console.log(`proxy      -> ${deployment.address}`);
		console.log(`the proxy is what you keep; the implementation behind it is replaceable.`);
	},
	{tags: ['GreetingsRegistry', 'v1']},
);

/**
 * Step 2. Write a greeting through the proxy, and read it back.
 *
 * The prefix is missing, and that is the lesson. Nothing is broken in rocketh or in the proxy:
 * the constructor wrote `_prefix` into storage the proxy does not use.
 */
export const writeGreetingUnderV1 = deployScript(
	async (env) => {
		const {deployer} = env.namedAccounts;
		const registry = env.get('GreetingsRegistry');

		await env.execute(registry, {account: deployer, functionName: 'setMessage', args: ['hello']});
		const stored = await env.read(registry, {functionName: 'messages', args: [deployer]});

		console.log(`sent       -> setMessage("hello")`);
		console.log(`read back  -> ${JSON.stringify(stored)}`);
		console.log(`expected "${PREFIX}hello". The constructor set the prefix on the IMPLEMENTATION,`);
		console.log(`and a constructor never touches the proxy's own storage. So it is empty here.`);
	},
	{tags: ['greeting-v1'], dependencies: ['GreetingsRegistry']},
);

/**
 * Step 3. Upgrade the SAME proxy to `GreetingsRegistryV2`.
 *
 * `execute` is the fix: rocketh calls `postUpgrade` THROUGH the proxy as part of the upgrade,
 * so the prefix is written into the storage the proxy actually reads. Note there is no
 * constructor argument this time, because that was never going to work.
 */
export const upgradeToV2 = deployScript(
	async (env) => {
		const {deployer, admin} = env.namedAccounts;

		const deployment = await env.deployViaProxy(
			'GreetingsRegistry',
			{account: deployer, artifact: GreetingsRegistryV2, args: []},
			{
				owner: admin,
				linkedData: {prefix: PREFIX, admin},
				deterministicImplementation: true,
				execute: {methodName: 'postUpgrade', args: [PREFIX]},
			},
		);

		const prefixNow = await env.read(deployment, {functionName: 'prefix', args: []});
		const stillThere = await env.read(deployment, {functionName: 'messages', args: [deployer]});

		console.log(`proxy      -> ${deployment.address}   (the same address as step 1)`);
		console.log(`prefix     -> ${JSON.stringify(prefixNow)}   (set through the proxy this time)`);
		console.log(`old greeting still stored -> ${JSON.stringify(stillThere)}`);
		console.log(`an upgrade replaces CODE, not STORAGE.`);
	},
	{tags: ['GreetingsRegistryV2', 'v2'], dependencies: ['greeting-v1']},
);

/**
 * Step 4. Write another greeting, now that the prefix is really set.
 *
 * The new greeting gets the prefix; the one from step 2 does not. Upgrading changes what
 * happens NEXT, it does not rewrite what already happened.
 */
export const writeGreetingUnderV2 = deployScript(
	async (env) => {
		const {deployer, admin} = env.namedAccounts;
		const registry = env.get('GreetingsRegistry');

		await env.execute(registry, {account: deployer, functionName: 'setMessage', args: ['hello again']});
		const mine = await env.read(registry, {functionName: 'messages', args: [deployer]});
		const untouched = await env.read(registry, {functionName: 'messages', args: [admin]});

		console.log(`sent       -> setMessage("hello again")`);
		console.log(`read back  -> ${JSON.stringify(mine)}   (prefixed, at last)`);
		console.log(`admin's greeting -> ${JSON.stringify(untouched)}   (never set, still empty)`);
		console.log(`the greeting from step 2 was written by the OLD code and keeps its old value.`);
	},
	{tags: ['greeting-v2'], dependencies: ['GreetingsRegistryV2']},
);
