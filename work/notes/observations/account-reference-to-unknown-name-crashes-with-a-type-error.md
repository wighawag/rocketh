---
title: 'A named account that references a name not in the config crashes with a raw TypeError'
type: observation
status: spotted
spotted: 2026-09-25
---

Measured 2026-09-25 through `createTestEnvironment` on `localhost`: `accounts: {owner: 'nosuchname'}` crashes environment construction with `TypeError: Cannot use 'in' operator to search for 'localhost' in undefined`. The reference branch of `getAccount` in `packages/rocketh/src/environment/index.ts` recurses with `accounts[accountDef]`, which is `undefined` for an unknown name, and the per-network branch then runs `in` on it. Same shape as the `null` crash fixed by `null-account-entry-crashes-with-a-type-error`, but a typo'd reference should get a readable refusal rather than mean "absent". Reference cycles (`a: 'b', b: 'a'`) are also undetected there (v1 had none either).
