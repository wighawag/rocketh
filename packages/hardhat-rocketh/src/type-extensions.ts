import 'hardhat/types/runtime';
import 'hardhat/types/config';

export type ArtifactGenerationConfig = {
	js?: string[];
	ts?: string[];
	json?: string[];
};

declare module 'hardhat/types/config' {
	interface HardhatUserConfig {
		generateArtifacts?: ArtifactGenerationConfig;
	}

	interface HardhatConfig {
		generateArtifacts: ArtifactGenerationConfig;
	}
}
