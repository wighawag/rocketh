---
title: "hardhat-deploy's v1 entry point links `migration-from-v1.html`, an address the site does not serve"
type: observation
status: spotted
spotted: 2026-10-27
---

# What was seen

Spotted while restructuring the documentation, by reading the code and the site's build; not verified by running a v1 project.

`packages/hardhat-deploy/src/v1-entry.cjs` (the `require` export, what a hardhat-deploy v1 configuration loads by mistake) points users at:

```js
const MIGRATION_URL = 'https://rocketh.dev/hardhat-deploy/documentation/how-to/migration-from-v1.html';
```

No build of rocketh.dev has served that address: a page in a folder (`how-to/migration-from-v1/index.md`) is published at `/hardhat-deploy/documentation/how-to/migration-from-v1/`, and GitHub Pages does not map `<name>.html` to `<name>/index.html`. The documentation restructure moves the page to `/hardhat-deploy/migration/step-by-step/` and forwards the folder address (`_redirects.yaml`), but a forwarding page cannot be written for an address ending in `.html` (the site's redirects are folder routes), so the `.html` link keeps landing on the 404 page.

# Why it matters

It is the one link a v1 user sees at the moment they discover v2 is not a drop-in upgrade, and it is dead.

# Fix shape

Change the constant to `https://rocketh.dev/hardhat-deploy/migration/step-by-step/` (a source change, with a hardhat-deploy patch changeset), or to the capability map, `https://rocketh.dev/hardhat-deploy/migration/`, which is the page that answers "can my project move".
