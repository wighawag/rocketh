// Drives the built spike in headless Chromium and prints what the page measured, plus the bytes
// it fetched. Usage: pnpm build && node measure.mjs (it starts and stops its own preview server).
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require(
	process.env.PLAYWRIGHT_PATH ?? '../../../packages/rocketh-playground/node_modules/playwright',
);

const port = 4317;
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
	stdio: 'ignore',
	detached: true,
});
try {
	await new Promise((r) => setTimeout(r, 2500));
	const browser = await chromium.launch();
	const page = await browser.newPage();
	const bytes = {};
	page.on('response', async (response) => {
		try {
			const body = await response.body();
			const url = new URL(response.url());
			bytes[url.host === `localhost:${port}` ? url.pathname : url.href] = body.length;
		} catch {}
	});
	page.on('console', (m) => process.stdout.write(`[page] ${m.text()}\n`));
	const t0 = Date.now();
	await page.goto(`http://localhost:${port}/`);
	await page.click('#run');
	await page.waitForFunction(() => window.spikeResult, null, {timeout: 120000});
	const result = await page.evaluate(() => window.spikeResult);
	const record = await page.textContent('#record');
	console.log(JSON.stringify({wallMs: Date.now() - t0, result, bytes}, null, 2));
	console.log(record);
	await browser.close();
} finally {
	process.kill(-server.pid);
}
