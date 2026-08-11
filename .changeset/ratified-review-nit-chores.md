---
'@rocketh/core': patch
---

Message wording: the auto-impersonation note said the node "did not accept it (only a fork or dev node, such as anvil or hardhat, implements that RPC)", which misleads a user who IS on a fork. The same outcome also covers a node that implements the RPC and REFUSED the account, which the suite explicitly tests. The message now says both, matching what the JSDoc already said.
