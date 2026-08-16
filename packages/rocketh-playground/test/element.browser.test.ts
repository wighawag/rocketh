/**
 * `<rocketh-playground>` — Browser Tests
 *
 * The headless suite in `playground.integration.test.ts` proves the deploy PIPELINE. This
 * proves the RUNTIME: that the custom element registers, that real clicks walk the tutorial,
 * and that what the reader sees matches what the run produced.
 *
 * It is a separate, opt-in suite (see `vitest.browser.config.ts`) because it needs a
 * playwright chromium. It is worth its keep: both bugs this widget has had were invisible to a
 * node test, and one of them only appeared on the SECOND run.
 */
import {mount as mountComponent, unmount} from 'svelte';
import {beforeEach, describe, expect, it} from 'vitest';
import {createLogStream} from '../src/core/log-stream.js';
import Terminal from '../src/ui/Terminal.svelte';
import {ELEMENT_NAME} from '../src/ui/element.js';

const STEP_TIMEOUT = 120_000;

/** The widget renders into a shadow root, so every query has to go through it. */
function shadow(element: HTMLElement): ShadowRoot {
	const root = element.shadowRoot;
	if (!root) {
		throw new Error(`${ELEMENT_NAME} has no shadow root: the element was never upgraded`);
	}
	return root;
}

