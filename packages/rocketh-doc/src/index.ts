import fs from 'fs-extra';
import type {
	Deployment,
	ResolvedConfig,
	NoticeUserDoc,
	Artifact,
	Abi,
	UnknownDeployments,
	AbiConstructor,
	AbiFunction,
	AbiError,
	AbiEvent,
} from 'rocketh';
import {loadDeployments} from 'rocketh';
import Handlebars from 'handlebars';
import path from 'path';
import {Fragment, FunctionFragment} from 'ethers';

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
	readonly abi: AbiConstructor;
	readonly signature: string;
	readonly details?: string; // TODO check if it can exists
	readonly params?: ParamDoc[];
	readonly returns?: ReturnDoc[];
};

export type MethodDoc = NonConstructorMethodDoc | ConstructorDoc;

type DeploymentData = {
	readonly name: string;
	readonly abi: Abi;
	readonly title?: string;
	readonly author?: string;
	readonly notice?: string;
	readonly events: EventDoc[];
	readonly methods: MethodDoc[];
	readonly errors: ErrorDoc[];
};

export async function run(config: ResolvedConfig, options: {template?: string; outputFolder?: string}) {
	const {deployments, chainId} = loadDeployments(config.deployments, config.networkName);

	if (!deployments || Object.keys(deployments).length === 0) {
		console.log(`no deployments to export`);
		return;
	}

	if (!chainId) {
		throw new Error(`no chainId found for ${config.networkName}`);
	}

	return generateFromDeployments(deployments, options);
}

export async function runFromFolder(folder: string, options: {template?: string; outputFolder?: string}) {
	const files = fs.readdirSync(folder);
	const deployments: UnknownDeployments = {};
	for (const file of files) {
		if (file.endsWith('.json')) {
			const deploymentString = fs.readFileSync(path.join(folder, file), 'utf-8');
			const deployment = JSON.parse(deploymentString);
			deployments[path.basename(file, '.json')] = deployment;
		}
	}

	return generateFromDeployments(deployments, options);
}

// export async function runFromArtifacts(folder: string, options: {template?: string; outputFolder?: string}) {
// 	const files = fs.readdirSync(folder);
// 	const deployments: UnknownDeployments = {};
// 	for (const file of files) {
// 		if (file.endsWith('.json')) {
// 			const deploymentString = fs.readFileSync(path.join(folder, file), 'utf-8');
// 			const deployment = JSON.parse(deploymentString);
// 			deployments[path.basename(file, '.json')] = deployment;
// 		}
// 	}

// 	return generateFromDeployments(deployments, options);
// }

export async function generateFromDeployments(
	deployments: UnknownDeployments,
	options: {template?: string; outputFolder?: string}
) {
	const outputFolder = options.outputFolder || 'docs';
	const templateFilepath = options.template || path.join(__dirname, 'default_templates/{{deployments}}.hbs');
	const templateName = path.basename(templateFilepath, '.hbs');
	const templateContent = fs.readFileSync(templateFilepath, 'utf-8');
	const template = Handlebars.compile(templateContent);

	const deploymentsMap: Map<string, DeploymentData> = new Map();
	const deploymentsList: DeploymentData[] = [];
	for (const name of Object.keys(deployments)) {
		const deployment = deployments[name];
		const data = generateDocumentationData(name, deployment);
		deploymentsList.push(data);
		deploymentsMap.set(name, data);
	}

	fs.ensureDirSync(outputFolder);
	if (templateName === '{{deployments}}') {
		for (const deployment of deploymentsList) {
			const generated = template(deployment);
			fs.writeFileSync(path.join(outputFolder, deployment.name + '.md'), generated);
		}
	} else {
		const generated = template({deployments: deploymentsList});
		fs.writeFileSync(path.join(outputFolder, templateName + '.md'), generated);
	}
}

