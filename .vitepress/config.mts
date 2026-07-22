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
			{text: 'Documentation', link: '/documentation'},
			{text: 'hardhat-deploy', link: '/hardhat-deploy/'},
		],

		// Path-scoped sidebars: the hardhat-deploy guides get their own tree,
		// the rest of the site keeps the top-nav-only layout.
		sidebar: {
			'/hardhat-deploy/': [
				{text: 'Introduction', link: '/hardhat-deploy/documentation/introduction'},
				{text: 'What Is It For?', link: '/hardhat-deploy/documentation/what-is-it-for'},
				{text: 'In A Nutshell', link: '/hardhat-deploy/documentation/in-a-nutshell'},
				{text: 'Installation', link: '/hardhat-deploy/documentation/installation'},
				{text: 'Command And Tasks', link: '/hardhat-deploy/documentation/command-and-tasks'},
				{text: 'Rocketh Environment', link: '/hardhat-deploy/documentation/environment'},
				{text: 'Configuration', link: '/hardhat-deploy/documentation/configuration'},
				{text: 'How to deploy contracts', link: '/hardhat-deploy/documentation/how-to-deploy-contracts'},
				{
					text: 'How-To Guides',
					collapsed: false,
					items: [
						{text: 'Guides', link: '/hardhat-deploy/documentation/how-to/index'},
						{
							text: 'Getting Started',
							collapsed: true,
							items: [
								{text: 'Set Up Your First Project', link: '/hardhat-deploy/documentation/how-to/setup-first-project'},
								{text: 'Migrate from v1', link: '/hardhat-deploy/documentation/how-to/migration-from-v1'},
								{text: 'Configure Network Helpers', link: '/hardhat-deploy/documentation/how-to/configure-network-helpers'},
								{text: 'Configure Named Accounts', link: '/hardhat-deploy/documentation/how-to/configure-named-accounts'},
								{text: 'Use Tags and Dependencies', link: '/hardhat-deploy/documentation/how-to/use-tags-and-dependencies'},
							],
						},
						{
							text: 'Contract Patterns',
							collapsed: true,
							items: [
								{text: 'Proxy Contracts', link: '/hardhat-deploy/documentation/how-to/deploy-with-proxies'},
								{text: 'Diamond Contracts', link: '/hardhat-deploy/documentation/how-to/deploy-diamond-contracts'},
							],
						},
						{
							text: 'Testing Integration',
							collapsed: true,
							items: [
								{text: 'Use Deployment Fixtures in Tests', link: '/hardhat-deploy/documentation/how-to/deployment-fixtures-in-tests'},
								{text: 'Use Fork Testing', link: '/hardhat-deploy/documentation/how-to/use-fork-testing'},
							],
						},
						{
							text: 'Development Workflow',
							collapsed: true,
							items: [
								{text: 'Use Viem Integration', link: '/hardhat-deploy/documentation/how-to/use-viem-integration'},
								{text: 'Verify Contracts', link: '/hardhat-deploy/documentation/how-to/verify-contracts'},
								{text: 'Export Deployments for Frontend', link: '/hardhat-deploy/documentation/how-to/export-deployments'},
							],
						},
					],
				},
			],
		},

		search: {
			provider: 'local',
		},

		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/wighawag/rocketh/#readme',
			},
		],
	},

	// The published site is a handful of root Markdown files (index.md,
	// README.md -> introduction.md, documentation.md) plus the unified
	// hardhat-deploy/ section. Everything else tracked in the repo (internal
	// notes, ADRs, protocol docs, changesets, per-package READMEs, ...) must be
	// excluded so VitePress does not try to parse it as a page. Use a blocklist
	// of every non-docs location rather than listing pages, so new incidental
	// Markdown never breaks the build.
	srcExclude: [
		'packages/**',
		'demoes/**',
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
