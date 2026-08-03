import type {HookContext, SolidityHooks} from 'hardhat/types/hooks';

import {generateTypes} from '../generate-types.js';

export default async (): Promise<Partial<SolidityHooks>> => {
	const handlers: Partial<SolidityHooks> = {
		// `processArtifactsAfterSuccessfulBuild` is triggered after every successful
		//  "contracts" build. The deprecated `onCleanUpArtifacts` hook is not used, as
		//  hardhat only triggers it when a build performs an artifact cleanup, which the
		//  `build` task only does for a *full* build (no `--no-tests` / `--no-contracts`
		//  / explicit file list). The `deploy` task builds with `noTests: true`, so
		//  generating from that hook would leave the typed artifacts, the ones the
		//  deployment scripts import, holding the content of the last full build.
		async processArtifactsAfterSuccessfulBuild(context: HookContext, artifactPaths: readonly string[]) {
			if (artifactPaths.length === 0) {
				return;
			}

			// the artifact paths are not forwarded to `generateTypes`: generation always
			//  rescans `config.paths.artifacts` so the output describes the folder as it
			//  is on disk, whoever wrote into it. The hook argument is only used above as
			//  a "there is something to generate" guard.
			const artifactPathsToProcess = [context.config.paths.artifacts];
			// if (context.config.generateTypedArtifacts.externalArtifacts) {
			// 	artifactPathsToProcess = artifactPathsToProcess.concat(
			// 		context.config.generateTypedArtifacts.externalArtifacts
			// 	);
			// }

			await generateTypes(
				{
					artifacts: artifactPathsToProcess,
				},
				context.config.generateTypedArtifacts,
			);
		},
	};

	return handlers;
};
