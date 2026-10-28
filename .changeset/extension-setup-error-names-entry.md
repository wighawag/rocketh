---
'@rocketh/core': patch
---

When an extension entry throws while a deploy script's environment is being set up (every entry is called with the environment before the script runs, whether or not the script uses it), the error now names the entry: `extension entry "<name>" threw while the environment was being set up (...): <original message>`. The same error object is rethrown, so code catching it by class still does.
