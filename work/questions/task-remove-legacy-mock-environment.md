<!-- dorfl-sidecar: item=task:remove-legacy-mock-environment type=task slug=remove-legacy-mock-environment allAnswered=false -->

Item: [`task:remove-legacy-mock-environment`](../tasks/ready/remove-legacy-mock-environment.md)

## Q1

**What version bump should the breaking removal of the createMockEnvironment export from @rocketh/test-utils carry?**

> Pre-existing open question in work/tasks/ready/remove-legacy-mock-environment.md (front-matter needsAnswers: true, Open questions §1). @rocketh/test-utils is published at 0.x, so a minor is the conventional signal of a break at this stage, but repo convention flags any breaking change for human confirmation rather than agent decision. The task requires a changeset with a migration line (switch to createTestEnvironment and await it); the bump chosen here is what that changeset will encode.

_Suggested default: Minor bump (0.x convention for a breaking change pre-1.0), with a one-line migration note pointing callers to createTestEnvironment and to await it._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

**Minor.** `@rocketh/test-utils` stays PUBLISHED and becomes properly documented, so removing an export is a real break for consumers, and at `0.x` a minor is the conventional signal for that. Write the changeset as `minor` with a migration line (switch to `createTestEnvironment`, and `await` it) and do NOT stop to ask again: this answer IS the human confirmation the convention asks for.

Context for whoever builds it: the package is on npm (currently 0.2.6, ~392 downloads/month) but is mentioned nowhere in the user-facing `documentation.md` or `README.md` — only in the contributor-facing `TESTING.md`. That gap is being closed by `test-env-harness`, which now owns documenting the package and `createTestEnvironment` for external users. So by the time this removal lands, the package genuinely has an audience and the break genuinely matters.
