---
title: '`chain with id X has no public info` is written to console.error, but it is not an error'
slug: chain-info-missing-logged-as-error-2026-08-16
needsAnswers: true
source: 'read at `packages/rocketh/src/environment/chains.ts:69` @ 6c7aee3, 2026-08-16; observed live in the docs playground widget against embedded-eth-node chain 31337'
---

# `chain with id X has no public info` is logged at ERROR severity

## What was seen

Building `@rocketh/playground` (the docs Run-button widget) meant capturing `console` for the duration of a deploy run, so the reader sees what the deploy script printed. The first working run painted a **red error line** through the middle of an otherwise successful deploy:

```
· booting an in-browser EVM (chain id 31337)
· running 1 deploy script
× chain with id 31337  has no public info      <- console.error
> GreetingsRegistry proxy deployed at 0xf8e8…
✓ deployed 3 contracts in 77ms
```

## Where it comes from

`packages/rocketh/src/environment/chains.ts:69`, in `getChainConfigFromUserConfig`:

```ts
if (!chainConfig?.info) {
	console.error(`chain with id ${id} ${chainConfig ? 'has a chain config but' : ''} has no public info`);
}
```

The very next lines build a `defaultChainInfo` (`name: 'unknown'`, `Unknown Currency`/`UNKNOWN`) and carry on. So the condition is **handled, recoverable, and expected**: it is what happens for any chain id not described in the user config, which is every local/dev chain that has not been declared. Nothing downstream treats it as a failure.

Three smaller things in the same line:

1. **Severity.** `console.error` for a condition the same function immediately recovers from. Everything else in the repo logs through `named-logs` (`const logger = logs('rocketh')`), so this is also the odd one out on transport, not just level.
2. **Double space.** When `chainConfig` is undefined the template interpolates an empty string between two spaces, giving `chain with id 31337  has no public info`. Cosmetic, but it is user-visible and it is in the message a user will paste into a search box.
3. **Unconditional.** There is no way for a caller who knows the chain is a local one to say so and silence it, short of supplying a full `info` block.

## Why it matters beyond cosmetics

Anything that captures or classifies rocketh's output by severity gets a false positive on a healthy run. The playground widget was the first such consumer; a CI log scraper or an editor plugin that highlights stderr would be the next. Note `@rocketh/test-utils` already carries a comment about this exact line (`packages/rocketh-test-utils/src/test-environment.ts:330`), so it has been stepped around at least once before.

## What was done instead of changing it

`@rocketh/playground` declares the chain it just booted in its own `chains` config (`buildUserConfig`, `packages/rocketh-playground/src/core/playground.ts`), so rocketh recognises the id and the branch never fires. That is the correct fix for the widget: the playground genuinely knows its chain. It does **not** address the general case, and it was chosen over matching the message text downstream, which would have suppressed real errors that happened to be worded similarly.

## Open question

Should this become `logger.info`/`logger.warn` (matching the rest of the repo's `named-logs` usage), and should the double space be fixed at the same time? It is a behaviour change to a published package's output, so it wants a decision rather than a drive-by edit: someone may be grepping stderr for it today.