export function generateDocumentationData(
	name: string,
	deploymentOrArfifact: Partial<Deployment<Abi>> & Artifact<Abi>
): DeploymentData {
	const abi = deploymentOrArfifact.abi;
	const abiMap = new Map<string, AbiConstructor | AbiError | AbiEvent | AbiFunction>();
	for (const abiElement of abi) {
		switch (abiElement.type) {
			case 'constructor':
				abiMap.set('constructor', abiElement);
				break;
			case 'error':
				abiMap.set(abiElement.name, abiElement);
				break;
			case 'event':
				abiMap.set(abiElement.name, abiElement);
				break;
			case 'function':
				abiMap.set(abiElement.name, abiElement);
				break;
		}
	}

	const errors: ErrorDoc[] = [];
	const events: EventDoc[] = [];
	const methods: MethodDoc[] = [];

	if (deploymentOrArfifact.userdoc?.errors) {
		// we loop only through userdoc
		for (const errorSignature of Object.keys(deploymentOrArfifact.userdoc.errors)) {
			const errorName =
				errorSignature.indexOf('(') > 0 ? errorSignature.slice(0, errorSignature.indexOf('(')) : errorSignature;

			const abi = abiMap.get(errorName) as AbiError;
			if (!abi) {
				continue;
			}
			const fullFormat = Fragment.from(abi).format('full');
			const paramNames = abi.inputs.map((v, index) => v.name || `_${index}`);

			const errorFromUserDoc = deploymentOrArfifact.userdoc.errors[errorSignature];
			const errorFromDevDoc = deploymentOrArfifact.devdoc?.errors?.[errorSignature];
			const params: ParamDoc[] = [];
			if (errorFromDevDoc) {
				for (const doc of errorFromDevDoc) {
					if (doc.params) {
						for (const paramName of paramNames || Object.keys(doc.params)) {
							params.push({name: paramName, description: doc.params[paramName]});
						}
						// TODO what if same name
						// TODO what is the array for ? (look at solidity doc)
					}
				}
			}
			const notice: string[] = [];
			if (errorFromUserDoc) {
				for (const doc of errorFromUserDoc) {
					if (doc.notice) {
						notice.push(doc.notice);
						// TODO what is the array for ? (look at solidity doc)
					}
				}
			}

			errors.push({
				name: errorName,
				signature: errorSignature,
				abi: abi,
				fullFormat,
				notice,
				params,
			});
		}
	}

	if (deploymentOrArfifact.userdoc?.events) {
		// we loop only through userdoc
		for (const eventSignature of Object.keys(deploymentOrArfifact.userdoc.events)) {
			const eventName =
				eventSignature.indexOf('(') > 0 ? eventSignature.slice(0, eventSignature.indexOf('(')) : eventSignature;

			const abi = abiMap.get(eventName) as AbiEvent;
			if (!abi) {
				continue;
			}
			const fullFormat = Fragment.from(abi).format('full');
			const paramNames = abi.inputs.map((v, index) => v.name || `_${index}`);

			const eventFromUserDoc = deploymentOrArfifact.userdoc.events[eventSignature];
			const eventFromDevDoc = deploymentOrArfifact.devdoc?.events?.[eventSignature];
			const params: ParamDoc[] = [];
			if (eventFromDevDoc?.params) {
				for (const paramName of paramNames || Object.keys(eventFromDevDoc.params)) {
					params.push({name: paramName, description: eventFromDevDoc.params[paramName]});
				}
			}

			events.push({
				name: eventName,
				signature: eventSignature,
				abi: abi as AbiEvent,
				fullFormat,
				notice: eventFromUserDoc.notice,
				params,
			});
		}
	}

	if (deploymentOrArfifact.userdoc?.methods) {
		// we loop only through userdoc
		for (const methodSignature of Object.keys(deploymentOrArfifact.userdoc.methods)) {
			const methodName =
				methodSignature.indexOf('(') > 0 ? methodSignature.slice(0, methodSignature.indexOf('(')) : methodSignature;

			const abi = abiMap.get(methodName) as AbiFunction | AbiConstructor;
			if (!abi) {
				continue;
			}
			const fullFormat = Fragment.from(abi).format('full');
			const paramNames = abi ? abi.inputs.map((v, index) => v.name || `_${index}`) : undefined;
			const returnNames = abi && 'outputs' in abi ? abi.outputs.map((v, index) => v.name || `_${index}`) : undefined;

			const methodFromUserDoc = deploymentOrArfifact.userdoc.methods[methodSignature];
			const methodFromDevDoc = deploymentOrArfifact.devdoc?.methods?.[methodSignature];
			const params: ParamDoc[] = [];
			if (methodFromDevDoc?.params) {
				for (const paramName of paramNames || Object.keys(methodFromDevDoc.params)) {
					params.push({name: paramName, description: methodFromDevDoc.params[paramName]});
				}
			}
			const returns: ReturnDoc[] = [];
			if (methodFromDevDoc?.returns) {
				for (const returnName of returnNames || Object.keys(methodFromDevDoc.returns)) {
					returns.push({name: returnName, description: methodFromDevDoc.returns[returnName]});
				}
			}

			if (methodName === 'constructor') {
				methods.push({
					type: 'constructor',
					name: 'constructor',
					abi: abi as AbiConstructor,
					signature: methodSignature,
					notice: methodFromUserDoc.notice,
					params,
					returns,
				});
			} else {
				const selector = FunctionFragment.from(abi).selector as `0x${string}`;
				methods.push({
					type: 'function',
					name: methodName,
					abi: abi as AbiFunction,
					signature: methodSignature,
					fullFormat,
					bytes4: selector,
					notice: methodFromUserDoc.notice,
					params,
					returns,
				});
			}
		}
	}

	const data: DeploymentData = {
		name,
		abi,
		author: deploymentOrArfifact.devdoc?.author,
		title: deploymentOrArfifact.devdoc?.title,
		notice: deploymentOrArfifact.userdoc?.notice,
		errors,
		events,
		methods,
	};
	return data;
}