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
 * Each pass takes the FIRST source it matches. That is a GUESS whenever more
 * than one source matches, so the scan collects every candidate and warns
 * (naming the library, all candidates, the chosen one, and which pass produced
 * them) before returning the first. It does not change which one wins.
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
 * Which pass of the fallback scan produced a set of candidates. A user fixes
 * the two differently: `ast` candidates are all real `library <Name>`
 * declarations (dedupe the compilation, or carry `linkReferences`), while a
 * `content` candidate may be no declaration at all, just the words `library
 * <Name>` inside a comment or a string literal.
 */
type ScanPass = 'ast' | 'content';

/**
 * Resolve a library's defining source path from the compilation metadata
 * `sources` map, via structured AST first then a `library <Name>` content
 * scan. This is the FALLBACK used only when the deployment carries no usable
 * `linkReferences` (e.g. older artifacts).
 *
 * Both passes take the first match; this collects ALL of them so an ambiguity
 * can be reported, then returns the first, exactly as before.
 */
function findLibrarySourcePathBySources(
	libraryName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadataSources: Record<string, {content?: string; ast?: any}>,
): string | undefined {
	// 1. Structured AST lookup (most reliable when available).
	const astCandidates = collectFromAst(libraryName, metadataSources);
	if (astCandidates.length > 0) {
		return chooseFirst(libraryName, astCandidates, 'ast');
	}

	// 2. Fallback: scan raw source content for a `library <Name>` declaration.
	const contentCandidates = collectFromContent(libraryName, metadataSources);
	if (contentCandidates.length > 0) {
		return chooseFirst(libraryName, contentCandidates, 'content');
	}

	return undefined;
}

/** Every source whose AST declares `contractKind: 'library'` under this name. */
function collectFromAst(
	libraryName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadataSources: Record<string, {content?: string; ast?: any}>,
): string[] {
	const candidates: string[] = [];
	for (const [sourcePath, source] of Object.entries(metadataSources)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ast = (source as any)?.ast;
		if (ast && Array.isArray(ast.nodes)) {
			const declares = ast.nodes.some(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(node: any) =>
					node &&
					node.nodeType === 'ContractDefinition' &&
					node.contractKind === 'library' &&
					node.name === libraryName,
			);
			if (declares) {
				candidates.push(sourcePath);
			}
		}
	}
	return candidates;
}

/** Every source whose raw text matches a `library <Name>` declaration. */
function collectFromContent(
	libraryName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metadataSources: Record<string, {content?: string; ast?: any}>,
): string[] {
	const escaped = libraryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`\\blibrary\\s+${escaped}\\b`);
	const candidates: string[] = [];
	for (const [sourcePath, source] of Object.entries(metadataSources)) {
		if (source?.content && regex.test(source.content)) {
			candidates.push(sourcePath);
		}
	}
	return candidates;
}

/**
 * Return the first candidate — the one this scan has always returned — and,
 * when there is more than one, make the pick VISIBLE instead of silent.
 *
 * The notice stays on `console.warn` rather than moving to the `named-logs`
 * logger used elsewhere in the repo: `logs()` returns a permanent no-op unless
 * something hooked a factory FIRST, and the `rocketh-verify` CLI (the main way
 * this code runs) does not. Routing it through the logger would delete exactly
 * the message this task exists to show. See
 * `docs/adr/0009-user-facing-notices-stay-on-console.md`.
 */
function chooseFirst(libraryName: string, candidates: string[], pass: ScanPass): string {
	const chosen = candidates[0];
	if (candidates.length > 1) {
		const origin =
			pass === 'ast'
				? 'each declares it in its AST, so these are real duplicate declarations'
				: 'these come from the raw-source text scan, so a match may be a mention inside a comment or a string literal rather than a declaration';
		console.warn(
			`[@rocketh/verifier] ambiguous library "${libraryName}": ${candidates.length} candidate sources in the ` +
				`compilation metadata (${origin}): ${candidates.join(', ')}. ` +
				`Using the first one: ${chosen}. ` +
				`Etherscan keys settings.libraries by the source file that DEFINES the library, so verification will ` +
				`fail if that is the wrong one; a deployment carrying compiler linkReferences resolves this without guessing.`,
		);
	}
	return chosen;
}
