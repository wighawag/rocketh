import {loadDeployments} from 'rocketh';
import type {ResolvedUserConfig} from '@rocketh/core/types';
import fs from 'fs-extra';
import path from 'path';

export function exportMetadata(config: ResolvedUserConfig, environmentName: string, {out}: {out: string}) {
	const {deployments, chainId} = loadDeployments(config.deployments, environmentName, false);

	if (Object.keys(deployments).length === 0) {
		console.log(`the environment ${environmentName} has zero deployments`);
		process.exit();
	}

	if (!chainId) {
		console.error(`the environment ${environmentName} has no chainId recorded`);
		process.exit(1);
	}

	const folder = path.join(out, environmentName);
	fs.emptyDirSync(folder);
	const deploymentNames = Object.keys(deployments);
	for (const deploymentName of deploymentNames) {
		const deployment = deployments[deploymentName];
		if (deployment.metadata) {
			fs.writeFileSync(
				path.join(folder, `${deploymentName}_at_${deployment.address}.metadata.json`),
				deployment.metadata
			);
		}
	}
}
