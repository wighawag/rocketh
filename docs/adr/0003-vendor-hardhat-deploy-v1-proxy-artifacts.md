# Vendor hardhat-deploy v1 proxy artifacts

`@rocketh/proxy` bundles the proxy contract artifacts from hardhat-deploy v1 (`hardhat-deploy-v1-artifacts/`: ERC1967, EIP173, ProxyAdmin, Transparent…) rather than regenerating its own. Rocketh is effectively the generic successor of hardhat-deploy v1 (hardhat-deploy now builds on rocketh), and we deliberately want proxies to deploy with **the same bytecode as before**, so existing deployments and tooling stay compatible across the migration. The vendored artifacts are the mechanism for that bytecode continuity.
