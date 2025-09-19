import {loadDeployments, ResolvedUserConfig} from 'rocketh';
import fs from 'fs-extra';
import path from 'path';

export function exportMetadata(config: ResolvedUserConfig, targetName: string, {out}: {out: string}) {
	const {deployments, chainId} = loadDeployments(config.deployments, targetName, false);

	if (Object.keys(deployments).length === 0) {
		console.log(`the target ${targetName} has zero deployments`);
		process.exit();
	}

	if (!chainId) {
		console.error(`the target ${targetName} has no chainId recorded`);
		process.exit(1);
	}

	const folder = path.join(out, targetName);
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
