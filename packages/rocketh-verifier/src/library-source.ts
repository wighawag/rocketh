/**
 * Resolve the source-file path where a Solidity library is defined, by
 * inspecting the compilation metadata `sources` map.
 *
 * Etherscan (and the Solidity standard-json input spec) keys the
 * `settings.libraries` block by the source file that DEFINES each library,
 * not by the file of the consuming contract. This helper is the FALLBACK
 * resolution path: prefer `findLibrarySourcePathFromLinkReferences`, which
 * reads the source path straight from the compiler `linkReferences` map, and
 * only reach for this heuristic scan when no usable `linkReferences` is
 * available on the deployment.
 *
 * Resolution order:
 *   1. Structured AST (`source.ast.nodes`) if present: the compiler emits a
 *      `ContractDefinition` node with `contractKind: 'library'` and `name`.
 *   2. Fallback: regex over `source.content` for a `library <Name>`
 *      declaration.
 *
 * Returns the source path (e.g. `contracts/Math.sol`) or `undefined` if the
 * library cannot be located in any of the sources.
 */
export function findLibrarySourcePath(
	libraryName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadataSources: Record<string, {content?: string; ast?: any}> | undefined,
): string | undefined {
	if (!metadataSources) {
		return undefined;
	}

	return findLibrarySourcePathBySources(libraryName, metadataSources);
}

/**
 * Solidity `linkReferences` map, keyed by the DEFINING source file of each
 * library (exactly the shape Etherscan wants for `settings.libraries`):
 *
 *   { "contracts/Math.sol": { "Math": [{start, length}, ...] }, ... }
 *
 * The compiler emits this for both creation-time (`linkReferences`) and
 * runtime (`deployedLinkReferences`) bytecode, and rocketh already persists
 * both on the deployment. Because the source path is the map KEY, resolving a
 * library's defining source is a direct lookup with no AST-walking or regex.
 */
export type LinkReferences = {
	[sourcePath: string]: {
		[libraryName: string]: unknown;
	};
};

/**
 * Resolve a library's defining source path from a compiler `linkReferences`
 * map. This is the authoritative, most robust resolution path: the source
 * path is the map key, so no heuristics are involved.
 *
 * Accepts one or more `linkReferences`-shaped maps (e.g. creation-time and
 * runtime) and returns the first match. Returns `undefined` when none of the
 * provided maps reference `libraryName`.
 */
export function findLibrarySourcePathFromLinkReferences(
	libraryName: string,
	...linkReferencesMaps: Array<LinkReferences | undefined | null>
): string | undefined {
	for (const linkReferences of linkReferencesMaps) {
		if (!linkReferences || typeof linkReferences !== 'object') {
			continue;
		}
		for (const [sourcePath, libs] of Object.entries(linkReferences)) {
			if (libs && typeof libs === 'object' && Object.prototype.hasOwnProperty.call(libs, libraryName)) {
				return sourcePath;
			}
		}
	}
	return undefined;
}

/**
 * Resolve a library's defining source path from the compilation metadata
 * `sources` map, via structured AST first then a `library <Name>` content
 * scan. This is the FALLBACK used only when the deployment carries no usable
 * `linkReferences` (e.g. older artifacts).
 */
function findLibrarySourcePathBySources(
	libraryName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadataSources: Record<string, {content?: string; ast?: any}>,
): string | undefined {
	// 1. Structured AST lookup (most reliable when available).
	for (const [sourcePath, source] of Object.entries(metadataSources)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ast = (source as any)?.ast;
		if (ast && Array.isArray(ast.nodes)) {
			for (const node of ast.nodes) {
				if (
					node &&
					node.nodeType === 'ContractDefinition' &&
					node.contractKind === 'library' &&
					node.name === libraryName
				) {
					return sourcePath;
				}
			}
		}
	}

	// 2. Fallback: scan raw source content for a `library <Name>` declaration.
	const escaped = libraryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`\\blibrary\\s+${escaped}\\b`);
	for (const [sourcePath, source] of Object.entries(metadataSources)) {
		if (source?.content && regex.test(source.content)) {
			return sourcePath;
		}
	}

	return undefined;
}
