/// <reference lib="webworker" />
/**
 * solc in a CLASSIC worker. soljson is an emscripten script that defines a global `Module`, so it
 * is loaded with importScripts (unavailable in a module worker), straight from
 * binaries.soliditylang.org, which serves it with `access-control-allow-origin: *`. Nothing of the
 * compiler is bundled: the page ships the version string, and the reader's browser fetches the
 * compiler (and caches it) the first time.
 *
 * The solc-js wrapper is not used: soljson exports `solidity_compile(input, readCallback, context)`
 * directly, and with no imports to resolve the callback can be null.
 */
type CompileRequest = {id: number; soljsonURL: string; input: string};

declare const Module: {cwrap: (name: string, ret: string, args: string[]) => (...args: unknown[]) => unknown};

let compile: ((input: string) => string) | undefined;
let loadedURL: string | undefined;

self.onmessage = (event: MessageEvent<CompileRequest>) => {
	const {id, soljsonURL, input} = event.data;
	try {
		const timings: Record<string, number> = {};
		if (!compile || loadedURL !== soljsonURL) {
			const t0 = performance.now();
			importScripts(soljsonURL);
			timings.load = performance.now() - t0;
			const solidityCompile = Module.cwrap('solidity_compile', 'string', ['string', 'number', 'number']);
			compile = (json: string) => solidityCompile(json, 0, 0) as string;
			loadedURL = soljsonURL;
		}
		const t1 = performance.now();
		const output = compile(input);
		timings.compile = performance.now() - t1;
		self.postMessage({id, output, timings});
	} catch (error) {
		self.postMessage({id, error: error instanceof Error ? error.message : String(error)});
	}
};
