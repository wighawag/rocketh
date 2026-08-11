<!-- dorfl-sidecar: item=observation:format-check-covers-src-only-2026-08-10 type=observation slug=format-check-covers-src-only-2026-08-10 allAnswered=false -->

Item: [`observation:format-check-covers-src-only-2026-08-10`](../notes/observations/format-check-covers-src-only-2026-08-10.md)

## Q1

**Should this observation be resolved jointly with 'test-files-are-outside-pnpm-typecheck-2026-08-09' as one 'widen per-change tooling to cover test/**' change (single task covering format:check + typecheck globs), or kept as a separate ticket?**

> The note explicitly flags the same-shape sibling: 'Same shape as test-files-are-outside-pnpm-typecheck-2026-08-09: the repo's per-change tooling is scoped to src, while test/ is where the integration-tests-as-documentation convention says the value is.' Both observations are still open under work/notes/observations/. Widening either glob alone leaves the other half of the gap.

_Suggested default: Promote a single combined task that widens format:check AND typecheck globs to packages/*/{src,test}/**/*.ts, and first lands a pure-formatting commit reformatting the three drifted test files so the glob-widening diff is minimal._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**When the glob is widened, should the three already-drifted test files (rocketh-read-execute/test/unknown-signer-contract.integration.test.ts, rocketh-unknown-signer/test/catchUnknownSigner.integration.test.ts, rocketh/test/addressSignability.test.ts) be reformatted in a separate pure-formatting commit ahead of the widening, or bundled into the same commit?**

> Verified against package.json: root scripts are 'format' and 'format:check' with glob packages/*/src/**/*.ts. The observation warns: 'widening the glob later will produce a diff touching unrelated files.' Sequencing matters for reviewability of the eventual PR.

_Suggested default: Separate pure-formatting commit first, then the glob-widening commit — keeps the tooling change reviewable and the formatting change trivially verifiable._

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):
