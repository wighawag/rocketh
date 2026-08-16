---
title: 'Editable Deploy Scripts in the Documentation Playground'
slug: editable-deploy-scripts-in-the-docs
needsAnswers: true
---

> Launch snapshot — records intent at creation, NOT maintained. Current truth: `docs/adr/` (decisions) + the code; remaining work: `work/tasks/ready/` tasks.

<!-- open-questions -->
<!--
  TRANSIENT BLOCK — stripped by the apply rung on full resolution.
  While the spec has unresolved questions blocking autonomous tasking:
    1. Set `needsAnswers: true` in the frontmatter above.
    2. List the questions under the `## Open questions` heading below.
    3. Clear the flag (and let apply strip this block) once they are answered.
  Delete the whole fenced block — markers and all — if the spec launches fully resolved.
-->

## Open questions

These are the questions that decide the shape of the thing. None of them can be answered from the code; each needs a call.

1. **Transpiler: which one, and is TypeScript required at all?** The deploy scripts in the tutorial are TypeScript, but they use no types the reader must write. `sucrase` (~500KB) strips types and is fast; `esbuild-wasm` (~10MB) is a real compiler with real error messages; accepting **JavaScript only** costs nothing and needs no transpiler at all. The last option is genuinely viable and should be rejected deliberately rather than by default, since it removes the single largest dependency in this spec.
2. **How far can the reader stray?** Editing the ARGUMENTS to `deployViaProxy` (the prefix, the tags, `execute`) is a much smaller problem than editing arbitrary code: it can be done with a structured editor and no module resolution at all. Editing the whole script body is more powerful and much harder. Which of these is the actual goal?
3. **Whose imports resolve?** If the reader may write `import {…} from '@rocketh/deploy'`, the page needs a module registry mapping bare specifiers to pre-bundled modules. If instead the script body is evaluated with `env` and the artifacts already in scope, no resolution is needed at all. The second is far cheaper and slightly less honest, because the code on screen is then not a file that would run as-is.
4. **What happens to a broken edit?** Compile error, revert to last-good, or run and let it throw? A tutorial where the reader can wedge themselves and cannot get back is worse than one that cannot be edited.
5. **Is the editor a fifth STEP, or a mode over the existing four?** A "now you try" step at the end preserves the current narrative and is additive. An editable version of every step is a bigger change and risks turning a story into a sandbox.
6. **Does an edited script need to survive a reload?** Persisting to `localStorage` or to the URL (shareable!) is cheap and makes the feature much more useful; it also introduces a versioning problem the moment the tutorial changes.

<!-- /open-questions -->

## Problem Statement

The documentation playground runs four **fixed** deploy scripts. A reader can watch a proxy be deployed and upgraded, and can read the source on GitHub, but cannot change a line and see what happens. Every question of the form "what if I did X instead" ends at the edge of the widget, which is exactly where curiosity is highest and where the tutorial currently stops being interactive.

The specific questions readers are most likely to have are ones the current tutorial deliberately raises and then answers FOR them: what if the prefix were passed to an initializer instead of a constructor; what if the implementation were not deterministic; what if `execute` were omitted on upgrade. Right now the tutorial demonstrates the answer. It would teach far more if the reader could produce the failure themselves.

The blocker is structural, not cosmetic. `@rocketh/web` takes `ModuleObject[]`, meaning already-imported JavaScript modules, not source text, so every deploy script the playground runs is bundled at build time. Running text the reader typed requires, at minimum, turning that text into a module, and quite possibly resolving the imports it declares.

## Solution

Let the reader edit a deploy script in the page and run it against the same in-browser EVM the rest of the tutorial uses, seeing the same transcript, the same deployment records and the same failures they would see locally.

From the reader's perspective: the tutorial ends with a step whose script is editable. They change something, press run, and either watch it work, watch it revert, or watch it fail with an error that tells them why. Nothing they can type breaks the page, and there is always a way back to the working version.

The value is not that editing is possible; it is that **the failures are real**. A reader who removes `execute` from the upgrade step and watches the prefix silently not apply has learned something no prose can teach as durably.

## User Stories

