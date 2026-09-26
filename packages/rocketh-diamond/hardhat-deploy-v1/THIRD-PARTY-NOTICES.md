# Third-party notices

This directory vendors third-party Solidity. Every file here carries an SPDX
identifier, but an SPDX line is not the licence: MIT requires the copyright
notice and the permission notice to travel with the code. This file supplies
them. It documents provenance only and is not compiled: the artifact generator
in `scripts/generate-artifacts.ts` builds from an explicit list of `.sol`
sources, so adding this file does not change a single byte of the committed
artifacts.

## EIP-2535 Diamonds reference implementation

**Author:** Nick Mudge <nick@perfectabstractions.com>
**Standard:** https://eips.ethereum.org/EIPS/eip-2535
**Licence:** MIT (`SPDX-License-Identifier: MIT` on every vendored file)
**Location:** `solc_0.8/diamond/`

These files carry the upstream author header verbatim:

- `solc_0.8/diamond/Diamond.sol`
- `solc_0.8/diamond/libraries/LibDiamond.sol`
- `solc_0.8/diamond/interfaces/IDiamondCut.sol`
- `solc_0.8/diamond/interfaces/IDiamondLoupe.sol`
- `solc_0.8/diamond/facets/DiamondCutFacet.sol`
- `solc_0.8/diamond/facets/DiamondLoupeFacet.sol`
- `solc_0.8/diamond/facets/DiamondLoupeFacetWithoutSupportsInterface.sol`

Copyright (c) Nick Mudge.

No upstream version or commit is recorded in the vendored sources, so this
notice does not claim one. The author line and the EIP reference above are
reproduced from the file headers themselves.

## Files without an upstream author header

The remaining Solidity here carries `SPDX-License-Identifier: MIT` but no
third-party author line:

- `solc_0.8/diamond/interfaces/IERC165.sol` and
  `solc_0.8/diamond/interfaces/IERC173.sol` are the interface declarations of
  ERC-165 and ERC-173, whose text comes from the standards themselves rather
  than from a single copyright holder.
- `solc_0.8/diamond/UsingDiamondOwner.sol`,
  `solc_0.8/diamond/facets/OwnershipFacet.sol` and
  `solc_0.8/diamond/initializers/DiamondERC165Init.sol` are original to this
  project, or close enough to the standard's own example text to carry no
  separate claim, and are covered by the repository's own `LICENSE`.

## MIT licence text

The permission notice below is the MIT text that must accompany the vendored
code above.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
