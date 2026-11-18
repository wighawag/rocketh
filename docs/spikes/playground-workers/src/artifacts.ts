/**
 * What `import {artifacts} from '../rocketh/deploy.js'` gives a project script, filled at RUN time
 * here: the page compiles the Solidity, then puts the result in this registry before it runs the
 * deploy scripts. A playground app would make this the module the scripts' import resolves to.
 */
import type {Abi} from 'viem';

export type CompiledArtifact = {
	abi: Abi;
	bytecode: `0x${string}`;
	deployedBytecode: `0x${string}`;
	metadata: string;
	contractName: string;
	sourceName: string;
};

export const artifacts: Record<string, CompiledArtifact> = {};
