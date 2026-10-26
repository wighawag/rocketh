# Deploying guide puts diamond `facets` in the wrong argument

2026-10-26. The first example under "Deploying Diamonds" in `documentation/deploying/index.md` passes `facets` inside the second argument (`{account, facets}`), but `DiamondDeploymentConstruction` has no `facets`: it is a required field of the third argument (`DiamondDeployOptions`). It also lists the default cut/loupe/ownership facets explicitly, which `diamond` already adds by default. Spotted while documenting `execute`; not changed.
