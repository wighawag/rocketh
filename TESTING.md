# Testing Guide

This document provides an overview of the testing approach used in the Rocketh project and how the integration tests serve as documentation.

## Overview

The Rocketh project uses Vitest for testing. Tests are organized by package and include both unit tests and integration tests that serve as documentation.

## Test Structure

### Unit Tests

Unit tests focus on individual functions and utilities. They are located in each package's `src` directory with the `.test.ts` suffix.

Examples:
- [`packages/rocketh-core/src/account.test.ts`](packages/rocketh-core/src/account.test.ts) - Tests for account resolution
- [`packages/rocketh-core/src/artifacts.test.ts`](packages/rocketh-core/src/artifacts.test.ts) - Tests for ABI/artifact merging
- [`packages/rocketh-core/src/json.test.ts`](packages/rocketh-core/src/json.test.ts) - Tests for JSON utilities
- [`packages/rocketh-core/src/providers/TransactionHashTracker.test.ts`](packages/rocketh-core/src/providers/TransactionHashTracker.test.ts) - Tests for transaction hash tracking

### Integration Tests (Documentation Examples)

Integration tests demonstrate real-world usage scenarios and serve as executable documentation. They are located in each package's `src` directory with the `.integration.test.ts` suffix.

**Note**: These integration tests are primarily documentation examples that demonstrate usage patterns. For full integration testing with actual blockchain interactions, you would need to run them against a local blockchain node (like Anvil or Hardhat Network).

Examples:
- [`packages/rocketh-deploy/src/deploy.integration.test.ts`](packages/rocketh-deploy/src/deploy.integration.test.ts) - Deployment scenarios
- [`packages/rocketh-proxy/src/proxy.integration.test.ts`](packages/rocketh-proxy/src/proxy.integration.test.ts) - Proxy deployment patterns
- [`packages/rocketh-diamond/src/diamond.integration.test.ts`](packages/rocketh-diamond/src/diamond.integration.test.ts) - Diamond proxy scenarios
- [`packages/rocketh-core/src/environment.integration.test.ts`](packages/rocketh-core/src/environment.integration.test.ts) - Environment setup and usage

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests for a Specific Package

```bash
# Deploy package
cd packages/rocketh-deploy
pnpm test

# Proxy package
cd packages/rocketh-proxy
pnpm test

# Diamond package
cd packages/rocketh-diamond
pnpm test

# Core package
cd packages/rocketh-core
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test --watch
```

### Run Tests with Coverage

```bash
pnpm test --coverage
```

## Test Utilities

The integration tests use inline mock helpers rather than a separate test utilities package. Each integration test file includes its own helper functions to create mock environments and artifacts for testing purposes.

## Integration Tests as Documentation

Integration tests in this project are designed to serve as executable documentation. Each test scenario includes:

1. **Descriptive Comments**: Explain what the test demonstrates
2. **Real-World Examples**: Show practical usage patterns
3. **Best Practices**: Demonstrate recommended approaches
4. **Edge Cases**: Cover error handling and corner cases

### Example: Reading Integration Tests

```typescript
/**
 * Example: Deploying a simple contract with constructor arguments
 *
 * This demonstrates the most basic deployment scenario:
 * - Create an environment with named accounts
 * - Use the deploy function to deploy a contract
 * - Specify the account, artifact, and constructor arguments
 */
const {env, accounts} = createTestEnvironment();
const _deploy = deploy(env);

const artifact = createMockArtifact('SimpleContract', [...]);

const deployment = await _deploy('SimpleContract', {
  account: 'deployer',
  artifact,
  args: [42n],
});

expect(deployment.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
```

## Key Test Scenarios Covered

### @rocketh/deploy

- Basic contract deployment with constructor arguments
- Idempotent deployment with `skipIfAlreadyDeployed`
- Forced redeployment with `alwaysOverride`
- Named account resolution
- Library linking
- Deterministic deployments (CREATE2 and CREATE3)
- Metadata attachment with `linkedData`
- Error handling

### @rocketh/proxy

- ERC173 proxy deployment
- UUPS proxy deployment
- Transparent proxy deployment (OpenZeppelin and Optimized)
- Proxy upgrades
- Post-upgrade function execution
- Deterministic proxy deployment
- Custom proxy artifacts
- Initialization calls

### @rocketh/diamond

- Basic diamond deployment with default facets
- Diamond with custom owner
- Diamond with initialization calls
- Multiple facet management
- Facet upgrades (add, replace, remove)
- Deterministic diamond deployment
- Facet constructor arguments
- Selector exclusion
- Default facet control

### @rocketh/core

- Account resolution in deployment contexts
- Environment setup and configuration
- ABI merging for proxy deployments
- Deployment tracking
- Complex deployment scenarios with dependencies

## Writing New Tests

When writing new tests, follow these guidelines:

1. **Use Descriptive Comments**: Explain what the test demonstrates
2. **Include Real-World Scenarios**: Make tests practical and educational
3. **Test Edge Cases**: Cover error handling and corner cases
4. **Use Test Utilities**: Leverage `@rocketh/test-utils` for consistent test setup
5. **Follow Naming Conventions**: Use `*.test.ts` for unit tests and `*.integration.test.ts` for integration tests

### Example Test Structure

```typescript
import {describe, it, expect, beforeEach} from 'vitest';
import {deploy} from '@rocketh/deploy';
import {createTestEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('My Feature - Integration Tests', () => {
  describe('Scenario 1', () => {
    it('should do something useful', async () => {
      /**
       * Example: Brief description of what this test demonstrates
       *
       * Detailed explanation of the scenario and why it matters.
       */
      const {env} = createTestEnvironment();
      const _deploy = deploy(env);

      const artifact = createMockArtifact('MyContract');
      
      const deployment = await _deploy('MyContract', {
        account: 'deployer',
        artifact,
        args: [],
      });

      expect(deployment.address).toBeDefined();
    });
  });
});
```

## Best Practices

1. **Use Test Utilities**: Always use `@rocketh/test-utils` for creating test environments
2. **Keep Tests Independent**: Each test should be able to run independently
3. **Use Descriptive Names**: Test names should clearly describe what they test
4. **Test Happy Path and Error Cases**: Cover both success and failure scenarios
5. **Document Tests**: Use comments to explain complex scenarios
6. **Mock External Dependencies**: Use mocks for network calls, external services, etc.

## Continuous Integration

Tests are configured to run in CI/CD pipelines. Ensure all tests pass before submitting a pull request.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Integration Testing Guide](https://martinfowler.com/bliki/IntegrationTest.html)