---
'rocketh': patch
'@rocketh/core': patch
'@rocketh/deploy': patch
'@rocketh/diamond': patch
'@rocketh/doc': patch
'@rocketh/export': patch
'@rocketh/node': patch
'@rocketh/proxy': patch
'@rocketh/read-execute': patch
'@rocketh/router': patch
'@rocketh/signer': patch
'@rocketh/test-utils': patch
'@rocketh/unknown-signer': patch
'@rocketh/verifier': patch
'@rocketh/viem': patch
'@rocketh/web': patch
---

Rewrite the npm-facing metadata so the packages are discoverable by the terms people actually search, rather than by a name they have to already know.

Every package carried the same four keywords (`rocketh`, `ethereum`, `deployment`, `test`), which meant the scope was findable only by someone who had already heard of it. Keywords are now per-package and include the terms a search starts from: `hardhat-deploy`, `solidity`, `smart-contracts`, `evm`, `viem`, plus the specifics each package is the answer to (`create2`/`create3`, `uups`/`erc1967`/`erc173`, `eip-2535`, `etherscan`/`sourcify`, `safe`/`multisig`).

Descriptions defined each package in terms of rocketh itself ("provide deploy function for rocketh"), which is the one thing a first-time reader on npm cannot yet resolve. They now lead with the capability and anchor it to known concepts. Also fixes a typo in `@rocketh/read-execute` ("read abd execute").

`rocketh`'s `homepage` now points at https://rocketh.dev rather than the monorepo README.
