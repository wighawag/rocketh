#!/usr/bin/env npx tsx

/**
 * Script to convert TypeScript files with `export default {` pattern into JSON files.
 *
 * Usage:
 *   npx tsx scripts/ts-to-json.ts <input.ts> [output.json]
 *   npx tsx scripts/ts-to-json.ts --dir <directory> [--output-dir <outputDir>]
 *
 * Examples:
 *   npx tsx scripts/ts-to-json.ts packages/rocketh-proxy/src/hardhat-deploy-v1-artifacts/EIP173Proxy.ts
 *   npx tsx scripts/ts-to-json.ts --dir packages/rocketh-proxy/src/hardhat-deploy-v1-artifacts
 */

import {readdir, writeFile, mkdir} from 'node:fs/promises';
import {join, basename, dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

async function convertFile(inputPath: string, outputPath?: string): Promise<void> {
	const absolutePath = resolve(inputPath);
	const fileUrl = pathToFileURL(absolutePath).href;

	// Dynamically import the TypeScript module
	const module = await import(fileUrl);
	const data = module.default;

	if (data === undefined) {
		throw new Error(`No default export found in ${inputPath}`);
	}

	// Convert to JSON with pretty formatting
	const json = JSON.stringify(data, null, '\t');

	// Determine output path
	const out = outputPath ?? inputPath.replace(/\.ts$/, '.json');

	// Ensure output directory exists
	await mkdir(dirname(out), {recursive: true});

	await writeFile(out, json + '\n', 'utf-8');
	console.log(`Converted: ${inputPath} -> ${out}`);
}

async function convertDirectory(dirPath: string, outputDir?: string): Promise<void> {
	const absoluteDirPath = resolve(dirPath);
	const files = await readdir(absoluteDirPath);

	const tsFiles = files.filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));

	if (tsFiles.length === 0) {
		console.log(`No TypeScript files found in ${dirPath}`);
		return;
	}

	for (const file of tsFiles) {
		const inputPath = join(absoluteDirPath, file);
		const outputFileName = file.replace(/\.ts$/, '.json');
		const outputPath = outputDir ? join(resolve(outputDir), outputFileName) : join(absoluteDirPath, outputFileName);

		try {
			await convertFile(inputPath, outputPath);
		} catch (error) {
			console.error(`Failed to convert ${inputPath}:`, error instanceof Error ? error.message : error);
		}
	}
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log(`
Usage:
  npx tsx scripts/ts-to-json.ts <input.ts> [output.json]
  npx tsx scripts/ts-to-json.ts --dir <directory> [--output-dir <outputDir>]

Options:
  --dir <directory>       Process all .ts files in a directory
  --output-dir <dir>      Output directory for converted files (with --dir)

Examples:
  npx tsx scripts/ts-to-json.ts file.ts
  npx tsx scripts/ts-to-json.ts file.ts output.json
  npx tsx scripts/ts-to-json.ts --dir ./artifacts
  npx tsx scripts/ts-to-json.ts --dir ./artifacts --output-dir ./json-artifacts
`);
		process.exit(1);
	}

	// Parse arguments
	const dirIndex = args.indexOf('--dir');
	const outputDirIndex = args.indexOf('--output-dir');

	if (dirIndex !== -1) {
		const dirPath = args[dirIndex + 1];
		if (!dirPath) {
			console.error('Error: --dir requires a directory path');
			process.exit(1);
		}

		const outputDir = outputDirIndex !== -1 ? args[outputDirIndex + 1] : undefined;
		await convertDirectory(dirPath, outputDir);
	} else {
		// Single file mode
		const inputPath = args[0];
		const outputPath = args[1];
		await convertFile(inputPath, outputPath);
	}
}

main().catch((error) => {
	console.error('Error:', error instanceof Error ? error.message : error);
	process.exit(1);
});
