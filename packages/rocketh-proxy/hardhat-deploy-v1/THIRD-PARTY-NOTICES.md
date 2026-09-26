# Third-party notices

This directory vendors third-party Solidity. Every file here carries an SPDX
identifier, but an SPDX line is not the licence: MIT requires the copyright
notice and the permission notice to travel with the code. This file supplies
them. It documents provenance only and is not compiled: the artifact generator
in `scripts/generate-artifacts.ts` builds from an explicit list of `.sol`
sources, so adding this file does not change a single byte of the committed
artifacts.

## OpenZeppelin Contracts

**Upstream:** https://github.com/OpenZeppelin/openzeppelin-contracts
**Licence:** MIT (`SPDX-License-Identifier: MIT` on every vendored file)
**Location:** `solc_0.8/openzeppelin/`

A partial snapshot: the proxy, access and utility contracts needed by the
proxy patterns here, not the whole library. The upstream version is recorded
per file in the second line of each source. Those stamps are not uniform,
because OpenZeppelin stamps a file with the release in which that file last
changed. The snapshot as a whole corresponds to **v4.5.0-rc.0**; files
untouched since v4.4.1 still carry the older stamp.

| Vendored file                                                    | Upstream stamp           |
| ---------------------------------------------------------------- | ------------------------ |
| `openzeppelin/access/Ownable.sol`                                | v4.4.1                   |
| `openzeppelin/interfaces/draft-IERC1822.sol`                     | last updated v4.5.0-rc.0 |
| `openzeppelin/proxy/Proxy.sol`                                   | last updated v4.5.0-rc.0 |
| `openzeppelin/proxy/ERC1967/ERC1967Proxy.sol`                    | v4.4.1                   |
| `openzeppelin/proxy/ERC1967/ERC1967Upgrade.sol`                  | last updated v4.5.0-rc.0 |
| `openzeppelin/proxy/beacon/BeaconProxy.sol`                      | v4.4.1                   |
| `openzeppelin/proxy/beacon/IBeacon.sol`                          | v4.4.1                   |
| `openzeppelin/proxy/beacon/UpgradeableBeacon.sol`                | v4.4.1                   |
| `openzeppelin/proxy/transparent/ProxyAdmin.sol`                  | v4.4.1                   |
| `openzeppelin/proxy/transparent/TransparentUpgradeableProxy.sol` | v4.4.1                   |
| `openzeppelin/proxy/utils/Initializable.sol`                     | last updated v4.5.0-rc.0 |
| `openzeppelin/proxy/utils/UUPSUpgradeable.sol`                   | last updated v4.5.0-rc.0 |
| `openzeppelin/utils/Address.sol`                                 | last updated v4.5.0-rc.0 |
| `openzeppelin/utils/Context.sol`                                 | v4.4.1                   |
| `openzeppelin/utils/StorageSlot.sol`                             | v4.4.1                   |

Copyright (c) 2016-2020 zOS Global Limited

That is the copyright line verbatim from the `LICENSE` file of
`OpenZeppelin/openzeppelin-contracts` at tag `v4.5.0-rc.0`, the release this
snapshot corresponds to. Upstream remains the canonical source: where this
notice and that file differ, upstream governs.

### Derivative work

`solc_0.8/proxy/OptimizedTransparentUpgradeableProxy.sol` is **not** original
to this project. Its header records its origin: OpenZeppelin Contracts v4.4.1
`proxy/transparent/TransparentUpgradeableProxy.sol`, modified here. It is
covered by the same MIT terms and the same copyright above, in addition to
this project's own.

The rest of `solc_0.8/proxy/` (`Proxy.sol`, `EIP173Proxy.sol`,
`EIP173ProxyWithReceive.sol`) is original to this project and is covered by
the repository's own `LICENSE`.

## MIT licence text

The permission notice below is the MIT text that must accompany the vendored
code above. It is reproduced from the same upstream `LICENSE` file, which
opens with the title `The MIT License (MIT)` and the copyright line quoted
earlier, followed by this text verbatim.

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
