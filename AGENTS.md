# Rocketh - AI Agent Instructions

A framework-agnostic smart contract deployment system for Ethereum-compatible networks.

---

## Tech Stack

- **Language:** TypeScript (strict mode, ESNext target)
- **Module System:** ESM (ES Modules) with NodeNext resolution
- **Build System:** Nx monorepo with pnpm workspaces
- **Testing:** Vitest (unit tests + integration tests as documentation)
- **Formatting:** Prettier
- **Node Version:** 22.14.0 (via Volta)
- **Package Manager:** pnpm 10.28.1

---

## Project Structure

```
rocketh/
├── packages/
│   ├── rocketh/              # Core deployment environment and execution
│   ├── rocketh-core/         # Shared types and utilities
│   ├── rocketh-deploy/       # Standard contract deployment
│   ├── rocketh-proxy/        # Proxy deployment patterns (UUPS, Transparent, ERC173)
│   ├── rocketh-diamond/      # EIP-2535 Diamond proxy support
│   ├── rocketh-node/         # Node.js deployment executor (filesystem access)
│   ├── rocketh-verifier/     # Contract verification (Etherscan, Sourcify)
│   ├── rocketh-export/       # Export deployments for frontend consumption
│   ├── rocketh-doc/          # Documentation generation
│   ├── rocketh-signer/       # Signer utilities
│   ├── rocketh-router/       # Route-based contract deployment
│   ├── rocketh-viem/         # Viem integration
│   ├── rocketh-web/          # Browser runtime support
│   ├── rocketh-read-execute/ # Contract read/write utilities
│   └── rocketh-test-utils/   # Test utilities and mock helpers
├── documentation.md          # Main documentation
├── TESTING.md               # Testing guide
└── README.md                # Getting started guide
```

### Key Files Reference

- **Entry points:** `packages/*/src/index.ts`
- **Types:** `packages/rocketh-core/src/types.ts`
- **Deploy function:** `packages/rocketh-deploy/src/index.ts`
- **Proxy deployments:** `packages/rocketh-proxy/src/index.ts`
- **Diamond deployments:** `packages/rocketh-diamond/src/index.ts`
- **Test utilities:** `packages/rocketh-test-utils/src/index.ts`

---

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
# or
nx run-many -t build

# Type check all packages
pnpm typecheck
# or single file
pnpm -r --parallel exec tsc --noEmit

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Format code
pnpm format

# Check formatting
pnpm format:check

# Lint a specific file
pnpm prettier --write path/to/file.ts

# Run docs development server
pnpm docs:dev

