---
title: 'The VitePress build pre-renders every page WITHOUT its content: SSR throws "vitepress data not properly injected in app" and the build still exits 0'
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

`pnpm docs:build` on a clean checkout of `origin/main` (commit `5ed00b63`, `pnpm install --frozen-lockfile`) prints, during "rendering pages", a stack of

```
Error: vitepress data not properly injected in app
    at useData$1 (.vitepress/.temp/app.js:...)
TypeError: Cannot read properties of null (reading 'ce')
    at renderSlot (@vue/runtime-core@3.5.40 ...)
```

and then reports `build complete` with exit code 0. The generated HTML carries the layout shell but not the page body: `curl -s https://rocketh.dev/documentation/fork-runs/ | grep -c "attaches to a fork"` returns `0` on the live site (2026-10-27), although that heading is on the page once JavaScript has run.

The lockfile resolves two Vue copies side by side: `@vue/runtime-core` 3.5.40 and 3.5.44, `@vue/shared` 3.5.40 and 3.5.44, with `@vue/server-renderer` 3.5.44. Two runtime copies during SSR is a classic cause of "injected data is null" (the provide/inject context lives in one copy and is read from the other). Unverified: that is the suspected mechanism, not a confirmed one.

# Why it matters

Readers without JavaScript, search engines and any crawler-based tool (including the dead-link crawl the planned SvelteKit docs template relies on) see empty pages. The build passing hides it: nothing goes red.

# Not done here

Found during the documentation audit, which changes no build configuration. Candidate directions for whoever picks it up: dedupe Vue in the lockfile (a `pnpm.overrides` pin or a dedupe), or check whether the `<rocketh-playground>` custom-element handling is involved; and make the docs build fail on SSR errors so this cannot recur silently.

## Update 2026-10-27: the site left VitePress

rocketh.dev now builds with wighawag/rocketh-website (SvelteKit, from the template-svelte-docs template), and `.vitepress/` and the vitepress dependency are gone from this repository. On that build the prerendered HTML carries each page's body: `grep -c "attaches to a fork" web/build/documentation/fork-runs/index.html` returns `3`, where the VitePress build gave `0`, and the site's end-to-end suite (`web/e2e/tests/rocketh.e2e.ts`, "serves every address the previous site served") asserts that every page's static HTML holds its article. The VitePress mechanism above was never confirmed and no longer applies. Whether this note can now be discharged is left to a human.
