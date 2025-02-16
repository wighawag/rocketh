import {Abi} from 'abitype';
import {Artifact, DevDoc, UserDoc} from '../types.js';
import {FunctionFragment} from 'ethers';

type CreateMutable<Type> = {
	-readonly [Property in keyof Type]: Type[Property];
};

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
	? ElementType
	: never;

// from https://gist.github.com/egardner/efd34f270cc33db67c0246e837689cb9
function deepEqual(obj1: any, obj2: any): boolean {
	// Private
	function isObject(obj: any) {
		if (typeof obj === 'object' && obj != null) {
			return true;
		} else {
			return false;
		}
	}

	if (obj1 === obj2) {
		return true;
	} else if (isObject(obj1) && isObject(obj2)) {
		if (Object.keys(obj1).length !== Object.keys(obj2).length) {
			return false;
		}
		for (var prop in obj1) {
			if (!deepEqual(obj1[prop], obj2[prop])) {
				return false;
			}
		}
		return true;
	}
	return false;
}

function mergeDoc(values: any, mergedDevDocs: any, field: string) {
	if (values[field]) {
		const mergedEventDocs = (mergedDevDocs[field] = mergedDevDocs[field] || {});
		for (const signature of Object.keys(values[field])) {
			if (mergedEventDocs[signature] && !deepEqual(mergedEventDocs[signature], values[field][signature])) {
				throw new Error(`Doc ${field} conflict: "${signature}" `);
			}
			mergedEventDocs[signature] = values[field][signature];
		}
	}
}

export function mergeArtifacts(list: {name: string; artifact: Partial<Artifact<Abi>> & {abi: Abi}}[]) {
	const mergedABI: CreateMutable<Abi> = [];
	const added: Map<string, ArrayElement<Abi>> = new Map();
	const mergedDevDocs: CreateMutable<DevDoc> = {kind: 'dev', version: 1, methods: {}};
	const mergedUserDocs: CreateMutable<UserDoc> = {kind: 'user', version: 1, methods: {}};
	const sigJSMap: Map<`0x${string}`, {index: number; routeName: string; functionName: string}> = new Map();

	for (let i = 0; i < list.length; i++) {
		const listElem = list[i];
		for (const element of listElem.artifact.abi) {
			if (element.type === 'function') {
				// const selector = getFunctionSelector(element);
				const selector = FunctionFragment.from(element).selector as `0x${string}`;
				if (sigJSMap.has(selector)) {
					const existing = sigJSMap.get(selector);
					throw new Error(
						`ABI conflict: ${existing!.routeName} has function "${existing!.functionName}" which conflict with ${
							listElem.name
						}'s "${element.name}" (selector: "${selector}")  `
					);
				}
				sigJSMap.set(selector, {index: i, routeName: listElem.name, functionName: element.name});

				const exists = added.has(element.name);
				if (exists) {
					// TODO check if same
				} else {
					added.set(element.name, element);
					mergedABI.push(element);
				}
			} else if (element.type === 'constructor') {
				// we skip it
			} else if (element.type === 'error') {
				const exists = added.has(element.name);
				if (exists) {
					// TODO check if same
				} else {
					added.set(element.name, element);
					mergedABI.push(element);
				}
			} else if (element.type === 'event') {
				const exists = added.has(element.name);
				if (exists) {
					// TODO check if same
				} else {
					added.set(element.name, element);
					mergedABI.push(element);
				}
			} else if (element.type === 'fallback') {
			} else if (element.type === 'receive') {
			} else {
				// if ('name' in element) {
				// 	const exists = added.has(element.name);
				// 	if (exists) {
				// 		// TODO check if same
				// 	} else {
				// 		added.set(element.name, element);
				// 		mergedABI.push(element);
				// 	}
				// }
			}
		}
		const devdoc = listElem.artifact.devdoc;
		if (devdoc) {
			mergeDoc(devdoc, mergedDevDocs, 'events');
			mergeDoc(devdoc, mergedDevDocs, 'errors');
			mergeDoc(devdoc, mergedDevDocs, 'methods');
			if (devdoc.author) {
				if (mergedDevDocs.author && mergedDevDocs.author != devdoc.author) {
					throw new Error(`DevDoc author conflict `);
				}
				mergedDevDocs.author = devdoc.author;
				if (mergedDevDocs.title && mergedDevDocs.title != devdoc.title) {
					throw new Error(`DevDoc title conflict `);
				}
				mergedDevDocs.title = devdoc.title;
			}
		}

		const userdoc = listElem.artifact.userdoc;
		if (userdoc) {
			mergeDoc(userdoc, mergedUserDocs, 'events');
			mergeDoc(userdoc, mergedUserDocs, 'errors');
			mergeDoc(userdoc, mergedUserDocs, 'methods');
			if (userdoc.notice) {
				if (mergedUserDocs.notice && mergedUserDocs.notice != userdoc.notice) {
					throw new Error(`UserDoc notice conflict `);
				}
				mergedUserDocs.notice = userdoc.notice;
			}
		}
	}
	return {
		mergedABI,
		added,
		mergedDevDocs,
		mergedUserDocs,
		sigJSMap,
	};
}