# Build docs
pnpm docs:build
```

---

## Do

- Use TypeScript with strict mode for all new files
- Use ESM imports with `.js` extensions (e.g., `import {deploy} from './deploy.js'`)
- Use `type` imports when importing only types: `import type {Environment} from '@rocketh/core/types'`
- Use `viem` for Ethereum utilities (encoding, addresses, etc.)
- Use `named-logs` for logging: `const logger = logs('@rocketh/package-name')`
- Use `abitype` for ABI typing with `Abi` type
- Use `eip-1193` types for EIP-1193 provider interactions
- Follow existing patterns in similar files when adding new functionality
- Write integration tests that serve as documentation (see `packages/*/test/*.integration.test.ts`)
- Use `createMockEnvironment` and `createMockArtifact` from `@rocketh/test-utils` for tests
- Keep functions focused and modular - one concern per function
- Export types separately from implementation: `export type * from './types.js'`
- Use `as const satisfies` pattern for configuration objects
- Keep deployment logic separate from environment setup
- Use descriptive error messages that help users debug issues

---

## Don't

- Do not use CommonJS (`require`, `module.exports`)
- Do not import without `.js` extension in relative imports
- Do not modify `@rocketh/core` types without considering impacts on all packages
- Do not add new heavy dependencies without approval
- Do not hardcode addresses - use named accounts or environment configuration
- Do not use `any` type - use proper types or `unknown` with type guards
- Do not mix environment setup logic with deployment logic
- Do not use class-based patterns - prefer functional patterns with currying
- Do not skip tests for new functionality
- Do not modify hardhat-deploy-v1-artifacts unless necessary for compatibility
- Do not use sync filesystem operations in packages that should work in browser

---

## Code Style Examples

### Good: Deploy function pattern (curried)

```typescript
// packages/rocketh-deploy/src/index.ts
export function deploy(env: Environment): <TAbi extends Abi>(
  name: string,
  args: DeploymentConstruction<TAbi>,
  options?: DeployOptions,
) => Promise<DeployResult<TAbi>> {
  return async <TAbi extends Abi>(name: string, args: DeploymentConstruction<TAbi>, options?: DeployOptions) => {
    // Implementation
  };
}
```

### Good: Type exports pattern

```typescript
// packages/rocketh-core/src/index.ts
export type * from './types.js';
export {resolveAccount, resolveAccountOrUndefined} from './account.js';
export {mergeABIs, mergeArtifacts} from './artifacts.js';
```

### Good: Test structure pattern

```typescript
// packages/rocketh-deploy/test/deploy.integration.test.ts
import {describe, it, expect} from 'vitest';
import {deploy} from '../src/index.js';
import {createMockEnvironment, createMockArtifact} from '@rocketh/test-utils';

describe('@rocketh/deploy - Integration Tests', () => {
  describe('Basic Contract Deployment', () => {
    it('should demonstrate basic deployment pattern', async () => {
      /**
       * Example: Deploying a simple contract
       * This demonstrates the most basic deployment scenario.
       */
      const {env} = createMockEnvironment();
      const _deploy = deploy(env);

      const artifact = createMockArtifact('SimpleContract');
      const deployment = await _deploy('SimpleContract', {
        account: 'deployer',
        artifact,
        args: [42n],
      });

      expect(deployment).toBeDefined();
      expect(deployment.newlyDeployed).toBe(true);
    });
  });
});
```

### Good: Configuration pattern

```typescript
// rocketh/config.ts example
import type {UserConfig} from 'rocketh/types';

export const config = {
  accounts: {
    deployer: {
      default: 0,
    },
    admin: {
      default: 1,
    },
  },
  data: {},
} as const satisfies UserConfig;
```

### Avoid: Class-based patterns

```typescript
// ❌ Don't do this
class Deployer {
  constructor(private env: Environment) {}
  async deploy(name: string) { ... }
}

// ✅ Do this instead
export function deploy(env: Environment) {
  return async (name: string) => { ... };
}
```

---

## Testing Guidelines

### Test File Naming

- Unit tests: `*.test.ts` (in `packages/*/test/` or `packages/*/src/`)
- Integration tests: `*.integration.test.ts` (in `packages/*/test/`)

### Test Structure

Integration tests serve as documentation. Each test should:

1. Include a descriptive JSDoc comment explaining the scenario
2. Show real-world usage patterns
3. Use `createMockEnvironment` for consistent test setup
4. Test happy path and error cases

### Running Tests

```bash
# All tests
pnpm test

# Specific package
cd packages/rocketh-deploy && pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

---

## Safety and Permissions

### Allowed without prompt

- Read files, list files
- Run type checks: `pnpm typecheck`
- Run formatters: `pnpm format`
- Run tests: `pnpm test`
- Build packages: `pnpm build`

### Ask first

- Adding new package dependencies
- Modifying `@rocketh/core` types (affects all packages)
- Changing build configuration (`tsconfig.base.json`, `nx.json`)
- Modifying CI/CD workflows (`.github/`)
- Deleting files or packages
- Running git operations (push, force operations)

---

## Package Dependencies

Core dependency flow:

```
rocketh-core (types, utilities)
     ↓
rocketh (environment, executor)
     ↓
rocketh-deploy (basic deployment)
     ↓
rocketh-proxy, rocketh-diamond (advanced patterns)
     ↓
rocketh-node (filesystem operations)
```

When modifying a package, consider impacts on dependent packages.

---

## When Stuck

- Check existing implementations in similar packages
- Look at integration tests for usage examples
- Review `documentation.md` and `TESTING.md`
- Ask a clarifying question before making large speculative changes
- Propose a short plan for significant architectural changes

---

## PR Checklist

- [ ] Title follows: `feat(package): description` or `fix(package): description`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Tests pass: `pnpm test`
- [ ] Format check passes: `pnpm format:check`
- [ ] New functionality has tests
- [ ] Integration tests serve as documentation
- [ ] No unnecessary console.log statements
- [ ] Types are properly exported