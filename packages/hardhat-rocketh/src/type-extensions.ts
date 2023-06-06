import 'hardhat/types/runtime';
import 'hardhat/types/config';

declare module 'hardhat/types/config' {
	interface HardhatUserConfig {
		generateArtifacts?: {
			js?: string[];
			ts?: string[];
			json?: string[];
		};
	}

	interface HardhatConfig {
		generateArtifacts: {
			js?: string[];
			ts?: string[];
			json?: string[];
		};
	}
}
