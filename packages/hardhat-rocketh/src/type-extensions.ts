import 'hardhat/types/runtime';
import 'hardhat/types/config';

export type ArtifactGenerationUserConfig = {
	js?: string[];
	ts?: string[];
	json?: string[];
	directories?: string[];
};

export type ArtifactGenerationConfig = {
	js: string[];
	ts: string[];
	json: string[];
	directories: string[];
};

declare module 'hardhat/types/config' {
	interface HardhatUserConfig {
		generateArtifacts?: ArtifactGenerationUserConfig;
	}

	interface HardhatConfig {
		generateArtifacts: ArtifactGenerationConfig;
	}
}
