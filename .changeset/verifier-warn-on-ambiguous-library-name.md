---
'@rocketh/verifier': patch
---

Verification no longer picks a library's defining source in silence. When a deployment carries no usable `linkReferences` and the metadata scan finds more than one candidate source for a linked library, the verifier now warns on `console.warn` with the library name, every candidate path and the one it chose, and says whether the candidates came from the AST scan (real duplicate declarations) or the raw-source text scan (where a match may be a comment or string literal). Which candidate wins is unchanged, and the unambiguous paths (`linkReferences`, or a single candidate) stay silent.
