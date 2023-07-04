import fs from 'fs-extra';
import type {ResolvedConfig, NoticeUserDoc} from 'rocketh';
import {loadDeployments} from 'rocketh';
import Handlebars from 'handlebars';
import path from 'path';

export type ParamDoc = {name: string | `_${number}`; description: string};
export type ReturnDoc = {name: string | `_${number}`; description: string};

export type EventDoc = NoticeUserDoc & {
	readonly name: string;
	readonly params?: ParamDoc[];
};

export type ErrorDoc = NoticeUserDoc & {
	readonly name: string;
	readonly params?: ParamDoc[];
};

export type MethodDoc = NoticeUserDoc & {
	readonly name: string;
	readonly params?: ParamDoc[];
	readonly returns?: ReturnDoc[];
};

type DeploymentData = {
	readonly name: string;
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

	const outputFolder = options.outputFolder || 'docs';
	const templateFilepath = options.template || path.join(__dirname, 'default_templates/{{deployments}}.hbs');
	const templateName = path.basename(templateFilepath, '.hbs');
	const templateContent = fs.readFileSync(templateFilepath, 'utf-8');
	const template = Handlebars.compile(templateContent);

	const deploymentsMap: Map<string, DeploymentData> = new Map();
	const deploymentsList: DeploymentData[] = [];
	for (const name of Object.keys(deployments)) {
		const deployment = deployments[name];

		const errors: ErrorDoc[] = [];
		const events: EventDoc[] = [];
		const methods: MethodDoc[] = [];

		if (deployment.userdoc?.errors) {
			// we loop only through userdoc
			for (const errorName of Object.keys(deployment.userdoc.errors)) {
				const errorFromUserDoc = deployment.userdoc.errors[errorName];
				const errorFromDevDoc = deployment.devdoc?.errors?.[errorName];
				const params: ParamDoc[] = [];
				if (errorFromDevDoc?.params) {
					for (const paramName of Object.keys(errorFromDevDoc.params)) {
						params.push({name: paramName, description: errorFromDevDoc.params[paramName]});
					}
				}
				errors.push({
					name: errorName,
					notice: errorFromUserDoc.notice,
					params,
				});
			}
		}

		if (deployment.userdoc?.events) {
			// we loop only through userdoc
			for (const eventName of Object.keys(deployment.userdoc.events)) {
				const eventFromUserDoc = deployment.userdoc.events[eventName];
				const eventFromDevDoc = deployment.devdoc?.events?.[eventName];
				const params: ParamDoc[] = [];
				if (eventFromDevDoc?.params) {
					for (const paramName of Object.keys(eventFromDevDoc.params)) {
						params.push({name: paramName, description: eventFromDevDoc.params[paramName]});
					}
				}
				events.push({
					name: eventName,
					notice: eventFromUserDoc.notice,
					params,
				});
			}
		}

		if (deployment.userdoc?.methods) {
			// we loop only through userdoc
			for (const methodName of Object.keys(deployment.userdoc.methods)) {
				const methodFromUserDoc = deployment.userdoc.methods[methodName];
				const methodFromDevDoc = deployment.devdoc?.methods?.[methodName];
				const params: ParamDoc[] = [];
				if (methodFromDevDoc?.params) {
					for (const paramName of Object.keys(methodFromDevDoc.params)) {
						params.push({name: paramName, description: methodFromDevDoc.params[paramName]});
					}
				}
				const returns: ReturnDoc[] = [];
				if (methodFromDevDoc?.returns) {
					for (const returnName of Object.keys(methodFromDevDoc.returns)) {
						returns.push({name: returnName, description: methodFromDevDoc.returns[returnName]});
					}
				}
				methods.push({
					name: methodName,
					notice: methodFromUserDoc.notice,
					params,
					returns,
				});
			}
		}

		const data: DeploymentData = {
			name,
			author: deployment.devdoc?.author,
			title: deployment.devdoc?.title,
			notice: deployment.userdoc?.notice,
			errors,
			events,
			methods,
		};
		deploymentsList.push(data);
		deploymentsMap.set(name, data);
	}

	fs.ensureDirSync(outputFolder);
	if (templateName === '{{deployments}}') {
		for (const deployment of deploymentsList) {
			console.log(` -- ${deployment.name} ----------------------`);
			console.log(deployment);
			console.log(`------------------------------------------------------`);
			const generated = template(deployment);
			fs.writeFileSync(path.join(outputFolder, deployment.name + '.md'), generated);
		}
	} else {
		const generated = template({deployments: deploymentsList});
		fs.writeFileSync(path.join(outputFolder, templateName + '.md'), generated);
	}
}
