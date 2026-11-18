// Serves the build, opens each page in headless Chromium, prints what the page measured (time to
// an editor, time to the first type diagnostic) and the bytes it fetched, raw and gzip. Stops its
// server. Usage: pnpm build && node measure.mjs
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
const require = createRequire(import.meta.url);
const {chromium} = require(
	process.env.PLAYWRIGHT_PATH ?? '../../../packages/rocketh-playground/node_modules/playwright',
);

const port = 4318;
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
	stdio: 'ignore',
	detached: true,
});
try {
	await new Promise((r) => setTimeout(r, 2500));
	const browser = await chromium.launch();
	for (const name of ['cm', 'cm-ts', 'monaco']) {
		const page = await (await browser.newContext()).newPage();
		let raw = 0;
		let gz = 0;
		page.on('response', async (response) => {
			try {
				const body = await response.body();
				raw += body.length;
				gz += gzipSync(body).length;
			} catch {}
		});
		const t0 = Date.now();
		await page.goto(`http://localhost:${port}/${name}.html`);
		await page.waitForFunction(() => window.editorSpike, null, {timeout: 60000});
		const result = await page.evaluate(() => window.editorSpike);
		console.log(
			JSON.stringify({
				...result,
				wallMs: Date.now() - t0,
				fetchedKB: Math.round(raw / 1024),
				fetchedGzipKB: Math.round(gz / 1024),
			}),
		);
		await page.close();
	}
	await browser.close();
} finally {
	process.kill(-server.pid);
}
