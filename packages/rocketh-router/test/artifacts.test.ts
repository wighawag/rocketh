/**
 * The router artifacts this package also ships as JSON, under `@rocketh/router/artifacts/*`,
 * for a tool that reads artifacts from a package's directory rather than importing them
 * (`hardhat-external-artifacts`' `externalArtifacts: {modules: ['@rocketh/router/artifacts']}`,
 * which is how a Hardhat project gets `artifacts.Router`; `demoes/hardhat-deploy/router` does).
 *
 * They are COPIES of `solidity-proxy`'s, written by `pnpm generate:artifacts`, so they can only
 * go stale: this pins each one to the version of `solidity-proxy` the package depends on,
 * which is what `deployViaRouter` deploys. (A copy left at solidity-proxy 0.5.2 once shipped
 * the `Router10X60` that misrouted selectors 48 to 59.)
 */

import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as solidityProxyArtifacts from 'solidity-proxy/artifacts/index.js';
import {ROUTER_ARTIFACT_NAMES} from '../scripts/router-artifact-names.js';

describe('@rocketh/router - the JSON artifacts', () => {
	it('ships the three routers', () => {
		expect([...ROUTER_ARTIFACT_NAMES].sort()).toEqual(['InlineRouter', 'Router', 'Router10X60']);
	});

	for (const name of ROUTER_ARTIFACT_NAMES) {
		it(`ships \`${name}\` exactly as the solidity-proxy it depends on`, () => {
			const path = fileURLToPath(new URL(`../artifacts/${name}.json`, import.meta.url));
			expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(solidityProxyArtifacts[name]);
		});
	}
});
