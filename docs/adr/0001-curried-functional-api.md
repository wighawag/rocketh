# Curried, functional API instead of classes

Rocketh's API is functional and curried (`deploy(env)(name, args)`) rather than class-based (`new Deployer(env).deploy(...)`). The curried shape was chosen to **preserve type safety when functionality is added as an extension**: each extension is a function that takes the environment and returns a typed operation, so user-chosen or user-reimplemented extensions compose without losing the generic ABI typing a class hierarchy would erode.
