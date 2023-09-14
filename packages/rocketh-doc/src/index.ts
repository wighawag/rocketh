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

import {DocumentationData, ErrorDoc, EventDoc, MethodDoc, ParamDoc, ReturnDoc} from './types';
export * from './types';

export type RunOptions = {template?: string; output?: string; exceptSuffix?: string[]};

function filter(options: RunOptions, name: string): boolean {
	if (options.exceptSuffix) {
		for (const suffix of options.exceptSuffix) {
			if (name.endsWith(suffix)) {
				return false;
			}
		}
	}
	return true;
}

export async function run(config: ResolvedConfig, options: RunOptions) {
	const {deployments, chainId} = loadDeployments(config.deployments, config.networkName);
	if (!chainId) {
		throw new Error(`no chainId found for ${config.networkName}`);
	}
	generate({deployments}, options);
}

export async function generate(
	{deployments}: {deployments: UnknownDeployments; chainId?: string},
	options: RunOptions
) {
	if (!deployments || Object.keys(deployments).length === 0) {
		console.log(`no deployments to export`);
		return;
	}

	const toDocument: UnknownDeployments = {};
	for (const name of Object.keys(deployments)) {
		if (!filter(options, name)) {
			continue;
		}
		const deployment = deployments[name];
		toDocument[name] = deployment;
	}

	return generateFromDeployments(toDocument, options);
}

export async function runFromFolder(folder: string, options: RunOptions) {
	const files = fs.readdirSync(folder);
	const deployments: UnknownDeployments = {};
	for (const file of files) {
		if (file.endsWith('.json')) {
			const name = path.basename(file, '.json');
			if (!filter(options, name)) {
				continue;
			}

			const deploymentString = fs.readFileSync(path.join(folder, file), 'utf-8');
			const deployment = JSON.parse(deploymentString);
			deployments[name] = deployment;
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

export async function generateFromDeployments(deployments: UnknownDeployments, options: RunOptions) {
	const outputFolder = options.output || 'docs';
	const templateFilepath = options.template || path.join(__dirname, 'default_templates/{{contracts}}.hbs');
	const templateName = path.basename(templateFilepath, '.hbs');
	const templateContent = fs.readFileSync(templateFilepath, 'utf-8');
	const template = Handlebars.compile(templateContent);

	const deploymentsList: DocumentationData[] = [];
	for (const name of Object.keys(deployments)) {
		const deployment = deployments[name];
		const data = generateDocumentationData(name, deployment);
		deploymentsList.push(data);
	}

	fs.emptyDirSync(outputFolder);
	if (templateName === '{{contracts}}') {
		for (const deployment of deploymentsList) {
			const generated = template(deployment);
			if (generated.trim() !== '') {
				fs.writeFileSync(path.join(outputFolder, deployment.name + '.md'), generated);
			}
		}
	} else {
		const generated = template({contracts: deploymentsList});
		fs.writeFileSync(path.join(outputFolder, templateName + '.md'), generated);
	}
}

export function generateDocumentationData(
	name: string,
	deploymentOrArfifact: Partial<Deployment<Abi>> & Artifact<Abi>
): DocumentationData {
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
						const notes = doc.notice.split('\\');
						for (const note of notes) {
							if (note != '') {
								notice.push(note);
							}
						}
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
					fullFormat,
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

	const data: DocumentationData = {
		name,
		address: deploymentOrArfifact.address,
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
