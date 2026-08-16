<!-- dorfl-sidecar: item=observation:chain-info-missing-logged-as-error-2026-08-16 type=observation slug=chain-info-missing-logged-as-error-2026-08-16 allAnswered=false -->

Item: [`observation:chain-info-missing-logged-as-error-2026-08-16`](../notes/observations/chain-info-missing-logged-as-error-2026-08-16.md)

## Q1

**Should the 'chain with id X has no public info' line be switched from console.error to named-logs (logger.info or logger.warn), and should the double-space bug in the message be fixed at the same time?**

> Verbatim open question from the observation body. Site: packages/rocketh/src/environment/chains.ts:69, where the condition is recovered immediately (a defaultChainInfo is built). The rest of the repo logs via named-logs. Double space appears when chainConfig is undefined: 'chain with id 31337  has no public info'. This is a behaviour change to a published package's stderr output (someone may be grepping for it), which is why the observation asks for a decision rather than a drive-by edit. @rocketh/test-utils already carries a comment about this same line (packages/rocketh-test-utils/src/test-environment.ts:330).

_Suggested default: Switch to logger.warn via named-logs and fix the double space in the same change; keep the message text otherwise identical so existing greps still match on the substring 'has no public info'._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
