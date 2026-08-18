/**
 * Regenerate this package's bundled Diamond artifacts from `hardhat-deploy-v1/`.
 *
 *     pnpm --filter @rocketh/diamond generate:artifacts
 *     pnpm --filter @rocketh/diamond verify:artifacts   # --check: write nothing, fail on drift
 *
 * Only DATA lives here. Why the artifacts are generated but committed, why the source order
 * is stated rather than derived, and why `evmVersion` is absent are all in
 * `scripts/generate-v1-artifacts.ts`, which is shared with `@rocketh/proxy`.
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
			// ONE unit, in hardhat's original order. `UsingDiamondOwner.sol` is part of it even
			//  though nothing deployed here imports it: it is a helper consumers inherit, and it
			//  was compiled alongside, so it belongs to the `solcInput` string and its hash.
			sources: [
				'solc_0.8/diamond/Diamond.sol',
				'solc_0.8/diamond/libraries/LibDiamond.sol',
				'solc_0.8/diamond/interfaces/IDiamondCut.sol',
				'solc_0.8/diamond/facets/DiamondCutFacet.sol',
				'solc_0.8/diamond/UsingDiamondOwner.sol',
				'solc_0.8/diamond/initializers/DiamondERC165Init.sol',
				'solc_0.8/diamond/interfaces/IERC165.sol',
				'solc_0.8/diamond/facets/DiamondLoupeFacet.sol',
				'solc_0.8/diamond/interfaces/IDiamondLoupe.sol',
				'solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol',
				'solc_0.8/diamond/facets/OwnershipFacet.sol',
				'solc_0.8/diamond/interfaces/IERC173.sol',
			],
			artifacts: [
				{name: 'Diamond', sourceName: 'solc_0.8/diamond/Diamond.sol'},
				{name: 'DiamondCutFacet', sourceName: 'solc_0.8/diamond/facets/DiamondCutFacet.sol'},
				{name: 'DiamondLoupeFacet', sourceName: 'solc_0.8/diamond/facets/DiamondLoupeFacet.sol'},
				{
					name: 'DiamondLoupeFacetWithoutSupportsInterface',
					sourceName: 'solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol',
				},
				{name: 'OwnershipFacet', sourceName: 'solc_0.8/diamond/facets/OwnershipFacet.sol'},
				{name: 'DiamondERC165Init', sourceName: 'solc_0.8/diamond/initializers/DiamondERC165Init.sol'},
			],
		},
	],
});