async function waitFor(predicate: () => boolean, timeout = STEP_TIMEOUT): Promise<void> {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		if (predicate()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error('timed out waiting for the widget');
}

/**
 * Append the element and wait for its first render.
 *
 * The wait is not incidental: a Svelte custom element attaches its shadow root in
 * `connectedCallback` but fills it when effects flush, so `shadowRoot` is non-null and EMPTY
 * on the line after `appendChild`. Querying synchronously finds nothing and reads as a broken
 * widget rather than as a test that looked too early.
 */
async function mount(): Promise<HTMLElement> {
	const element = document.createElement(ELEMENT_NAME);
	document.body.appendChild(element);
	await waitFor(() => !!element.shadowRoot?.querySelector('button.run'), 5_000);
	return element;
}

function button(element: HTMLElement): HTMLButtonElement {
	const found = shadow(element).querySelector('button.run');
	if (!(found instanceof HTMLButtonElement)) {
		throw new Error('no run button');
	}
	return found;
}

function lines(element: HTMLElement): {source: string; text: string}[] {
	return [...shadow(element).querySelectorAll('.line')].map((line) => ({
		source: [...line.classList].find((name) => name !== 'line') ?? '',
		text: line.textContent ?? '',
	}));
}

const doneCount = (element: HTMLElement) => shadow(element).querySelectorAll('.step.done').length;

/** Click the button and wait until one more step has completed. */
async function runStep(element: HTMLElement): Promise<void> {
	const before = doneCount(element);
	button(element).click();
	await waitFor(() => doneCount(element) > before && !button(element).disabled);
}

describe('<rocketh-playground> - Browser Tests', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	describe('Registration', () => {
		it('should define the element as a side effect of importing the module', () => {
			/**
			 * The docs site does nothing but import this module: there is no Vue component to
			 * register and no mount call. If the import stopped registering, the tag would
			 * render as an inert unknown element and the page would look merely empty.
			 */
			expect(customElements.get(ELEMENT_NAME)).toBeDefined();
		});

		it('should upgrade an element that was already in the DOM, and offer to start', async () => {
			const element = await mount();

			expect(element.shadowRoot).not.toBeNull();
			expect(button(element).textContent).toContain('Start');
		});

		it('should keep its styles in a shadow root, so a host page cannot restyle it by accident', async () => {
			// This is why the widget is safe to drop into a docs site whose CSS it does not
			// control, and the reason `shadow: 'open'` is not just a default we inherited.
			const element = await mount();

			expect(shadow(element).querySelector('style')).not.toBeNull();
			expect(document.querySelector('.terminal')).toBeNull();
		});
	});

	describe('Walking the tutorial', () => {
		it(
			'should deploy on the first step and show what the script printed',
			async () => {
				const element = await mount();

				await runStep(element);

				const rendered = lines(element);
				expect(rendered.some((line) => line.source === 'script' && line.text.includes('proxy      -> 0x'))).toBe(true);
				expect(rendered.some((line) => line.source === 'step' && line.text.includes('Step 1 of 4'))).toBe(true);
				expect(doneCount(element)).toBe(1);
			},
			STEP_TIMEOUT,
		);

		it(
			'should report code size, not merely an address',
			async () => {
				/**
				 * A proxy over a missing implementation would show an address here and answer `0x`
				 * to every call, so the byte count is the part that carries the proof.
				 */
				const element = await mount();

				await runStep(element);

				const deployed = shadow(element).querySelectorAll('.panel')[0]?.textContent ?? '';
				expect(deployed).toContain('GreetingsRegistry');
				expect(deployed).toMatch(/[1-9]\d*\s+bytes/);
				expect(deployed).not.toMatch(/\b0 bytes/);
			},
			STEP_TIMEOUT,
		);

		it(
			'should mark the proxy unchanged and the implementation replaced after the upgrade',
			async () => {
				/**
				 * The payoff, as the reader sees it. Everything else in the widget is scaffolding
				 * for these two words appearing next to the right addresses.
				 */
				const element = await mount();

				await runStep(element); // deploy
				await runStep(element); // greeting
				await runStep(element); // upgrade

				const rows = [...shadow(element).querySelectorAll('.panel')[0]!.querySelectorAll('li')].map(
					(row) => row.textContent ?? '',
				);
				const proxyRow = rows.find((row) => row.startsWith('GreetingsRegistry0x') || /^GreetingsRegistry\b/.test(row));
				const implementationRow = rows.find((row) => row.includes('GreetingsRegistry_Implementation'));

				expect(proxyRow).toContain('same address');
				expect(implementationRow).toContain('replaced');
			},
			STEP_TIMEOUT * 3,
		);

		it(
			'should show the greeting gaining its prefix only after the upgrade',
			async () => {
				/**
				 * The whole narrative, asserted through the DOM: bare before, prefixed after.
				 */
				const element = await mount();

				await runStep(element);
				await runStep(element);
				const beforeUpgrade = lines(element).map((line) => line.text);
				expect(beforeUpgrade.some((text) => text.includes('read back  -> "hello"'))).toBe(true);

				await runStep(element);
				await runStep(element);
				const afterUpgrade = lines(element).map((line) => line.text);
				expect(afterUpgrade.some((text) => text.includes('read back  -> "proxy:hello again"'))).toBe(true);
			},
			STEP_TIMEOUT * 4,
		);

		it(
			'should offer to start again once every step is done',
			async () => {
				const element = await mount();

				for (let index = 0; index < 4; index++) {
					await runStep(element);
				}

				expect(doneCount(element)).toBe(4);
				expect(button(element).textContent).toContain('Start again');
				expect(button(element).disabled).toBe(false);
			},
			STEP_TIMEOUT * 4,
		);

		it(
			'should not show an error line while every step is succeeding',
			async () => {
				// rocketh writes `chain with id <id> has no public info` to console.error for a
				// chain it does not recognise. The playground declares its chain so that never
				// fires; if that regressed, a reader would watch a red line scroll past a healthy
				// deploy.
				const element = await mount();

				await runStep(element);
				await runStep(element);

				expect(lines(element).filter((line) => line.source === 'error')).toEqual([]);
			},
			STEP_TIMEOUT * 2,
		);
	});

	describe('Starting again', () => {
		it(
			'should reset every step and clear the transcript',
			async () => {
				const element = await mount();

				for (let index = 0; index < 4; index++) {
					await runStep(element);
				}
				button(element).click(); // Start again
				await waitFor(() => doneCount(element) === 0 && !button(element).disabled);

				expect(lines(element)).toEqual([]);
				expect(button(element).textContent).toContain('Start');
			},
			STEP_TIMEOUT * 5,
		);
	});

	describe('Terminal, across a cleared stream', () => {
		it('should show the second run only, and none of the first', async () => {
			/**
			 * REGRESSION, and the one that actually catches it.
			 *
			 * The terminal used to accumulate entries locally. `clear()` restarts `seq` at 0,
			 * so a reset produced two entries keyed 0, Svelte threw `each_key_duplicate`, and
			 * the render froze on the previous transcript.
			 *
			 * The two runs here say DIFFERENT things, which is what makes a frozen render
			 * detectable at all. A widget-level assertion cannot do this job, because the
			 * steps print the same text every time and a frozen render still satisfies it.
			 */
			const logs = createLogStream();
			const target = document.createElement('div');
			document.body.appendChild(target);
			const component = mountComponent(Terminal, {target, props: {logs}});

			try {
				logs.append('script', 'LINE FROM THE FIRST RUN');
				await waitFor(() => target.textContent?.includes('LINE FROM THE FIRST RUN') ?? false, 5_000);

				logs.clear();
				logs.append('script', 'LINE FROM THE SECOND RUN');
				await waitFor(() => target.textContent?.includes('LINE FROM THE SECOND RUN') ?? false, 5_000);

				expect(target.textContent).not.toContain('LINE FROM THE FIRST RUN');
				expect(target.querySelectorAll('.line')).toHaveLength(1);
			} finally {
				unmount(component);
			}
		});

		it('should render entries that arrived before it mounted', async () => {
			// The stream does not replay, so a terminal that mounts mid-run has to read history
			// rather than wait for the next line.
			const logs = createLogStream();
			logs.append('script', 'PRINTED BEFORE MOUNT');

			const target = document.createElement('div');
			document.body.appendChild(target);
			const component = mountComponent(Terminal, {target, props: {logs}});

			try {
				await waitFor(() => target.textContent?.includes('PRINTED BEFORE MOUNT') ?? false, 5_000);
				expect(target.querySelectorAll('.line')).toHaveLength(1);
			} finally {
				unmount(component);
			}
		});

		it('should keep scrolling to the newest line as a long transcript grows', async () => {
			/**
			 * Four steps produce far more output than one, and the terminal is a fixed height,
			 * so the tail has to stay visible without the reader chasing it. Untestable by
			 * hand on a phone, which is exactly why it is asserted here.
			 */
			const logs = createLogStream();
			const target = document.createElement('div');
			document.body.appendChild(target);
			const component = mountComponent(Terminal, {target, props: {logs}});

			try {
				for (let index = 0; index < 60; index++) {
					logs.append('script', `line number ${index}`);
				}
				await waitFor(() => target.textContent?.includes('line number 59') ?? false, 5_000);

				const scroller = target.querySelector('.terminal') as HTMLElement;
				await waitFor(() => scroller.scrollHeight > scroller.clientHeight, 5_000);
				await waitFor(() => Math.abs(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight) < 4, 5_000);

				expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
			} finally {
				unmount(component);
			}
		});
	});
});
