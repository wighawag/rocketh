---
'@rocketh/playground': patch
---

Fix the `./element` bundle, which the previous `sideEffects` change emptied: the package's own vite build read `"sideEffects": ["./dist/element/**"]` for the element's SOURCE too, so it dropped `src/ui/element.ts`'s bare `import './Playground.svelte'` and shipped a file that registers nothing. `./src/ui/**` is now listed as well, and a test checks that the built bundle calls `customElements.define`.
