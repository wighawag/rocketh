import type {LinkedDataProvided, LinkedData, JSONTypePlusBigInt, JSONType} from 'rocketh/types';

/**
 * Convert a LinkedDataProvided object into LinkedData by turning every
 * bigint into its string representation (recursively).
 */
export function toJSONCompatibleLinkedData(input: LinkedDataProvided | undefined): LinkedData | undefined {
	if (!input) {
		return undefined;
	}
	return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, walk(v)]));
}

/* ---------- internal helpers ---------- */

function walk(node: JSONTypePlusBigInt): JSONType {
	if (typeof node === 'bigint') return node.toString();

	if (Array.isArray(node)) return node.map(walk);

	if (node && typeof node === 'object') {
		const out: Record<string, JSONType> = {};
		for (const [k, v] of Object.entries(node)) out[k] = walk(v);
		return out;
	}

	/* string | number | boolean | null */
	return node;
}
