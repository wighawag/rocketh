<!-- dorfl-sidecar: item=spec:deploy-and-upgrade-hooks type=spec slug=deploy-and-upgrade-hooks allAnswered=false -->

Item: [`spec:deploy-and-upgrade-hooks`](../specs/proposed/deploy-and-upgrade-hooks.md)

## Q1

**Where are hooks declared: config, or per call?**

> Spec Open Q1 (work/specs/proposed/deploy-and-upgrade-hooks.md). Config-level (hooks: {...} in rocketh/config.ts) suits the motivating cross-cutting storage-layout validator; per-call suits one-offs. Author leans config-level only, since a validator you can forget to attach will be forgotten. If both are allowed, precedence must be one rule.

_Suggested default: Config-level only in rocketh/config.ts; a one-off check stays as plain code in the deploy script._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Can a pre-hook MODIFY what happens, or only veto it?**

> Spec Open Q2. Veto-only (return nothing, or throw to abort) is simple; allowing rewrites turns hooks into middleware over privileged governance calls, a large surface to hand third-party packages. Author leans veto-only until a concrete richer case is argued.

_Suggested default: Veto-only: a pre-hook may throw to abort, otherwise the run proceeds unchanged._

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

## Q3

**What exactly identifies the artifact a hook receives?**

> Spec Open Q3. A storage-layout validator needs ABI, storage layout from compiler output, proxy address, current impl and incoming impl addresses. First two come from the artifact, but the spec must not assume shape without checking what @rocketh/deploy and @rocketh/proxy actually have in hand at pre/post points. Enumerate before designing.

_Suggested default: Enumerate the fields available at each of the four positions in packages/rocketh-deploy and packages/rocketh-proxy, then pin a concrete payload type per position._

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

## Q4

**Does a hook run in the browser?**

> Spec Open Q4. rocketh core is browser-capable (ADR 0002). A hook is user code and can touch the filesystem. Either hooks are declared Node-only (browser runtime refuses them loudly) or the contract states a hook must not assume a filesystem. Decide, do not leave it to discovery.

_Suggested default: Contract states a hook must not assume a filesystem; Node-only hooks are opted into explicitly and refused loudly by the browser runtime._

<!-- q4 fields: id=q4 -->

**Your answer** (write below this line):
