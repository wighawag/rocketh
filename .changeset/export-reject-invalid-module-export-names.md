---
'@rocketh/export': patch
---

Refuse to write a module export whose deployment name is not a JavaScript identifier.

The module output modes (`--tsm` / `--jsm`) emit one named export per deployment:

```ts
export const ${contractName} = {...} as const;
```

so the deployment name stops being data and becomes SOURCE. Nothing validated it. A name that is a perfectly good file name and a perfectly good JSON key, `Token-V2`, `My Registry`, or `default`, produced a generated file that does not parse. The failure then surfaced in the consuming application's build, pointing at generated code, with nothing naming the deployment that caused it, while `rocketh-export` itself had exited 0.

`run()` now throws `InvalidModuleExportNameError` (an `ExportError`, so the CLI reports it on stderr with exit 1) before writing either module file, listing EVERY offending name rather than the first, so one run fixes them all:

```
cannot export environment 'sepolia' as a module: a deployment name is not a valid JavaScript identifier
  - "Token-V2"
  --tsm/--jsm emit `export const <name> = ...`, so each deployment name becomes an identifier.
  either rename the deployment, or export with --ts/--js/--json, which keep names as object keys
```

**It refuses rather than sanitising.** Rewriting `Token-V2` to `Token_V2` would emit a file that parses, at the cost of an export name the consumer cannot predict from their own deploy script, and one that no longer matches the key the same deployment gets in the `--json` / `--ts` object modes. Silently renaming the identifier someone has to `import` fails later and somewhere else, which is the failure mode this package has been closing off elsewhere.

The check covers reserved words as well as shape, since `default` and `class` have an identifier's shape but cannot follow `export const`. `undefined`, `NaN` and `Infinity` are deliberately allowed: they are shadowable bindings, so `export const undefined = ...` is legal, and refusing a legal name would be the same overreach as renaming one.

The object modes are unaffected and keep the name exactly, which is what the message points at as the way out. Tests cover the refusal, the multi-name report, and that the same deployment still exports fine through `--json` / `--ts`.
