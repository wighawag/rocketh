import {defineConfig} from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'rocketh',
	description: 'Framework-agnostic deployment system for EVM smart contracts',
	head: [
		['link', {rel: 'icon', href: '/icon.png'}],
		['meta', {name: 'theme-color', content: '#000000'}],

		['meta', {name: 'og:url', content: 'https://rocketh.dev'}],
		['meta', {name: 'og:title', content: 'rocketh'}],
		['meta', {name: 'og:description', content: 'Framework-agnostic deployment system for EVM smart contracts'}],
		['meta', {name: 'og:type', content: 'website'}],
		['meta', {name: 'og:locale', content: 'en'}],
		['meta', {name: 'og:site_name', content: 'rocketh'}],
		['meta', {name: 'og:image', content: 'https://rocketh.dev/preview.png'}],

		['meta', {name: 'twitter:url', content: 'https://rocketh.dev'}],
		['meta', {name: 'twitter:title', content: 'rocketh'}],
		['meta', {name: 'twitter:description', content: 'Framework-agnostic deployment system for EVM smart contracts'}],
		['meta', {name: 'twitter:card', content: 'summary_large_image'}],
		[
			'meta',
			{
				name: 'twitter:image',
				content: 'https://rocketh.dev/preview.png',
			},
		],
	],
	// The interactive widgets are custom elements, so the Vue compiler must be told to emit
	// `<rocketh-playground>` as-is instead of failing to resolve it as a component. Matching on
	// the `rocketh-` prefix rather than on one name, so a second widget needs no config change.
	vue: {
		template: {
			compilerOptions: {
				isCustomElement: (tag: string) => tag.startsWith('rocketh-'),
			},
		},
	},

	vite: {
		optimizeDeps: {
			// Vite's dependency scanner crawls the project root for HTML entry points. The repo
			// root is also the docs srcDir, so an unrelated checkout under the gitignored `tmp/`
			// (a hardhat monorepo clone, say) gets scanned as if it were part of this site, and
			// one broken entry there aborts the WHOLE scan: dependency pre-bundling is then
			// skipped for the docs, which is slow and confusing in a way that does not name the
			// real cause. Scratch directories are not part of the site, so keep them out.
			entries: ['**/*.html', '!tmp/**', '!demoes/**', '!packages/*/dist/**'],
		},
	},

	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{text: 'Home', link: '/'},
			{text: 'Documentation', link: '/documentation/'},
			{text: 'hardhat-deploy', link: '/hardhat-deploy/'},
		],

		// Path-scoped sidebars: the rocketh documentation and the hardhat-deploy guides
		// each get their own tree. The home page stays top-nav-only.
		sidebar: {
			'/documentation/': [
				{text: 'Introduction', link: '/documentation/'},
				{
					text: 'Getting Started',
					collapsed: false,
					items: [
						{text: 'Installation and Setup', link: '/documentation/installation/'},
						{text: 'Core Concepts', link: '/documentation/core-concepts/'},
						{text: 'Using rocketh', link: '/documentation/deploying/'},
						{text: 'Examples', link: '/documentation/examples/'},
					],
				},
				{
					text: 'Going Further',
					collapsed: false,
					items: [
						{text: 'Using hardhat-deploy', link: '/documentation/hardhat-deploy/'},
						{text: 'Testing Deploy Scripts', link: '/documentation/testing/'},
						{text: 'Rehearsing on a Fork', link: '/documentation/fork-runs/'},
						{text: 'Captured Transactions', link: '/documentation/captured-transactions/'},
						{text: 'Exporting and Verifying', link: '/documentation/exporting-and-verifying/'},
						{text: 'Handling Unknown Signers', link: '/documentation/unknown-signers/'},
						{text: 'Guarding Execute Calls', link: '/documentation/execute-guard/'},
					],
				},
				{
					text: 'Reference',
					collapsed: false,
					items: [
						{text: 'Production Hardening', link: '/documentation/production-hardening/'},
						{text: 'Architecture Overview', link: '/documentation/architecture/'},
						{text: 'Migrating from v1', link: '/documentation/migration/'},
					],
				},
			],

			'/hardhat-deploy/': [
				{text: 'Introduction', link: '/hardhat-deploy/documentation/introduction/'},
				{text: 'What Is It For?', link: '/hardhat-deploy/documentation/what-is-it-for/'},
				{text: 'In A Nutshell', link: '/hardhat-deploy/documentation/in-a-nutshell/'},
				{text: 'Installation', link: '/hardhat-deploy/documentation/installation/'},
				{text: 'Command And Tasks', link: '/hardhat-deploy/documentation/command-and-tasks/'},
				{text: 'Rocketh Environment', link: '/hardhat-deploy/documentation/environment/'},
				{text: 'Configuration', link: '/hardhat-deploy/documentation/configuration/'},
				{text: 'How to deploy contracts', link: '/hardhat-deploy/documentation/how-to-deploy-contracts/'},
				{
					text: 'How-To Guides',
					collapsed: false,
					items: [
						{text: 'Guides', link: '/hardhat-deploy/documentation/how-to/'},
						{
							text: 'Getting Started',
							collapsed: true,
							items: [
								{text: 'Set Up Your First Project', link: '/hardhat-deploy/documentation/how-to/setup-first-project/'},
								{text: 'Migrate from v1', link: '/hardhat-deploy/documentation/how-to/migration-from-v1/'},
								{
									text: 'Configure Network Helpers',
									link: '/hardhat-deploy/documentation/how-to/configure-network-helpers/',
								},
								{
									text: 'Configure Named Accounts',
									link: '/hardhat-deploy/documentation/how-to/configure-named-accounts/',
								},
								{
									text: 'Use Tags and Dependencies',
									link: '/hardhat-deploy/documentation/how-to/use-tags-and-dependencies/',
								},
							],
						},
						{
							text: 'Contract Patterns',
							collapsed: true,
							items: [
								{text: 'Proxy Contracts', link: '/hardhat-deploy/documentation/how-to/deploy-with-proxies/'},
								{text: 'Diamond Contracts', link: '/hardhat-deploy/documentation/how-to/deploy-diamond-contracts/'},
							],
						},
						{
							text: 'Testing Integration',
							collapsed: true,
							items: [
								{
									text: 'Use Deployment Fixtures in Tests',
									link: '/hardhat-deploy/documentation/how-to/deployment-fixtures-in-tests/',
								},
								{text: 'Use Fork Testing', link: '/hardhat-deploy/documentation/how-to/use-fork-testing/'},
							],
						},
						{
							text: 'Development Workflow',
							collapsed: true,
							items: [
								{text: 'Use Viem Integration', link: '/hardhat-deploy/documentation/how-to/use-viem-integration/'},
								{text: 'Verify Contracts', link: '/hardhat-deploy/documentation/how-to/verify-contracts/'},
								{
									text: 'Export Deployments for Frontend',
									link: '/hardhat-deploy/documentation/how-to/export-deployments/',
								},
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
		'media/**',
		'.changeset/**',
		'.kilo/**',
		'AGENTS.md',
		'CONTEXT.md',
		'TESTING.md',
		// GitHub reads this one from the repository root (it is what powers the "Report a
		// vulnerability" button); it is not a docs page, and nothing in the sidebar links to it.
		// The user-facing half of it lives in documentation.md under "Production hardening".
		'SECURITY.md',
	],

	// Every page is emitted as `<name>/index.html`, never `<name>.html`, so that a URL
	// without an extension resolves natively on any static host (a directory request
	// serves its index) rather than depending on host-specific rewrite rules. Source
	// files follow the same convention: `documentation/installation/index.md`, and so on.
	// `cleanUrls` does NOT do this: it only strips `.html` from links and still emits
	// `<name>.html`, which is exactly the dependency on host rewrites we are avoiding.
	rewrites(id) {
		if (id === 'README.md') {
			return 'introduction/index.md';
		}
		return id;
	},

	ignoreDeadLinks: [
		// Ignore any link starting with ./packages/
		/^\.\/packages\//,
		'./LICENSE',
	],
});
