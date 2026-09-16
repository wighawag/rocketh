#!/usr/bin/env node

import {Command} from 'commander';
import {readFileSync, readdirSync, mkdirSync, copyFileSync, existsSync, writeFileSync, statSync} from 'fs';
import {join, dirname, basename} from 'path';
import {fileURLToPath} from 'url';
import * as readline from 'readline';
import pkg from '../package.json' with {type: 'json'};
import {createIgnoreFilter, parseGitignore, type IgnoreFilter} from './utils/gitignore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Get the current version of hardhat-deploy
const getHardhatDeployVersion = (): string => {
	return pkg.version;
};

const askFolder = async (): Promise<string> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question('Enter folder path (default: ./): ', (answer) => {
			rl.close();
			resolve(answer.trim() || './');
		});
	});
};

const askAutoInstall = async (): Promise<boolean> => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question('Auto-install dependencies with pnpm? (Y/n): ', (answer) => {
			rl.close();
			const trimmed = answer.trim().toLowerCase();
			resolve(trimmed === '' || trimmed === 'y' || trimmed === 'yes');
		});
	});
};

const isFolderEmpty = (folderPath: string): boolean => {
	if (!existsSync(folderPath)) {
		return true;
	}

	try {
		const files = readdirSync(folderPath);
		return files.length === 0;
	} catch (error) {
		// If we can't read the directory, treat it as not empty
		return false;
	}
};

const copyFile = (source: string, target: string, replacements: Record<string, string> = {}): void => {
	let content = readFileSync(source, 'utf-8');

	// Apply replacements
	for (const [search, replace] of Object.entries(replacements)) {
		content = content.replaceAll(search, replace);
	}

	mkdirSync(dirname(target), {recursive: true});

	// For binary files, just copy as-is
	if (source.endsWith('.lock') || source.endsWith('.so') || source.endsWith('.wasm')) {
		copyFileSync(source, target);
	} else {
		writeFileSync(target, content, 'utf-8');
	}
};

const readGitignore = (gitignorePath: string): IgnoreFilter => {
	if (!existsSync(gitignorePath)) {
		return () => false;
	}
	return createIgnoreFilter(parseGitignore(readFileSync(gitignorePath, 'utf-8')));
};

const copyFolder = (
	source: string,
	target: string,
	replacements: Record<string, string> = {},
	isIgnored: IgnoreFilter = () => false,
	relativePath = '',
): void => {
	if (!existsSync(target)) {
		mkdirSync(target, {recursive: true});
	}

	const files = readdirSync(source);

	files.forEach((file) => {
		const sourcePath = join(source, file);
		const targetPath = join(target, file);
		// Patterns in the template's .gitignore are relative to the template root, so the
		// path has to be accumulated during the walk. Matching on basename alone would make
		// every anchored pattern (`/dist`, `src/generated`) either miss or over-match.
		const entryRelativePath = relativePath ? `${relativePath}/${file}` : file;

		const stat = statSync(sourcePath);

		if (stat.isDirectory()) {
			if (!isIgnored(entryRelativePath, true)) {
				copyFolder(sourcePath, targetPath, replacements, isIgnored, entryRelativePath);
			}
		} else if (!isIgnored(entryRelativePath, false)) {
			copyFile(sourcePath, targetPath, replacements);
		}
	});
};

const generateProject = (targetFolder: string, projectName?: string): void => {
	// find template in published package
	const templatePath = join(__dirname, '../templates/basic');
	const gitignorePath = join(templatePath, '.gitignore');

	// Parse gitignore patterns
	const isIgnored = readGitignore(gitignorePath);

	// Determine project name from folder or use placeholder
	const folderName = projectName || basename(targetFolder === './' ? process.cwd() : targetFolder);

	// Get the current version of hardhat-deploy
	const hardhatDeployVersion = getHardhatDeployVersion();

	const replacements: Record<string, string> = {
		'template-hardhat-node-test-runner': `${folderName}`,
		// A CARET, not the bare version. This string lands in the scaffolded project's
		//  package.json permanently, so an exact pin would hold that project on whichever
		//  CLI version happened to create it and refuse every later patch, which is the
		//  same staleness the template's own ranges are kept clear of (see
		//  `scripts/sync-template-versions.ts`). `^` gives the newest compatible release at
		//  scaffold time, and the generated lockfile pins it from then on.
		'workspace:*': `^${hardhatDeployVersion}`,
	};

	console.log(`Generating project in: ${targetFolder}`);
	copyFolder(templatePath, targetFolder, replacements, isIgnored);
	console.log('✓ Project initialized successfully!');
};

const runPnpmInstall = async (folderPath: string): Promise<void> => {
	console.log(`Installing dependencies...`);
	const {spawn} = await import('child_process');

	return new Promise((resolve, reject) => {
		// Use --ignore-workspace to ensure dependencies are installed locally
		// This prevents pnpm from treating the target folder as part of a parent workspace
		const pnpm = spawn('pnpm', ['install', '--ignore-workspace', `--no-frozen-lockfile`], {
			cwd: folderPath,
			stdio: 'inherit',
		});

		pnpm.on('close', (code) => {
			if (code === 0) {
				console.log('✓ Dependencies installed successfully!');
				resolve();
			} else {
				reject(new Error(`pnpm install failed with exit code ${code}`));
			}
		});

		pnpm.on('error', (error) => {
			reject(error);
		});
	});
};

program.name('hardhat-deploy').description('CLI for hardhat-deploy').version(pkg.version);

program
	.command('init')
	.argument('[folder]', 'folder to initialize the project in')
	.option('--install', 'auto-install dependencies with pnpm')
	.description('Initialize a new hardhat-deploy project')
	.action(async (folder?: string, options?: {install?: boolean}) => {
		let targetFolder = folder;
		let autoInstall = options?.install ?? false;

		// If no folder specified, ask user
		if (!targetFolder) {
			targetFolder = await askFolder();
			// If we prompted for folder, also prompt for auto-install
			autoInstall = await askAutoInstall();
		}

		// Normalize path
		targetFolder = targetFolder.trim();

		// Check if folder is empty
		if (!isFolderEmpty(targetFolder)) {
			console.error(
				`Error: Folder "${targetFolder}" is not empty. Please specify an empty folder or a new folder path.`,
			);
			process.exit(1);
		}

		// Generate project
		generateProject(targetFolder);

		// Auto-install if requested
		if (autoInstall) {
			try {
				await runPnpmInstall(targetFolder);
			} catch (error) {
				console.error('Failed to install dependencies:', error);
				console.log('\nYou can install dependencies manually:');
				console.log(`  cd ${targetFolder === './' ? '.' : targetFolder}`);
				console.log('  pnpm install');
				process.exit(1);
			}
		}

		// Show next steps
		console.log(`\nNext steps:`);
		console.log(`  cd ${targetFolder === './' ? '.' : targetFolder}`);
		if (!autoInstall) {
			console.log(`  pnpm install`);
		}
		console.log(`  pnpm hardhat test`);
	});

program.parse();
