/**
 * Types for the two untyped packages the artifact generator uses.
 *
 * Both ship plain JavaScript with no declarations, and both are used through a very small
 * surface, so declaring exactly that surface is better than an `any` import: a typo in
 * `compile`/`version` would otherwise go unnoticed until the generator ran.
 *
 * Referenced explicitly from `generate-v1-artifacts.ts` (a sibling `.d.ts` is NOT picked up
 * automatically when that file is pulled into a package's program as an import), so keep the
 * triple-slash reference there if this file moves.
 */

declare module 'solc' {
	/** The solc-js wrapper: the Emscripten build of the compiler, driven by standard-json. */
	const solc: {
		/** e.g. `0.8.10+commit.fc410830.Emscripten.clang` */
		version(): string;
		/** Takes a standard-json input string, returns a standard-json output string. */
		compile(input: string): string;
	};
	export default solc;
}

declare module 'murmur-128' {
	/** MurmurHash3 (128-bit). hardhat-deploy v1 hashes its `solcInput` string with this. */
	export default function murmur128(input: string): ArrayBuffer;
}
