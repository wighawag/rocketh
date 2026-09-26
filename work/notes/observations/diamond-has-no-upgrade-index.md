---
title: '`@rocketh/diamond` does not accept `upgradeIndex`, though the v1 feature-surface finding says it does'
type: observation
status: spotted
spotted: 2026-09-26
---

Spotted while writing the v1-to-v2 capability map. `work/notes/findings/hardhat-deploy-v1-feature-surface.md` §D lists diamond `upgradeIndex` as "present through the shared helper (`packages/rocketh-proxy/src/utils.ts:34-59`)", but `grep -rn 'upgradeIndex\|checkUpgradeIndex' packages/rocketh-diamond/` returns nothing and `DiamondDeployOptions` (`packages/rocketh-diamond/src/types.ts`) has no such field, so a v1 diamond script using `upgradeIndex` has no rocketh equivalent. The map (`documentation/migration/index.md`, "Diamonds") states the code's answer without a decided label, because no maintainer decision covers it; whether it should be added, or dropped by decision, is open.
