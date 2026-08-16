/**
 * `<rocketh-playground>` — Browser Tests
 *
 * The headless suite in `playground.integration.test.ts` proves the deploy PIPELINE. This
 * proves the RUNTIME: that the custom element registers, that a real click deploys, and that
 * what the reader sees matches what the run produced.
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

const DEPLOY_TIMEOUT = 120_000;

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

/** The widget renders into a shadow root, so every query has to go through it. */
function shadow(element: HTMLElement): ShadowRoot {
	const root = element.shadowRoot;
	if (!root) {
		throw new Error(`${ELEMENT_NAME} has no shadow root: the element was never upgraded`);
	}
	return root;
}

function lines(element: HTMLElement): {source: string; text: string}[] {
	return [...shadow(element).querySelectorAll('.line')].map((line) => ({
		source: [...line.classList].find((name) => name !== 'line') ?? '',
		text: line.textContent ?? '',
	}));
}

async function waitFor(predicate: () => boolean, timeout = DEPLOY_TIMEOUT): Promise<void> {
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		if (predicate()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	throw new Error('timed out waiting for the widget');
}

const succeeded = (element: HTMLElement) => lines(element).some((line) => line.source === 'success');

async function runOnce(element: HTMLElement): Promise<void> {
	const button = shadow(element).querySelector('button.run');
	if (!(button instanceof HTMLButtonElement)) {
		throw new Error('no run button');
	}
	button.click();
	await waitFor(() => succeeded(element) && !button.disabled);
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

		it('should upgrade an element that was already in the DOM, and render a Run button', async () => {
			const element = await mount();

			expect(element.shadowRoot).not.toBeNull();
			expect(shadow(element).querySelector('button.run')?.textContent).toContain('Run');
		});

		it('should keep its styles in a shadow root, so a host page cannot restyle it by accident', async () => {
			// This is why the widget is safe to drop into a docs site whose CSS it does not
			// control, and the reason `shadow: 'open'` is not just a default we inherited.
			const element = await mount();

			expect(shadow(element).querySelector('style')).not.toBeNull();
			expect(document.querySelector('.terminal')).toBeNull();
		});
	});

	describe('Deploying from a click', () => {
		it(
			'should deploy a real contract and show what the script printed',
			async () => {
				/**
				 * The whole widget, driven the way a reader drives it.
				 */
				const element = await mount();

				await runOnce(element);

				const rendered = lines(element);
				expect(rendered.some((line) => line.source === 'script' && line.text.includes('proxy deployed at 0x'))).toBe(
					true,
				);
				// The reader sees the script's own words, not a synthetic success message.
				expect(rendered.some((line) => line.text.includes('Current message for deployer: ""'))).toBe(true);
				expect(rendered.at(-1)?.source).toBe('success');
			},
			DEPLOY_TIMEOUT,
		);

		it(
			'should report code size, not merely an address',
			async () => {
				/**
				 * A proxy over a missing implementation would show an address here and answer `0x`
				 * to every call, so the byte count is the part that carries the proof.
				 */
				const element = await mount();

				await runOnce(element);

				const deployed = shadow(element).querySelectorAll('.panel')[0]?.textContent ?? '';
				expect(deployed).toContain('GreetingsRegistry');
				expect(deployed).toMatch(/[1-9]\d*\s+bytes of code/);
				expect(deployed).not.toMatch(/\b0 bytes of code/);
			},
			DEPLOY_TIMEOUT,
		);

		it(
			'should list the deployment files the run wrote',
			async () => {
				const element = await mount();

				await runOnce(element);

				const files = shadow(element).querySelectorAll('.panel')[1]?.textContent ?? '';
				expect(files).toContain('deployments/browser/GreetingsRegistry.json');
				expect(files).toContain('deployments/browser/.chain');
			},
			DEPLOY_TIMEOUT,
		);

		it(
			'should not show an error line on a run that succeeded',
			async () => {
				// rocketh writes `chain with id <id> has no public info` to console.error for a
				// chain it does not recognise. The playground declares its chain so that never
				// fires; if that regressed, a reader would watch a red line scroll past a healthy
				// deploy.
				const element = await mount();

				await runOnce(element);

				expect(lines(element).filter((line) => line.source === 'error')).toEqual([]);
			},
			DEPLOY_TIMEOUT,
		);
	});

	describe('Running twice', () => {
		it(
			'should redeploy on a second press and show one run worth of lines',
			async () => {
				/**
				 * Note what this can and cannot prove. Both runs print identical text, so if the
				 * terminal froze on run 1's output this assertion would still hold: it confirms the
				 * widget stays usable and does not visibly stack two runs, and nothing more.
				 *
				 * The `each_key_duplicate` regression is pinned by the Terminal test below, where the
				 * two runs say different things and a stale render is therefore detectable. Keeping
				 * that honest matters: this test as originally written asserted on a DOM that the
				 * thrown error had frozen, and passed with the bug fully present.
				 */
				const element = await mount();

				await runOnce(element);
				const afterFirst = lines(element).length;

				await runOnce(element);
				const afterSecond = lines(element);

				expect(afterSecond).toHaveLength(afterFirst);
				expect(afterSecond.at(-1)?.source).toBe('success');
			},
			DEPLOY_TIMEOUT * 2,
		);

		it(
			'should offer to run again rather than staying disabled',
			async () => {
				const element = await mount();

				await runOnce(element);

				const button = shadow(element).querySelector('button.run');
				expect(button?.textContent).toContain('Run again');
				expect((button as HTMLButtonElement).disabled).toBe(false);
			},
			DEPLOY_TIMEOUT,
		);
	});

	describe('Terminal, across a cleared stream', () => {
		it('should show the second run only, and none of the first', async () => {
			/**
			 * REGRESSION, and the one that actually catches it.
			 *
			 * The terminal used to accumulate entries locally. `clear()` restarts `seq` at 0, so
			 * a second run produced two entries keyed 0, Svelte threw `each_key_duplicate`, and
			 * the render froze on the previous run's output.
			 *
			 * The two runs here say DIFFERENT things, which is what makes a frozen render
			 * detectable at all. Verified to fail when the accumulating subscriber is put back.
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
	});
});
