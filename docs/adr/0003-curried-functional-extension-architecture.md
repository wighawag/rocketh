# Curried, functional extension architecture (no classes)

Extensions augment the environment through curried functions (`deploy(env) => (name, args) => …`) that are merged into a single object and passed to the setup functions, rather than through classes or plugin-instance objects. This is also encoded as a project convention in `AGENTS.md`.

**Why:** to keep extensions **type-safe**. With the curried/functional composition, the concrete types of each extension's functions flow through to the assembled environment, so callers get precise typing per extension. A class- or generic-plugin-based design would erase those specifics — the environment's surface would collapse to generic types and lose the per-extension type information.
