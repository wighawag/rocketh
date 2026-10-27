/**
 * The endpoint of each provider rocketh opened ITSELF from an `rpcUrl`, so an error raised later,
 * while the environment is built, can say which endpoint it asked.
 *
 * Kept here, keyed by the provider object, rather than added to `ResolvedExecutionParams`: that
 * type is `@rocketh/core`'s, and the url is needed only to word an error. A provider handed in by
 * the caller (hardhat-deploy, a test, a browser wallet) is not in the map, and the error then
 * names no endpoint; the caller that knows it fills it in.
 *
 * Holds the RAW url, which can contain an API key: it must only ever be shown through
 * `redactEndpoint`.
 */
const endpointByProvider = new WeakMap<object, string>();

export function rememberEndpoint(provider: object, url: string): void {
	endpointByProvider.set(provider, url);
}

export function endpointOf(provider: object): string | undefined {
	return endpointByProvider.get(provider);
}
