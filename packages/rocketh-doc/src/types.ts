import type {NoticeUserDoc, Abi, AbiConstructor, AbiFunction, AbiError, AbiEvent} from 'rocketh/types';

export type ParamDoc = {name: string | `_${number}`; description: string};
export type ReturnDoc = {name: string | `_${number}`; description: string};

export type EventDoc = NoticeUserDoc & {
	readonly name: string;
	readonly signature: string;
	readonly abi: AbiEvent;
	readonly fullFormat: string;
	readonly details?: string;
	readonly params?: ParamDoc[];
};

export type ErrorDoc = {
	readonly name: string;
	readonly signature: string;
	readonly abi: AbiError;
	readonly fullFormat: string;
	readonly notice?: string[];
	// TODO
	// readonly details?: string; // TODO check if it can exists
	readonly params?: ParamDoc[];
};

type NonConstructorMethodDoc = NoticeUserDoc & {
	readonly type: 'function';
	readonly name: string;
	readonly signature: string;
	readonly bytes4: `0x${string}`;
	readonly abi: AbiFunction;
	readonly fullFormat: string;
	readonly details?: string; // TODO check if it can exists
	readonly params?: ParamDoc[];
	readonly returns?: ReturnDoc[];
};

export type ConstructorDoc = NoticeUserDoc & {
	readonly type: 'constructor';
	readonly name: 'constructor';
	readonly signature: string;
	readonly abi: AbiConstructor;
	readonly fullFormat: string;
	readonly details?: string; // TODO check if it can exists
	readonly params?: ParamDoc[];
	readonly returns?: ReturnDoc[];
};

export type MethodDoc = NonConstructorMethodDoc | ConstructorDoc;

export type DocumentationData = {
	readonly name: string;
	readonly abi: Abi;
	readonly events: EventDoc[];
	readonly methods: MethodDoc[];
	readonly errors: ErrorDoc[];
	readonly address?: string;
	readonly title?: string;
	readonly author?: string;
	readonly notice?: string;
};
