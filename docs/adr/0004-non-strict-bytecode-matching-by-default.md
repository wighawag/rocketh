# Non-strict bytecode matching by default

Deployment re-use matching strips the trailing CBOR metadata before comparing bytecode (`strictBytecodeMatch` defaults to off), and proxy deployments force `strictBytecodeMatch: false`. This is what users expect: **changing only a code comment should not change the metadata-bearing bytecode enough to trigger a redeployment/upgrade**, and proxies in particular should never be redeployed over a metadata-only difference. Strict matching remains available as an opt-in for cases that genuinely require byte-exact comparison.
