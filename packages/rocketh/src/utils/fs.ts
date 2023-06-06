// taken from https://github.com/vitejs/vite/blob/63524bac878e8d3771d34ad7ad2e10cd16870ff4/packages/vite/src/node/utils.ts#L371-L400
import fs from 'node:fs';
import path from 'node:path';

interface LookupFileOptions {
	pathOnly?: boolean;
	rootDir?: string;
	predicate?: (file: string) => boolean;
}

export function lookupFile(dir: string, formats: string[], options?: LookupFileOptions): string | undefined {
	for (const format of formats) {
		const fullPath = path.join(dir, format);
		if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
			const result = options?.pathOnly ? fullPath : fs.readFileSync(fullPath, 'utf-8');
			if (!options?.predicate || options.predicate(result)) {
				return result;
			}
		}
	}
	const parentDir = path.dirname(dir);
	if (parentDir !== dir && (!options?.rootDir || parentDir.startsWith(options?.rootDir))) {
		return lookupFile(parentDir, formats, options);
	}
}

export function traverseMultipleDirectory(dirs: string[]): string[] {
	const filepaths = [];
	for (const dir of dirs) {
		let filesStats = traverse(dir);
		filesStats = filesStats.filter((v) => !v.directory);
		for (const filestat of filesStats) {
			filepaths.push(path.join(dir, filestat.relativePath));
		}
	}
	return filepaths;
}

export const traverse = function (
	dir: string,
	result: any[] = [],
	topDir?: string,
	filter?: (name: string, stats: any) => boolean // TODO any is Stats
): Array<{
	name: string;
	path: string;
	relativePath: string;
	mtimeMs: number;
	directory: boolean;
}> {
	fs.readdirSync(dir).forEach((name) => {
		const fPath = path.resolve(dir, name);
		const stats = fs.statSync(fPath);
		if ((!filter && !name.startsWith('.')) || (filter && filter(name, stats))) {
			const fileStats = {
				name,
				path: fPath,
				relativePath: path.relative(topDir || dir, fPath),
				mtimeMs: stats.mtimeMs,
				directory: stats.isDirectory(),
			};
			if (fileStats.directory) {
				result.push(fileStats);
				return traverse(fPath, result, topDir || dir, filter);
			}
			result.push(fileStats);
		}
	});
	return result;
};
