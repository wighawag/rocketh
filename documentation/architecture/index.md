# Architecture Overview

## rocketh Architecture

rocketh follows a modular architecture with several key components:

1. **Core Package (`rocketh`)**: Provides the basic environment and deployment tracking functionality.
2. **Deploy Package (`@rocketh/deploy`)**: Adds the `deploy` function to the environment.
3. **Proxy Package (`@rocketh/proxy`)**: Adds proxy deployment capabilities.
4. **Diamond Package (`@rocketh/diamond`)**: Adds diamond pattern deployment capabilities.
5. **Export Package (`@rocketh/export`)**: Provides functionality to export deployments for use in frontends.
6. **Verifier Package (`@rocketh/verifier`)**: Provides contract verification capabilities for Etherscan, Sourcify, etc.
7. **Doc Package (`@rocketh/doc`)**: Generates documentation for deployed contracts.
8. **Unknown Signer Package (`@rocketh/unknown-signer`)**: Adds `catchUnknownSigner`, the non-interactive way to defer a call whose `from` is an account rocketh cannot sign for. Optional: handling such accounts is built into rocketh itself, which by default pauses and asks you to execute the transaction (see [Handling unknown signers](../unknown-signers/)). This package is mainly for migrating hardhat-deploy v1 scripts.

Each package extends the core with additional functionality, allowing you to use only what you need.

## hardhat-deploy Architecture

hardhat-deploy integrates rocketh with Hardhat through:

1. **Plugin Registration**: Registers the `deploy` task with Hardhat.
2. **Config Hook Handler**: Processes Hardhat configuration to set up rocketh.
3. **Solidity Hook Handler**: Processes Solidity compilation results for use with rocketh.
4. **Deploy Task**: Executes deployment scripts using rocketh's `loadAndExecuteDeployments` function.
