---
title: 'Injectable fake prompt in @rocketh/test-utils for extension-package tests'
slug: injectable-prompt-executor-for-extension-tests
spec: unknown-signer-interactive
blockedBy: [prompt-capability-on-the-environment]
covers: [7]
---

## What to build

A small, shared test double so EXTENSION packages can drive the interactive unknown-signer path without a TTY: a fake prompt that answers with a canned transaction hash, or with "cannot sign", and that records what it was asked.

This exists because of the two-homes split this project settled on. Work inside `packages/rocketh` (the seam, the policy, the resolver) is tested there with a locally-built real environment, because `rocketh` must not depend on `@rocketh/test-utils`. Work in the EXTENSION packages (`@rocketh/unknown-signer`, `@rocketh/deploy` and friends) uses the shared harness, and those tests need this fake.

Deliberately small. The capability already rides the resolved run parameters, and the shared harness already accepts a partial pass-through of them, so this needs NO new harness API and no new construction path. If you find yourself adding a harness option, stop: that is a sign the capability plumbing did not land as intended, and it is a needs-attention signal rather than something to work around.

Also worth covering here: a fake that OMITS the text capability, so an extension-package test can assert the non-interactive degradation without hand-rolling one.

## Acceptance criteria

- [ ] `@rocketh/test-utils` exports a fake prompt builder that can be configured to answer with a canned transaction hash, or with "cannot sign".
- [ ] It also supports the CAPABILITY-ABSENT shape (no text method at all), so a test can drive the degrade-to-throw path without hand-rolling a stub.
- [ ] It records the requests it received, so a test can assert WHETHER a prompt was consulted and with what message. Asserting that no prompt was consulted is a real requirement of a sibling task, so this must support it.
- [ ] It is injected through the harness's EXISTING run-parameter pass-through. NO new option is added to `createTestEnvironment`. If one appears necessary, route to needs-attention instead.
- [ ] At least one test in an extension package drives the interactive path end to end using it, proving the shared route works and serving as the documentation example.
- [ ] It does NOT fabricate an environment or reimplement any broadcast path. This package removed its fabricated stand-in deliberately, and `CONTEXT.md` keeps the glossary entry specifically so the two notions are not re-forked. There is exactly one environment builder here; do not add a second.
- [ ] `@rocketh/test-utils` is PUBLISHED, so a new export is a real API addition: the changeset carries the appropriate bump and one line saying what it is for.
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm format:check` and `pnpm test` pass.

## Blocked by

- `prompt-capability-on-the-environment`: supplies the prompt abstraction's text variant and the run-parameter route this fake is injected through. File-orthogonal to the resolver tasks, so it may run in parallel with `ask-policy-interactive-resolver`.

## Prompt

> Goal: give extension-package tests a shared, injectable fake prompt so the interactive unknown-signer path is drivable without a TTY.
>
> FIRST, check this task against current reality (it is a launch snapshot and may have DRIFTED). Confirm the prompt capability rides the resolved run parameters and that the shared harness passes a partial version of those through. If it landed differently, this task's central claim (that no new harness API is needed) may be false, which is a needs-attention signal rather than something to route around.
>
> Where to look. The shared harness is `createTestEnvironment` in `@rocketh/test-utils`, which builds a REAL rocketh environment against a mock EIP-1193 provider and already accepts a partial run-parameter pass-through. The prompt abstraction it carries is the one widened by the blocking task, where the presence or ABSENCE of the text method is itself the capability signal, so the capability-absent fake is simply one without that method.
>
> Keep this SMALL and honest. This package recently deleted a fabricated environment stand-in that reimplemented the broadcast path, precisely because no test using it ever executed the real environment module. There is now exactly ONE environment builder here, and a regrowth-fence test asserts it. You are adding a PROMPT double, not an environment double: do not fabricate an environment, do not reimplement broadcasting, and do not add a second builder under any name.
>
> Make it assert-friendly. A sibling task must prove that `catchUnknownSigner` defers WITHOUT consulting a prompt, which requires observing that the fake was never asked. Record requests, and expose them plainly enough that such an assertion reads clearly.
>
> Test homes, per `CONTEXT.md` under _test environment_: this fake serves the EXTENSION packages. Tests inside `packages/rocketh` build their own local fake, because `rocketh` must not depend on `@rocketh/test-utils` (that edge closes an nx project-graph cycle and fails `pnpm build`). Do not try to unify the two; two real-environment builders on opposite sides of that dependency edge is the intended shape.
>
> Note this package is PUBLISHED (it has real consumers), so treat a new export as a genuine API addition and write the changeset accordingly.
>
> Done means: an extension-package test drives the interactive path with a canned hash, another drives the degrade path with a capability-absent fake, both through the existing harness pass-through, and no new environment builder exists.
