# Spike: which editor for the playground

Throwaway evidence for question 6 of `work/specs/proposed/playground-app.md`. Not built by the workspace, not meant to be merged.

Three pages, each loading the same deploy script (`src/sample.ts`) next to a small stand-in for rocketh's typed API: a `deploy` whose `args` is checked against the artifact's constructor, the way the real one checks it. Line 14 passes a number where the constructor takes a string, so a type-aware editor must flag exactly that line.

- `cm.html`: CodeMirror 6 (`codemirror` 6.0.2, `@codemirror/lang-javascript` 6.2.5), TypeScript syntax only.
- `cm-ts.html`: the same, plus the TypeScript 6.0.3 language service in a worker through `@valtown/codemirror-ts` 2.3.1 and `@typescript/vfs` 1.6.6 (lint, completion, hover), with the ES2022 lib files bundled, not fetched from a CDN.
- `monaco.html`: Monaco 0.57.0 with only its TypeScript and Solidity languages registered, and its own TypeScript worker.

`measure.mjs` serves the build, opens each page in a fresh headless Chromium context and prints what it measured.

```bash
pnpm install && pnpm build && node measure.mjs
```

## Measured (2026-11-18, headless Chromium from Playwright 1.62.1, Linux x64, local server, cold cache)

| Page                                | Fetched (raw) | Fetched (gzip) | Editor ready | First type error shown | Finds the line 14 error |
| ----------------------------------- | ------------- | -------------- | ------------ | ---------------------- | ----------------------- |
| CodeMirror, syntax only             | 495 KB        | 166 KB         | 21 ms        | n/a                    | no (no types)           |
| CodeMirror + TS service in a worker | 4.5 MB        | 1.2 MB         | 392 ms       | 516 ms                 | yes                     |
| Monaco (TS and Solidity only)       | 11.0 MB       | 2.6 MB         | 34 ms        | 805 ms                 | yes                     |

The CodeMirror TS page also reported `Cannot find name 'console'`: the spike gave it the ES2022 lib only. A real setup adds a `console` declaration (or the `dom` lib), which Monaco ships by default.

## What it shows

- **Both type-aware setups catch the error rocketh's typed API exists for**, a constructor argument of the wrong type, before anything runs. That is the reason to have types in the editor at all, and it needs rocketh's `.d.ts` files (and the artifact types generated from the last compile) fed into the language service. The spike used a stand-in; the size of the real declarations is not measured.
- **The TypeScript worker can also be the transpiler.** A language service already holds TypeScript, so `ts.transpileModule` strips the types of the scripts before they run, and a separate transpiler (sucrase) is only worth adding with the syntax-only editor.
- **Monaco is about twice the bytes** (2.6 MB against 1.2 MB gzip), and its README answers "Is the editor supported in mobile browsers?" with "No." CodeMirror 6 is built on `contenteditable` and works on phones.
- **Monaco is VS Code**: the TypeScript experience (completion, hover, rename, go to definition, multi-cursor, command palette) works out of the box, and it has Solidity highlighting built in. CodeMirror needs `@valtown/codemirror-ts` for TypeScript and `@replit/codemirror-lang-solidity` (MIT) for Solidity, and its TypeScript features are fewer.
- **TypeScript 7 is the native (Go) compiler and does not run in a browser tab**; an in-tab language service is TypeScript 6, the last JavaScript release, which is what both setups use.
- Licences: CodeMirror MIT, `@valtown/codemirror-ts` ISC, `@typescript/vfs` MIT, TypeScript Apache-2.0, Monaco MIT.
