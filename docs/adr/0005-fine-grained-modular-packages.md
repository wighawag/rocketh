# Fine-grained, modular packages

Rocketh is split into many small packages (`@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/diamond`, `@rocketh/read-execute`, …) in an Nx + pnpm monorepo rather than a single package with subpaths. Most of these packages are **extensions the user can opt into — or reimplement themselves**: the system is fully modular by design, and the package boundaries are what make it easy to extend (or replace a piece) without forking the core. The cost (more packages to publish and version) is accepted in exchange for that extensibility.
