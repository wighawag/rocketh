/**
 * Migration pairs 4 and 5: every built-in proxy kind, `execute: {init, onUpgrade}`, and a proxy
 * upgrade driven by `upgradeIndex`.
 *
 * WHY THE PROXY PAIRS ASSERT THE ARTIFACT. Three of the five built-in proxy names changed between
 * hardhat-deploy v1 and rocketh, and a proxy deploy that is given no usable `proxyContract` does
 * not refuse: it deploys the DEFAULT, `ERC173Proxy`, a different contract with no ProxyAdmin. A
 * test that only checked "a proxy was deployed" would pass on exactly that mistake. Each test here
 * reads WHICH contract the `<name>_Proxy` record holds (its compilation target), so a wrong name
 * fails the test instead of falling back.
 */

import {describe, it, expect, afterEach} from 'vitest';
import {decodeAbiParameters, encodeFunctionData, parseAbi} from 'viem';
import {deployViaProxy, type ProxyDeployOptions} from '@rocketh/proxy';

import {compiledContractName, createWorld, run, runScript, sent, DEPLOYER, IMPLEMENTATION_SLOT} from './harness.js';
import proxyErc173 from './deploy/04a_proxy_erc173.js';
import proxyErc173WithReceive from './deploy/04b_proxy_erc173_with_receive.js';
import proxyUups from './deploy/04c_proxy_uups.js';
import proxyTransparent from './deploy/04d_proxy_transparent.js';
import proxyOptimizedTransparent from './deploy/04e_proxy_optimized_transparent.js';
import vault from './deploy/05_vault.js';
import treasury from './deploy/06a_treasury.js';
import treasuryUpgrade from './deploy/06b_treasury_upgrade.js';
import {artifacts, VaultRecompiled} from './mock-artifacts.js';

/** What deploying `script` put behind `GreetingsRegistry`, and whether a shared ProxyAdmin came with it. */
async function deployProxyPair(script: unknown) {
	const {env} = await run(createWorld());
	await runScript(script, env);
	const proxy = env.get('GreetingsRegistry_Proxy');
	const admin = env.getOrNull('DefaultProxyAdmin');
	return {env, proxyContract: compiledContractName(proxy), proxy, admin};
}

/** The admin a proxy was constructed with: the `{admin}` constructor argument. */
function constructedAdmin(proxy: {argsData: `0x${string}`}): string {
	const [, admin] = decodeAbiParameters([{type: 'address'}, {type: 'address'}, {type: 'bytes'}], proxy.argsData);
	return admin.toLowerCase();
}

describe('migration pair 4: the five built-in proxy kinds, v1 name to rocketh name', () => {
	it("v1 'EIP173Proxy' is 'ERC173Proxy': the EIP-173 proxy, owned by the deployer, no ProxyAdmin", async () => {
		const {proxyContract, proxy, admin} = await deployProxyPair(proxyErc173);
		expect(proxyContract).toBe('EIP173Proxy');
		expect(constructedAdmin(proxy)).toBe(DEPLOYER);
		expect(admin).toBeNull();
	});

	it("v1 'EIP173ProxyWithReceive' is 'ERC173ProxyWithReceive'", async () => {
		const {proxyContract, admin} = await deployProxyPair(proxyErc173WithReceive);
		expect(proxyContract).toBe('EIP173ProxyWithReceive');
		expect(admin).toBeNull();
	});

	it("'UUPS' is 'UUPS': an ERC1967Proxy with no admin argument", async () => {
		const {proxyContract, proxy, admin, env} = await deployProxyPair(proxyUups);
		expect(proxyContract).toBe('ERC1967Proxy');
		const [implementation] = decodeAbiParameters([{type: 'address'}, {type: 'bytes'}], proxy.argsData);
		expect(implementation.toLowerCase()).toBe(env.get('GreetingsRegistry_Implementation').address.toLowerCase());
		expect(admin).toBeNull();
	});

	it("v1 'OpenZeppelinTransparentProxy' is 'SharedAdminOpenZeppelinTransparentProxy', administered by DefaultProxyAdmin", async () => {
		const {proxyContract, proxy, admin} = await deployProxyPair(proxyTransparent);
		expect(proxyContract).toBe('TransparentUpgradeableProxy');
		expect(admin).not.toBeNull();
		expect(compiledContractName(admin!)).toBe('ProxyAdmin');
		expect(constructedAdmin(proxy)).toBe(admin!.address.toLowerCase());
		const [adminOwner] = decodeAbiParameters([{type: 'address'}], admin!.argsData);
		expect(adminOwner.toLowerCase()).toBe(DEPLOYER);
	});

	it("v1 'OptimizedTransparentProxy' is 'SharedAdminOptimizedTransparentProxy', administered by DefaultProxyAdmin", async () => {
		const {proxyContract, proxy, admin} = await deployProxyPair(proxyOptimizedTransparent);
		expect(proxyContract).toBe('OptimizedTransparentUpgradeableProxy');
		expect(compiledContractName(admin!)).toBe('ProxyAdmin');
		expect(constructedAdmin(proxy)).toBe(admin!.address.toLowerCase());
	});

	it('refuses the v1 names at run time, rather than deploying something else', async () => {
		/**
		 * The three renamed v1 names are not aliases. TypeScript refuses them, and a script that
		 * got past the compiler (JavaScript, a cast) throws at deploy time.
		 */
		for (const v1Name of ['EIP173Proxy', 'OpenZeppelinTransparentProxy', 'OptimizedTransparentProxy']) {
			const {env} = await run(createWorld());
			await expect(
				deployViaProxy(env)(
					'GreetingsRegistry',
					{account: DEPLOYER, artifact: artifacts.GreetingsRegistry, args: ['hello: ']},
					{proxyContract: v1Name as ProxyDeployOptions['proxyContract']},
				),
			).rejects.toThrow(`unknown proxy contract ${v1Name}`);
		}
	});

	it('refuses `proxyKind`, which exists in no version, at compile time', () => {
		/**
		 * The migration skill used to teach `{proxyKind: 'Transparent'}`. No such option exists;
		 * an agent that silenced the compiler got the DEFAULT proxy, an ERC173Proxy with no
		 * ProxyAdmin, deployed without complaint.
		 */
		const options: ProxyDeployOptions = {
			// @ts-expect-error `proxyKind` is not an option: the kind is chosen by `proxyContract`
			proxyKind: 'Transparent',
		};
		expect(options).toBeDefined();
	});
});

