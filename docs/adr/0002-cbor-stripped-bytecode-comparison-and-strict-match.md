# CBOR-stripped bytecode comparison by default; proxies always strict-off

When deciding whether an existing deployment can be reused (vs redeployed), we compare the deployed (runtime) bytecode with the trailing **CBOR metadata stripped off** by default, so that a difference confined to the appended compiler-metadata does not count as a real change. A `strictBytecodeMatch` option forces an exact, full-bytecode comparison. Proxy deployments hard-code `strictBytecodeMatch: false`.

**Why:** two compilations of the same source frequently differ only in their appended CBOR metadata; treating that as a code change would cause needless redeployments. So the useful default is to compare the meaningful code and ignore the metadata tail, with `strictBytecodeMatch` available when an exact match is genuinely wanted.

Proxies are forced non-strict because a proxy contract is **not supposed to change** — its code is fixed. If a proxy's bytecode genuinely differs it should be a deliberate redeployment, not something a strict-match check flags on incidental grounds; so the metadata-insensitive comparison is the correct (and only sensible) behaviour for proxies.
