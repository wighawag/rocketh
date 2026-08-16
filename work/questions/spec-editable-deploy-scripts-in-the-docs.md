<!-- dorfl-sidecar: item=spec:editable-deploy-scripts-in-the-docs type=spec slug=editable-deploy-scripts-in-the-docs allAnswered=false -->

Item: [`spec:editable-deploy-scripts-in-the-docs`](../specs/proposed/editable-deploy-scripts-in-the-docs.md)

## Q1

**Transpiler: which one, and is TypeScript required at all?**

> Spec Open Q1. Tutorial deploy scripts are TypeScript but use no types the reader must write. Options: sucrase (~500KB, strips types), esbuild-wasm (~10MB, real compiler with real errors), or JavaScript-only (no transpiler, zero dependency). The JS-only option is genuinely viable and should be rejected deliberately, not by default — it removes the single largest dependency in this spec. Further Notes flags bundle size as the constraint most likely to be underestimated (page already ships ~1.6MB behind the run button; 10MB esbuild-wasm would dwarf the rest of the site).

<!-- q1 fields: id=q1 -->

**Your answer** (write below this line):

## Q2

**How far can the reader stray — editing arguments to deployViaProxy, or arbitrary script bodies?**

> Spec Open Q2. Editing arguments (prefix, tags, execute) is a much smaller problem solvable with a structured editor and no module resolution. Editing the whole script body is more powerful and much harder. This decision changes the size of the work by an order of magnitude (per the spec's own autonomy note).

<!-- q2 fields: id=q2 -->

**Your answer** (write below this line):

## Q3

**Whose imports resolve — is there a module registry for bare specifiers, or does the script body just run with env and artifacts already in scope?**

> Spec Open Q3. Option A: reader writes 'import {…} from @rocketh/deploy' and the page maps bare specifiers to pre-bundled modules. Option B: script body is evaluated with env and artifacts pre-injected — cheaper, but slightly less honest since the on-screen code is not a file that would run as-is locally.

<!-- q3 fields: id=q3 -->

**Your answer** (write below this line):

## Q4

**What happens to a broken edit — compile error, revert to last-good, or run and let it throw?**

> Spec Open Q4. A tutorial where a reader can wedge themselves and cannot get back is worse than one that cannot be edited at all. Relates to user stories 4 (syntax errors reported clearly before chain), 5 (runtime failures appear as real failures) and 6 (one-press way back).

<!-- q4 fields: id=q4 -->

**Your answer** (write below this line):

## Q5

**Is the editor a fifth STEP, or a mode over the existing four?**

> Spec Open Q5. A 'now you try' step at the end preserves the current four-step narrative and is additive. An editable version of every step is a bigger change and risks turning a story into a sandbox.

<!-- q5 fields: id=q5 -->

**Your answer** (write below this line):

## Q6

**Does an edited script need to survive a reload (localStorage / shareable URL)?**

> Spec Open Q6. Persisting is cheap and makes the feature much more useful, and enables sharing. It also introduces a versioning problem the moment the tutorial changes. 'Sharing or persisting edits' is listed as Out of Scope unless this question is answered otherwise.

<!-- q6 fields: id=q6 -->

**Your answer** (write below this line):
