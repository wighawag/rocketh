---
---

`@rocketh/playground` is marked private so the release job stops failing on it. This repo publishes through npm Trusted Publishing (OIDC), and npm ties a trusted publisher to an already-existing package, so OIDC cannot create a brand-new one: the first Version Packages merge published the other eight packages and then failed the whole job with `E404 Not Found - PUT /@rocketh%2fplayground`. Changesets still versions it and keeps its changelog (`privatePackages: {version: true, tag: false}`); it just never reaches the registry. The README records the ordered steps to publish it for real later.
