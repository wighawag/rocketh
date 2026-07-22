import {defineConfig} from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'rocketh',
	description: 'A deployment system for EVM Smart Contracts',
	head: [
		['link', {rel: 'icon', href: '/icon.png'}],
		['meta', {name: 'theme-color', content: '#000000'}],

		['meta', {name: 'og:url', content: 'https://rocketh.dev'}],
		['meta', {name: 'og:title', content: 'rocketh'}],
		['meta', {name: 'og:description', content: 'A deployment system for EVM Smart Contracts'}],
		['meta', {name: 'og:type', content: 'website'}],
		['meta', {name: 'og:locale', content: 'en'}],
		['meta', {name: 'og:site_name', content: 'rocketh'}],
		['meta', {name: 'og:image', content: 'https://rocketh.dev/preview.png'}],

		['meta', {name: 'twitter:url', content: 'https://rocketh.dev'}],
		['meta', {name: 'twitter:title', content: 'rocketh'}],
		['meta', {name: 'twitter:description', content: 'A deployment system for EVM Smart Contracts'}],
		['meta', {name: 'twitter:card', content: 'summary_large_image'}],
		[
			'meta',
			{
				name: 'twitter:image',
				content: 'https://rocketh.dev/preview.png',
			},
		],
	],
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

	// Only a handful of root Markdown files make up the published site
	// (index.md, README.md -> introduction.md, documentation.md). Everything
	// else tracked in the repo (internal notes, ADRs, protocol docs, changesets,
	// legacy sites, per-package READMEs, ...) must be excluded so VitePress does
	// not try to parse it as a page. Use a blocklist of every non-docs location
	// rather than listing pages, so new incidental Markdown never breaks the build.
	srcExclude: [
		'hardhat-deploy',
		'hardhat-deploy/**',
		'packages/**',
		'demoes/**',
		'website-legacy/**',
		'work/**',
		'plans/**',
		'reviews/**',
		'scripts/**',
		'skills/**',
		'tmp/**',
		'docs/**',
		'.changeset/**',
		'.kilo/**',
		'AGENTS.md',
		'CONTEXT.md',
		'TESTING.md',
	],

	rewrites(id) {
		// console.log({ id });
		if (id === 'README.md') {
			return 'introduction.md';
		}
		return id;
	},

	ignoreDeadLinks: [
		// Ignore any link starting with ./packages/
		/^\.\/packages\//,
		'./LICENSE',
	],
});