1. As a reader, I want to edit the source of a deploy script in the documentation page, so that I can try a change without cloning a repo.
2. As a reader, I want my edited script to run against the same EVM and the same deployment store as the earlier steps, so that I can build on what the tutorial already deployed.
3. As a reader, I want the transcript, deployment panel and file list to behave exactly as they do for the fixed steps, so that I do not have to learn a second interface.
4. As a reader, I want a syntax error in my edit to be reported clearly, before anything is sent to the chain, so that I can tell a typing mistake from a deployment failure.
5. As a reader, I want a runtime failure (a revert, a bad argument, a missing deployment) to appear in the transcript exactly as a real failure would, so that I learn what real failures look like.
6. As a reader, I want a one-press way back to the original script, so that I can experiment without fear of wedging the tutorial.
7. As a reader, I want to reset the whole tutorial and start again on a fresh chain, so that an edit that corrupted the state is recoverable.
8. As a reader on a phone, I want the editor to be usable or gracefully degraded to read-only, so that the page is not broken on the device I am holding.
9. As a reader, I want the editable script to be prefilled with the working version, so that I start from something that runs.
10. As a reader who has never written a deploy script, I want the editable step to suggest a specific change to try, so that a blank invitation to experiment does not become a dead end.
11. As a documentation author, I want to mark any step in a `PlaygroundDefinition` as editable, so that the capability is not welded to one tutorial.
12. As a documentation author, I want the editable source and the bundled module to come from the same place, so that the code shown cannot drift from the code that runs.
13. As a maintainer, I want the editor and its transpiler to load only when a reader actually starts editing, so that a documentation page does not carry a compiler for everyone.
14. As a maintainer, I want the core to remain framework-free and headlessly testable, so that "compile this text and run it" is provable without a browser.
15. As a maintainer, I want the editable path to be exercised by the browser suite, so that a feature whose whole point is interaction is not tested only through a node API.

### Autonomy notes (the two gate axes)

- **`humanOnly`** — omitted. Once the open questions are answered the work is concrete and an agent can task it. The questions themselves are the gate.
- **`needsAnswers`** — set. Six of them, and the first three change the size of the work by an order of magnitude. Tasking before they are answered would produce confidently wrong slices.

## Implementation Decisions

Deliberately thin, because the open questions above dominate the design. What IS decided:

- **The seam already exists and should be used.** `PlaygroundDefinition` takes `steps`, and each step carries `modules`. An editable step is a step whose modules are produced at run time from text rather than imported at build time. This is an addition to the core, not a redesign of it.
- **The core stays framework-free.** Turning source text into a `ModuleObject` belongs in `src/core/`, next to the chain and the store, so it can be tested under node. The editor component is UI and belongs in `src/ui/`, behind the same custom-element boundary as everything else.
- **Loading is lazy, and layered.** The EVM and rocketh already sit behind a dynamic import that fires on first press. The editor and any transpiler must sit behind a further one that fires only when a reader starts editing, so the cost lands on the readers who opted in.
- **A step must be able to fail without poisoning the tutorial.** The session already treats a failed step as non-advancing and retryable; an edited step should use that existing behaviour rather than introduce a second failure mode.
- **Reverting is a first-class control, not an undo stack.** The original source is known, so "put it back" is a button, and it needs no history.

## Testing Decisions

- **Headless first.** "Given this source text, produce a module that the executor runs, and these deployments result" is a node test. So is every failure mode: syntax error, a script that throws, a script that deploys nothing. The browser is not required to prove any of that, which matters because the browser suite is opt-in.
- **The browser suite covers what only it can:** that typing into the editor and pressing run produces a transcript, that revert restores the original, and that a broken edit leaves the widget usable.
- **Pin the failures, not just the successes.** The reason this feature exists is that readers can produce real failures; the tests should assert the failures look right, in the same way the current suite pins the missing-prefix bug rather than fixing it.
- **Beware the trap the existing suite already hit.** A widget-level assertion after an action can pass against a FROZEN render if an error stopped the update. Where an assertion could be satisfied by stale DOM, drive the component directly with distinguishable inputs instead. See the `each_key_duplicate` regression in `packages/rocketh-playground/test/element.browser.test.ts`.

## Out of Scope

- **Solidity compilation in the browser.** The reader edits the deploy SCRIPT, not the contract. Compiling Solidity in the page is a much larger problem and would need its own spec.
- **Editing `rocketh/config.ts`.** Accounts, chains and signer protocols stay fixed. The failure modes there are about configuration rather than deployment and would not teach what this feature is for.
- **Deploying to a real network, including Sepolia.** Everything stays in the tab. A wallet, a faucet and a public RPC are a separate step with their own decisions.
- **A file tree, or multiple editable files.** One script at a time.
- **Type checking.** Even if TypeScript is transpiled, no type errors are reported. A reader who writes a type error should see it fail at run time, as they would with `tsx`.
- **Sharing or persisting edits**, unless open question 6 is answered otherwise.

## Further Notes

- The tutorial was deliberately built so this is additive: `PlaygroundDefinition.steps` was introduced for the four-step upgrade story, and an editable step slots into it.
- The most valuable single edit a reader could make is already staged by the existing tutorial: removing `execute: {methodName: 'postUpgrade'}` from step 3 reproduces exactly the bug step 2 demonstrates. That is a strong candidate for the suggested change in user story 10.
- Bundle size is the constraint most likely to be underestimated. The page already ships ~1.6MB behind the run button; a 10MB `esbuild-wasm` would dwarf everything else on the site and is the main reason open question 1 is first.
