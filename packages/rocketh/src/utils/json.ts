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
