/**
 * Regenerate this package's bundled proxy artifacts from `hardhat-deploy-v1/`.
 *
 *     pnpm --filter @rocketh/proxy generate:artifacts
 *     pnpm --filter @rocketh/proxy verify:artifacts   # --check: write nothing, fail on drift
 *
 * Only DATA lives here. Why the artifacts are generated but committed, why the source order
 * is stated rather than derived, and why `evmVersion` is absent are all in
 * `scripts/generate-v1-artifacts.ts`, which is shared with `@rocketh/diamond`.
 *
 * TWO UNITS, and they are not interchangeable. hardhat-deploy v1 compiled the EIP173 proxies
 * separately from the OpenZeppelin-based ones, so the artifacts of the two groups carry
 * DIFFERENT `solcInput` strings and therefore different `solcInputHash` values. Merging them
 * into one unit would compile to identical bytecode and still rewrite every artifact.
 */

import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {generateV1Artifacts} from '../../../scripts/generate-v1-artifacts.js';

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

await generateV1Artifacts({
	packageRoot,
	artifactDir: path.join('src', 'hardhat-deploy-v1-artifacts'),
	units: [
		{
			// The EIP173 pair, with rocketh's own `Proxy.sol` base.
			sources: ['solc_0.8/proxy/EIP173Proxy.sol', 'solc_0.8/proxy/Proxy.sol', 'solc_0.8/proxy/EIP173ProxyWithReceive.sol'],
			artifacts: [
				{name: 'EIP173Proxy', sourceName: 'solc_0.8/proxy/EIP173Proxy.sol'},
				{name: 'EIP173ProxyWithReceive', sourceName: 'solc_0.8/proxy/EIP173ProxyWithReceive.sol'},
			],
		},
		{
			// The OpenZeppelin transparent/ERC1967 family, plus rocketh's optimized transparent
			//  proxy. Beacon and UUPS sources are part of the unit though nothing here is emitted
			//  from them: they were compiled alongside, so they belong to the input and its hash.
			sources: [
				'solc_0.8/openzeppelin/access/Ownable.sol',
				'solc_0.8/openzeppelin/utils/Context.sol',
				'solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol',
				'solc_0.8/openzeppelin/proxy/transparent/TransparentUpgradeableProxy.sol',
				'solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol',
				'solc_0.8/openzeppelin/proxy/Proxy.sol',
				'solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Upgrade.sol',
				'solc_0.8/openzeppelin/proxy/beacon/IBeacon.sol',
				'solc_0.8/openzeppelin/interfaces/draft-IERC1822.sol',
				'solc_0.8/openzeppelin/utils/Address.sol',
				'solc_0.8/openzeppelin/utils/StorageSlot.sol',
				'solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol',
				'solc_0.8/openzeppelin/proxy/utils/UUPSUpgradeable.sol',
				'solc_0.8/openzeppelin/proxy/utils/Initializable.sol',
				'solc_0.8/openzeppelin/proxy/beacon/UpgradeableBeacon.sol',
				'solc_0.8/openzeppelin/proxy/beacon/BeaconProxy.sol',
			],
			artifacts: [
				{name: 'ERC1967Proxy', sourceName: 'solc_0.8/openzeppelin/proxy/ERC1967/ERC1967Proxy.sol'},
				{
					name: 'OptimizedTransparentUpgradeableProxy',
					sourceName: 'solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol',
				},
				{name: 'ProxyAdmin', sourceName: 'solc_0.8/openzeppelin/proxy/transparent/ProxyAdmin.sol'},
				{
					name: 'TransparentUpgradeableProxy',
					sourceName: 'solc_0.8/openzeppelin/proxy/transparent/TransparentUpgradeableProxy.sol',
				},
			],
		},
	],
});
