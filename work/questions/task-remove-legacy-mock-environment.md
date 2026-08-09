<!-- dorfl-sidecar: item=task:remove-legacy-mock-environment type=task slug=remove-legacy-mock-environment allAnswered=false -->

Item: [`task:remove-legacy-mock-environment`](../tasks/backlog/remove-legacy-mock-environment.md)

## Q1

**What version bump should the breaking removal of the createMockEnvironment export from @rocketh/test-utils carry?**

> Pre-existing open question in work/tasks/backlog/remove-legacy-mock-environment.md (front-matter needsAnswers: true, Open questions §1). @rocketh/test-utils is published at 0.x, so a minor is the conventional signal of a break at this stage, but repo convention flags any breaking change for human confirmation rather than agent decision. The task requires a changeset with a migration line (switch to createTestEnvironment and await it); the bump chosen here is what that changeset will encode.

_Suggested default: Minor bump (0.x convention for a breaking change pre-1.0), with a one-line migration note pointing callers to createTestEnvironment and to await it._

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):
