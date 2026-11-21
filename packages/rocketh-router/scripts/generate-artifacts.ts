/**
 * Write this package's JSON router artifacts (`artifacts/*.json`) from the `solidity-proxy`
 * it depends on.
 *
 *     pnpm --filter @rocketh/router generate:artifacts
 *     pnpm --filter @rocketh/router verify:artifacts   # --check: write nothing, fail on drift
 *
 * `deployViaRouter` imports its routers from `solidity-proxy` directly; these copies are for
 * a tool that reads artifacts from a directory (`hardhat-external-artifacts`' `modules`). Run
 * it after bumping `solidity-proxy`; `test/artifacts.test.ts` fails until it is run.
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as solidityProxyArtifacts from 'solidity-proxy/artifacts/index.js';
import {ROUTER_ARTIFACT_NAMES} from './router-artifact-names.js';

const check = process.argv.includes('--check');
const stale: string[] = [];

for (const name of ROUTER_ARTIFACT_NAMES) {
	const path = fileURLToPath(new URL(`../artifacts/${name}.json`, import.meta.url));
	const content = JSON.stringify(solidityProxyArtifacts[name], null, 2);
	let current: string | undefined;
	try {
		current = readFileSync(path, 'utf8');
	} catch {
		current = undefined;
	}
	if (current === content) {
		continue;
	}
	if (check) {
		stale.push(name);
	} else {
		writeFileSync(path, content);
		console.log(`wrote artifacts/${name}.json`);
	}
}

if (stale.length > 0) {
	console.error(`stale: ${stale.map((name) => `artifacts/${name}.json`).join(', ')} (run pnpm generate:artifacts)`);
	process.exit(1);
}
