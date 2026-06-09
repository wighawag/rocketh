# Framework-agnostic, browser-capable deployment core

rocketh is a standalone, framework-agnostic deployment engine; hardhat-deploy v2 is a thin consumer rewritten on top of it rather than the other way around. Deploy scripts are designed to run anywhere, including in the browser.

**Why:** deployment should not be tied to one toolchain. Hardhat itself cannot run in the browser, and it was in flux (moving from v2 to v3), while alternatives like Foundry/forge exist. Coupling deployment to any single framework would inherit that framework's constraints (no browser, version churn, lock-in). By keeping the core framework-agnostic and browser-capable, the same deploy scripts work across toolchains and in the browser, and each framework (hardhat-deploy, etc.) becomes a thin integration layer over the shared engine.

**Consequence:** the "must run in the browser" constraint rules out Node-only/filesystem assumptions in the core — filesystem access is isolated to `@rocketh/node`, keeping the rest of the stack browser-safe.
