import { describe, it, expect } from 'vitest';
import {
	postfixBigIntReplacer,
	bigIntToStringReplacer,
	postfixBigIntReviver,
	JSONToString,
	stringToJSON,
	toJSONCompatibleLinkedData,
} from './json.js';
import type { LinkedDataProvided } from './types.js';

describe('JSON Utilities', () => {
	describe('postfixBigIntReplacer', () => {
		it('should convert bigint to string with "n" suffix', () => {
			const obj = { value: 123n };
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"value":"123n"}');
		});

		it('should handle negative bigints', () => {
			const obj = { value: -456n };
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"value":"-456n"}');
		});

		it('should handle zero bigint', () => {
			const obj = { value: 0n };
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"value":"0n"}');
		});

		it('should leave non-bigint values unchanged', () => {
			const obj = {
				number: 123,
				string: 'hello',
				boolean: true,
				null: null,
			};
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"number":123,"string":"hello","boolean":true,"null":null}');
		});

		it('should handle nested objects with bigints', () => {
			const obj = {
				outer: {
					inner: {
						bigintValue: 789n,
					},
					normalValue: 42,
				},
			};
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"outer":{"inner":{"bigintValue":"789n"},"normalValue":42}}');
		});

		it('should handle arrays with bigints', () => {
			const obj = { values: [1n, 2n, 3n] };
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"values":["1n","2n","3n"]}');
		});

		it('should handle very large bigints', () => {
			const obj = { value: 9007199254740991n }; // Number.MAX_SAFE_INTEGER
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"value":"9007199254740991n"}');
		});

		it('should handle bigint larger than Number.MAX_SAFE_INTEGER', () => {
			const obj = { value: 9007199254740992n }; // Number.MAX_SAFE_INTEGER + 1
			const result = JSON.stringify(obj, postfixBigIntReplacer);
			expect(result).toBe('{"value":"9007199254740992n"}');
		});
	});

	describe('bigIntToStringReplacer', () => {
		it('should convert bigint to plain string without suffix', () => {
			const obj = { value: 123n };
			const result = JSON.stringify(obj, bigIntToStringReplacer);
			expect(result).toBe('{"value":"123"}');
		});

		it('should handle negative bigints', () => {
			const obj = { value: -456n };
			const result = JSON.stringify(obj, bigIntToStringReplacer);
			expect(result).toBe('{"value":"-456"}');
		});

		it('should handle zero bigint', () => {
			const obj = { value: 0n };
			const result = JSON.stringify(obj, bigIntToStringReplacer);
			expect(result).toBe('{"value":"0"}');
		});

		it('should leave non-bigint values unchanged', () => {
			const obj = {
				number: 123,
				string: 'hello',
				boolean: true,
				null: null,
			};
			const result = JSON.stringify(obj, bigIntToStringReplacer);
			expect(result).toBe('{"number":123,"string":"hello","boolean":true,"null":null}');
		});

		it('should handle nested objects with bigints', () => {
			const obj = {
				outer: {
					inner: {
						bigintValue: 789n,
					},
					normalValue: 42,
				},
			};
			const result = JSON.stringify(obj, bigIntToStringReplacer);
			expect(result).toBe('{"outer":{"inner":{"bigintValue":"789"},"normalValue":42}}');
		});

		it('should handle arrays with bigints', () => {
			const obj = { values: [1n, 2n, 3n] };
			const result = JSON.stringify(obj, bigIntToStringReplacer);
			expect(result).toBe('{"values":["1","2","3"]}');
		});

		it('should handle very large bigints', () => {
			const obj = { value: 9007199254740991n };
			const result = JSON.stringify(obj, bigIntToStringReplacer);
			expect(result).toBe('{"value":"9007199254740991"}');
		});
	});

	describe('postfixBigIntReviver', () => {
		it('should restore bigint from string with "n" suffix', () => {
			const json = '{"value":"123n"}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ value: 123n });
		});

		it('should restore negative bigint from string with "n" suffix', () => {
			const json = '{"value":"-456n"}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ value: -456n });
		});

		it('should restore zero bigint', () => {
			const json = '{"value":"0n"}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ value: 0n });
		});

		it('should not convert strings without "n" suffix', () => {
			const json = '{"value":"123"}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ value: '123' });
		});

		it('should not convert strings with "n" but non-numeric content', () => {
			const json = '{"value":"hello"}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ value: 'hello' });
		});

		it('should handle nested objects', () => {
			const json = '{"outer":{"inner":{"bigintValue":"789n"},"normalValue":42}}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({
				outer: {
					inner: { bigintValue: 789n },
					normalValue: 42,
				},
			});
		});

		it('should handle arrays', () => {
			const json = '{"values":["1n","2n","3n"]}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ values: [1n, 2n, 3n] });
		});

		it('should handle very large bigints', () => {
			const json = '{"value":"9007199254740991n"}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ value: 9007199254740991n });
		});

		it('should handle mixed array content', () => {
			const json = '{"mixed":["1n",42,"hello","99n",true]}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({ mixed: [1n, 42, 'hello', 99n, true] });
		});

		it('should leave other types unchanged', () => {
			const json = '{"number":42,"string":"hello","boolean":true,"null":null}';
			const result = JSON.parse(json, postfixBigIntReviver);
			expect(result).toEqual({
				number: 42,
				string: 'hello',
				boolean: true,
				null: null,
			});
		});
	});

	describe('JSONToString', () => {
		it('should serialize object using bigIntToStringReplacer', () => {
			const obj = { value: 123n };
			const result = JSONToString(obj);
			expect(result).toBe('{"value":"123"}');
		});

		it('should accept optional space parameter', () => {
			const obj = { value: 123n };
			const result = JSONToString(obj, 2);
			expect(result).toBe('{\n  "value": "123"\n}');
		});

		it('should handle complex nested structures', () => {
			const obj = {
				nested: {
					values: [1n, 2n, 3n],
					normal: 42,
				},
			};
			const result = JSONToString(obj);
			expect(result).toBe('{"nested":{"values":["1","2","3"],"normal":42}}');
		});

		it('should handle objects without bigints', () => {
			const obj = { value: 'hello' };
			const result = JSONToString(obj);
			expect(result).toBe('{"value":"hello"}');
		});

		it('should handle null input', () => {
			const result = JSONToString(null);
			expect(result).toBe('null');
		});

		it('should handle array input', () => {
			const arr = [1n, 2n, 3n];
			const result = JSONToString(arr);
			expect(result).toBe('["1","2","3"]');
		});
	});

	describe('stringToJSON', () => {
		it('should parse JSON string', () => {
			const str = '{"value":123}';
			const result = stringToJSON(str);
			expect(result).toEqual({ value: 123 });
		});

		it('should parse array JSON', () => {
			const str = '[1,2,3]';
			const result = stringToJSON(str);
			expect(result).toEqual([1, 2, 3]);
		});

		it('should handle strings', () => {
			const str = '"hello"';
			const result = stringToJSON(str);
			expect(result).toBe('hello');
		});

		it('should handle numbers', () => {
			const str = '42';
			const result = stringToJSON(str);
			expect(result).toBe(42);
		});

		it('should handle booleans', () => {
			const str = 'true';
			const result = stringToJSON(str);
			expect(result).toBe(true);
		});

		it('should handle null', () => {
			const str = 'null';
			const result = stringToJSON(str);
			expect(result).toBe(null);
		});

		it('should return generic type when type is not specified', () => {
			const str = '{"value":"test"}';
			const result = stringToJSON(str);
			expect(result).toEqual({ value: 'test' });
		});
	});

	describe('round-trip serialization with bigint', () => {
		it('should round-trip bigint with postfixBigIntReplacer/Reviver', () => {
			const original = { value: 123n, nested: { inner: 456n } };
			const serialized = JSON.stringify(original, postfixBigIntReplacer);
			const deserialized = JSON.parse(serialized, postfixBigIntReviver);
			expect(deserialized).toEqual(original);
		});

		it('should round-trip bigint with JSONToString/stringToJSON (no restoration)', () => {
			const original = { value: 123n };
			const serialized = JSONToString(original);
			const deserialized = stringToJSON(serialized);
			// bigIntToStringReplacer doesn't restore, so values become strings
			expect(deserialized).toEqual({ value: '123' });
		});

		it('should round-trip complex nested structure', () => {
			const original = {
				level1: {
					level2: {
						bigintValue: 999n,
						normalValue: 42,
						array: [1n, 2n, 3n],
					},
				},
			};
			const serialized = JSON.stringify(original, postfixBigIntReplacer);
			const deserialized = JSON.parse(serialized, postfixBigIntReviver);
			expect(deserialized).toEqual(original);
		});
	});

	describe('toJSONCompatibleLinkedData', () => {
		it('should convert bigint in linked data to string', () => {
			const input: LinkedDataProvided = {
				bigintValue: 123n,
				stringValue: 'hello',
				numberValue: 42,
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				bigintValue: '123',
				stringValue: 'hello',
				numberValue: 42,
			});
		});

		it('should return undefined for undefined input', () => {
			const result = toJSONCompatibleLinkedData(undefined);
			expect(result).toBe(undefined);
		});

		it('should convert nested bigints', () => {
			const input: LinkedDataProvided = {
				nested: {
					bigintValue: 456n,
				},
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				nested: {
					bigintValue: '456',
				},
			});
		});

		it('should convert bigints in arrays', () => {
			const input: LinkedDataProvided = {
				values: [1n, 2n, 3n],
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				values: ['1', '2', '3'],
			});
		});

		it('should handle complex nested structures', () => {
			const input: LinkedDataProvided = {
				outer: {
					inner: {
						bigintValue: 789n,
						array: [1n, 2n],
						nested: {
							deep: 999n,
						},
					},
				},
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				outer: {
					inner: {
						bigintValue: '789',
						array: ['1', '2'],
						nested: {
							deep: '999',
						},
					},
				},
			});
		});

		it('should handle mixed content arrays', () => {
			const input: LinkedDataProvided = {
				mixed: [1n, 'string', 42, 999n, true],
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				mixed: ['1', 'string', 42, '999', true],
			});
		});

		it('should handle empty object', () => {
			const input: LinkedDataProvided = {};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({});
		});

		it('should handle objects without bigints', () => {
			const input: LinkedDataProvided = {
				string: 'hello',
				number: 42,
				boolean: true,
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				string: 'hello',
				number: 42,
				boolean: true,
			});
		});

		it('should handle negative bigints', () => {
			const input: LinkedDataProvided = {
				negative: -123n,
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				negative: '-123',
			});
		});

		it('should handle zero bigint', () => {
			const input: LinkedDataProvided = {
				zero: 0n,
			};
			const result = toJSONCompatibleLinkedData(input);
			expect(result).toEqual({
				zero: '0',
			});
		});
	});
});