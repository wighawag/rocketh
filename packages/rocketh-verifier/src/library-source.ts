/**
 * Resolve the source-file path where a Solidity library is defined.
 *
 * Etherscan (and the Solidity standard-json input spec) keys the
 * `settings.libraries` block by the source file that DEFINES each library —
 * not by the file of the consuming contract. This helper walks the metadata
 * `sources` map to find that defining source path.
 *
 * Resolution order:
 *   1. Structured AST (`source.ast.nodes`) if present — the compiler emits a
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
