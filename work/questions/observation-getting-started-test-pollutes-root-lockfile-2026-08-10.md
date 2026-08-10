<!-- dorfl-sidecar: item=observation:getting-started-test-pollutes-root-lockfile-2026-08-10 type=observation slug=getting-started-test-pollutes-root-lockfile-2026-08-10 allAnswered=false -->

Item: [`observation:getting-started-test-pollutes-root-lockfile-2026-08-10`](../notes/observations/getting-started-test-pollutes-root-lockfile-2026-08-10.md)

## Q1

**Which of the three fixes should be adopted: scaffold outside the repo (temp dir), run install with --ignore-workspace, or restore pnpm-lock.yaml after the step?**

> The observation lists three options and explicitly notes it did not choose. The first two remove the cause; the third only stops the bleeding. A decision is needed before a task can be written.

_Suggested default: Scaffold the getting-started project outside the repo in a temp dir, since it removes the root cause and keeps the README exercise realistic (no --ignore-workspace flag a real user would not pass)._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**Should the fix also add a CI guard that fails when a run leaves pnpm-lock.yaml dirty, so future regressions of this class are caught at the gate rather than by a lucky reviewer?**

> All three prior escapes (acceptance gate, PR review, Gate-3, independent review) missed this because none diffed the lockfile. Even after fixing test:getting-started, other scripts could reintroduce lockfile drift; a git-diff-after-verify check would generalize the defense.

_Suggested default: Yes — add a post-verify check that `git diff --exit-code pnpm-lock.yaml` (and ideally the whole tree) is clean, as a cheap, generic guard independent of which script caused the drift._

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):
