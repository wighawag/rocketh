# `execute` silently drops `dataSuffix` and `type`

2026-09-25. `execute` in `packages/rocketh-read-execute/src/index.ts` (the `txParam` literal, around line 315) takes viem's write-contract parameters, whose type accepts `dataSuffix` and `type`, but the literal never reads either: a suffix is not appended and a `type: 'legacy'` still goes out as type 2. The same defect was fixed for `deploy` (honour or refuse, never drop); `execute` was out of that task's scope. The blob and `authorizationList` fields there were not checked either.
