---
'@rocketh/playground': patch
---

Declare `"sideEffects": ["./dist/element/**"]`, so a bundle that imports only `captureConsole` / `createLogStream` from the root no longer carries the GreetingsRegistry fixtures and the rocketh extensions they import. `@rocketh/playground/element` stays listed because importing it registers the `<rocketh-playground>` custom element.
