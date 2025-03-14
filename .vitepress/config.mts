import {defineConfig} from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'rocketh',
	description: 'A deployment system for EVM Smart Contracts',
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{text: 'Home', link: '/'},
			{text: 'hardhat-deploy', link: 'https://rocketh.dev/hardhat-deploy/'},
		],

		// sidebar: [
		// 	{
		// 		text: 'Examples',
		// 		items: [
		// 			{text: 'Markdown Examples', link: '/markdown-examples'},
		// 			{text: 'Runtime API Examples', link: '/api-examples'},
		// 		],
		// 	},
		// ],

		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/wighawag/rocketh/#readme',
			},
		],
	},

	srcExclude: ['hardhat-deploy', 'packages/*', 'demoes/*'],

	rewrites(id) {
		// console.log({ id });
		if (id === 'README.md') {
			return 'introduction.md';
		}
		return id;
	},
});
