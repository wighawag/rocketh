# Framework-agnostic, browser-capable core

Deployment logic is kept independent of any filesystem or framework, with the runtime split into executor adapters (`@rocketh/node` for filesystem, `@rocketh/web` for the browser) and a rule against synchronous FS in shared packages. The driving goal is that **rocketh deploy scripts can run in the browser**: deploying a whole set of contracts client-side enables offline versions of games, tutorials, and live playgrounds (think a Remix-style editor). That capability is judged worth the cost of keeping the core adapter-agnostic.
