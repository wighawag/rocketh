---
'@rocketh/core': patch
'rocketh': patch
'@rocketh/unknown-signer': patch
---

Replace `pushUnknownSignerPolicy` / `popUnknownSignerPolicy` on the environment with a single `runUnderUnknownSignerPolicy(frame, action)`.

```ts
// before
env.pushUnknownSignerPolicy({policy: 'throw'});
try {
	await action();
} finally {
	env.popUnknownSignerPolicy();
}

// after
await env.runUnderUnknownSignerPolicy({policy: 'throw'}, () => action());
```

Behaviour is unchanged: same precedence (innermost frame, else the run's `onUnknownSigner`), same capability ceiling degrading `'ask'` to `'throw'` where no human can be reached, same invariant that a frame never turns a signable account into a throw. `catchUnknownSigner` and `withUnknownSignerPolicy` are untouched at the surface, so no deploy script changes.

**Why one verb instead of two.** A stranded frame is no longer representable: the environment owns both ends of the scope, so a caller cannot forget the `finally`, and an unbalanced pop (a documented no-op, which meant a leaked policy announced itself only as changed behaviour much later) cannot be written at all.

**And it is what unblocks the concurrency limitation.** The policy scope is dynamic scope over a sequential run, so `Promise.all` of two actions inside one `catchUnknownSigner` shares one frame and leaks it between them, in both directions since `'ask'` landed (ADR 0006). Fixing that means a scope that follows the ASYNC CAUSAL CHAIN rather than wall-clock time, so that work started inside the wrapper inherits the frame and work started outside it does not: `AsyncLocalStorage` on Node, `AsyncContext` when it reaches browsers.

What stood in the way was not the storage, it was this API. Two independent verbs can only be backed by ambient mutable state, so the frame stack was part of the published contract of `@rocketh/core` and could not be swapped without a second breaking change. It is now an implementation detail of one method, and `AsyncLocalStorage` being Node-only is not a blocker either: ADR 0007 already established the pattern for a capability only some runtimes provide, injected on the environment by `@rocketh/node`, with a fallback elsewhere.

The leak itself is NOT fixed here, and the limitation stands until that work lands. This removes the reason it could not be fixed cheaply.

Only code that drove the seam directly is affected. Nothing in `@rocketh/deploy`, `@rocketh/proxy`, `@rocketh/diamond` or `@rocketh/read-execute` called these.
