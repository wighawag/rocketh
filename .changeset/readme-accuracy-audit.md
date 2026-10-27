---
'hardhat-deploy': patch
'@rocketh/doc': patch
'@rocketh/playground': patch
'@rocketh/proxy': patch
'@rocketh/unknown-signer': patch
'@rocketh/verifier': patch
'@rocketh/viem': patch
'@rocketh/web': patch
---

README corrections from a documentation audit against the code: `rocketh-doc --except-suffix` takes one comma-separated value; the Etherscan verifier uses Etherscan's V2 API for every chain, and Blockscout has default endpoints for common chains; `viem` is a property in a deploy script, not a function; `@rocketh/web`'s `setupEnvironment` takes a `deploymentStore` option, `loadDeploymentsFromIndexedDB` is deprecated and IndexedDB storage is not a stub; `@rocketh/proxy` forces `strictBytecodeMatch: false` on the proxy contract only; the unknown-signer policy precedence includes the top-level config; the playground's `docs:build` script and button label; and two dead links in the hardhat-deploy README.