describe('migration pair 5: execute {init, onUpgrade}, and upgradeIndex', () => {
	const originalVault = artifacts.Vault;
	afterEach(() => {
		artifacts.Vault = originalVault;
	});

	it('first deployment: the proxy is constructed with the `init` call', async () => {
		const {env} = await run(createWorld());

		await runScript(vault, env);

		const [, , data] = decodeAbiParameters(
			[{type: 'address'}, {type: 'address'}, {type: 'bytes'}],
			env.get('Vault_Proxy').argsData,
		);
		expect(data).toBe(encodeFunctionData({abi: artifacts.Vault.abi, functionName: 'initialize', args: [DEPLOYER]}));
	});

	it('the same script re-run after the Vault source changed: upgraded WITH the `onUpgrade` call', async () => {
		const world = createWorld();
		const first = await run(world);
		await runScript(vault, first.env);
		world.chain.constructProxies(first.env);
		const proxy = first.env.get('Vault_Proxy').address;

		// ---- the Vault source changes; recompile; re-run the unchanged script ----
		artifacts.Vault = VaultRecompiled;
		const second = await run(world);
		await runScript(vault, second.env);

		const next = second.env.get('Vault_Implementation').address;
		expect(next).not.toBe(first.env.get('Vault_Implementation').address);
		const upgrade = sent(second.provider).find((tx) => tx.to === proxy.toLowerCase());
		expect(upgrade).toEqual({
			from: DEPLOYER,
			to: proxy.toLowerCase(),
			data: encodeFunctionData({
				abi: parseAbi(['function upgradeToAndCall(address newImplementation, bytes data)']),
				functionName: 'upgradeToAndCall',
				args: [next, encodeFunctionData({abi: artifacts.Vault.abi, functionName: 'migrate', args: [2n]})],
			}),
		});
	});

	it('upgradeIndex: step 0 deploys, step 1 upgrades, and a re-run of both does nothing', async () => {
		const world = createWorld();
		const first = await run(world);
		await runScript(treasury, first.env);
		world.chain.constructProxies(first.env);
		await runScript(treasuryUpgrade, first.env);

		const proxy = first.env.get('Treasury_Proxy').address;
		const v2 = first.env.get('Treasury_Implementation').address;
		expect(world.chain.readAddress(proxy, IMPLEMENTATION_SLOT)).toBe(v2.toLowerCase());
		expect(first.env.get('Treasury').numDeployments).toBe(2);

		// ---- a later run of the whole deploy folder: both steps already ran ----
		const second = await run(world);
		await runScript(treasury, second.env);
		await runScript(treasuryUpgrade, second.env);
		expect(sent(second.provider)).toEqual([]);
	});
});
