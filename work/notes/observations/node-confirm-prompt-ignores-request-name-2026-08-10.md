# `@rocketh/node`'s confirm prompt reads `.proceed` instead of `request.name` (2026-08-10)

`createNodePromptExecutor().prompt` in `packages/rocketh-node/src/environment/prompt.ts` returns `{proceed: answer.proceed}`, ignoring `request.name`, while the `prompts` library keys its answer object BY `request.name`. It is correct today only because both call sites (`packages/rocketh/src/executor/index.ts`, the reset confirmation and the gas-price confirmation) pass `name: 'proceed'`; a confirm named anything else would silently read `undefined` and be treated as "do not proceed", i.e. `exit()`.

Left as-is deliberately: `prompt-capability-on-the-environment` was scoped to the new text variant (which does key off `request.name`, guarded by a test). Fixing the confirm the same way looks behaviour-identical for both current call sites.
