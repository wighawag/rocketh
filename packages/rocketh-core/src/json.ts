import type {LinkedDataProvided, LinkedData, JSONType, JSONTypePlusBigInt} from './types.js';

// TODO share with db-utils
export function postfixBigIntReplacer(k: string, v: any): any {
	if (typeof v === 'bigint') {
		return v.toString() + 'n';
	}
	return v;
}

export function bigIntToStringReplacer(k: string, v: any): any {
	if (typeof v === 'bigint') {
		return v.toString();
	}
	return v;
}

export function postfixBigIntReviver(k: string, v: any): any {
	if (
		typeof v === 'string' &&
		(v.startsWith('-') ? !isNaN(parseInt(v.charAt(1))) : !isNaN(parseInt(v.charAt(0)))) &&
		v.charAt(v.length - 1) === 'n'
	) {
		return BigInt(v.slice(0, -1));
	}
	return v;
}

export function JSONToString<T = unknown>(json: unknown, space?: string | number) {
	return JSON.stringify(json, bigIntToStringReplacer, space);
}

export function stringToJSON<T = unknown>(str: string): T {
	return JSON.parse(str);
}

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
