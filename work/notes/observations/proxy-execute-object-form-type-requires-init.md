---
title: "`deployViaProxy`'s `execute: {init, onUpgrade}` TYPE requires `init`, while the runtime and the docs treat it as optional"
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

Spotted during the documentation audit (branch `docs/audit-and-accuracy`), not verified by running a type check.

`ProxyDeployOptions['execute']` in `packages/rocketh-proxy/src/index.ts` declares the explicit form as:

```ts
| {
		init: string | {methodName: string; args?: any[]};
		onUpgrade?: string | {methodName: string; args?: any[]};
  }
```

so `init` is REQUIRED in the type. Everything else treats the two keys as independent and optional:

- the runtime branches on `typeof options.execute.onUpgrade` and `typeof options.execute.init` separately, and the mixed-form refusal tests `'init' in options.execute || 'onUpgrade' in options.execute`;
- `@rocketh/diamond`'s matching option types both as optional (`{init?, onUpgrade?}`), and `documentation/deploying/index.md` and the diamond README say "both optional";
- `packages/rocketh-proxy/README.md` ("Telling an upgrade story with `upgradeIndex`") shows `execute: {onUpgrade: 'postUpgrade'}` with no `init`, which by the type above should not compile in a typed deploy script.

# Why it matters

A user adding an upgrade step (the exact case `upgradeIndex` exists for) is told by the README to write a value the compiler refuses, or, reading the type, is pushed into inventing an `init` for a proxy that already exists.

# Not done here

The audit changes no source code, and which side is wrong (the type, or the README sample) is a decision for whoever owns `@rocketh/proxy`. The README sample was left as it is.
