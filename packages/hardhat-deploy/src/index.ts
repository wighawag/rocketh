import type {HardhatPlugin} from 'hardhat/types/plugins';
import {task} from 'hardhat/config';

import './type-extensions.js';
import {ArgumentType} from 'hardhat/types/arguments';

// const deployTask = import.meta.resolve('./tasks/deploy.js').replace('.ts', '.js');
// console.log({deployTask});

const hardhatPlugin: HardhatPlugin = {
	id: 'hardhat3-rocketh',
	tasks: [
		task('deploy', 'Deploy contracts')
			// .addFlag('skipGasReport', 'if set, skip gas report')
			.addFlag({name: 'skipPrompts', description: 'if set, skip any prompts'})
			.addOption({
				name: 'saveDeployments',
				description: 'if set, save deployments',
				defaultValue: '',
				type: ArgumentType.STRING,
			})
			.setAction(import.meta.resolve('./tasks/deploy.js'))
			.build(),
		task('compile-generate', 'compile contracts')
			.setAction(import.meta.resolve('./tasks/compile.js'))
			.build(),
	],
	npmPackage: 'hardhat3-rocketh',
};

export default hardhatPlugin;
