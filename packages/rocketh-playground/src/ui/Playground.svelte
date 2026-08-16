<!--
	Compiled to a custom element, and registered under this tag as a side effect of importing
	the module. `shadow: 'open'` (the default) is what keeps the docs site's CSS out of the
	widget and the widget's CSS out of the docs site, which is what makes it safe to drop into
	a page whose styling it does not control.
-->
<svelte:options customElement="rocketh-playground" />

<script lang="ts">
	/**
	 * The widget: a stepped tutorial over one EVM.
	 *
	 * It holds no deployment logic. Everything below the `import()` is the framework-free core,
	 * which is why the same behaviour is provable headlessly in `test/`.
	 *
	 * The core is imported LAZILY, on the first press, and that is not an optimisation detail:
	 * `embedded-eth-node` is ~750KB unpacked and would otherwise be downloaded by every reader
	 * of a documentation page whether or not they ever press Run.
	 */
	import type {LogStream, Playground, PlaygroundDeployment, StepResult, StepState} from '@rocketh/playground';
	import RunButton from './RunButton.svelte';
	import Steps from './Steps.svelte';
	import Terminal from './Terminal.svelte';

	let {
		heading = 'Deploy and upgrade a contract, right here',
		description = 'Four steps against a real EVM running inside this page. No wallet, no node, no network.',
	}: {heading?: string; description?: string} = $props();

	let playground = $state<Playground | undefined>();
	let logs = $state<LogStream | undefined>();
	let running = $state(false);
	let steps = $state<readonly StepState[]>([]);
	let activeIndex = $state(0);
	let finished = $state(false);
	let lastResult = $state<StepResult | undefined>();
	let files = $state<string[]>([]);
	let loadError = $state<string | undefined>();

	function sync(active: Playground) {
		steps = active.steps();
		activeIndex = active.nextStepIndex();
		finished = active.isFinished();
	}

	async function ensurePlayground(): Promise<Playground> {
		if (playground) {
			return playground;
		}
		const {createPlayground, greetingsRegistryPlayground} = await import('@rocketh/playground');
		const created = createPlayground(greetingsRegistryPlayground);
		// Render the deployment store as it fills in, rather than only at the end. This is the
		// part a reader watches: files appearing while the script talks.
		created.vfs.subscribe(() => {
			files = created.vfs.paths();
		});
		playground = created;
		logs = created.logs;
		sync(created);
		return created;
	}

	async function runNext() {
		running = true;
		loadError = undefined;
		try {
			const active = await ensurePlayground();
			lastResult = await active.runNextStep();
			sync(active);
		} catch (err) {
			// `runNextStep` reports a failed step as a result rather than throwing, so reaching
			// here means the core itself could not be loaded or constructed.
			loadError = err instanceof Error ? err.message : String(err);
		} finally {
			running = false;
		}
	}

	async function restart() {
		if (!playground) {
			return;
		}
		running = true;
		try {
			await playground.reset();
			lastResult = undefined;
			files = [];
			sync(playground);
		} finally {
			running = false;
		}
	}

	function shorten(address: string): string {
		return `${address.slice(0, 10)}…${address.slice(-8)}`;
	}

	/** The word next to an address. The proxy staying put is the entire lesson, so it is labelled. */
	function changeLabel(change: PlaygroundDeployment['change']): string {
		switch (change) {
			case 'new':
				return 'new';
			case 'changed':
				return 'replaced';
			case 'unchanged':
				return 'same address';
		}
	}

	/**
	 * Kept visible after the step that caused it, because `change` is relative to the previous
	 * step only: without this the implementation reads "replaced" during the upgrade and loses
	 * it on the very next click, taking the point of the tutorial with it.
	 */
	function sinceLabel(deployment: PlaygroundDeployment): string {
		return deployment.change === 'unchanged' ? `since step ${deployment.changedAtStep}` : '';
	}

	const nextLabel = $derived(
		finished ? 'Start again' : activeIndex === 0 ? 'Start' : `Step ${activeIndex + 1}: ${steps[activeIndex]?.step.label ?? ''}`,
	);
</script>

<section class="playground" aria-label={heading}>
	<header>
		<div class="titles">
			<h3>{heading}</h3>
			<p>{description}</p>
		</div>
		<div class="controls">
			{#if finished}
				<RunButton {running} hasRun={true} label="Start again" onrun={restart} />
			{:else}
				<RunButton {running} hasRun={activeIndex > 0} label={nextLabel} onrun={runNext} />
			{/if}
		</div>
	</header>

	{#if steps.length > 0}
		<Steps {steps} {activeIndex} {running} />
	{/if}

	{#if logs}
		<Terminal {logs} />
	{:else}
		<div class="terminal-placeholder">
			<p>Press Start to boot an EVM in this tab and deploy.</p>
		</div>
	{/if}

	{#if loadError}
		<p class="load-error" role="alert">Could not start the playground: {loadError}</p>
	{/if}

	{#if lastResult}
		<div class="results">
			<div class="panel">
				<h4>Deployed</h4>
				{#if lastResult.deployments.length === 0}
					<p class="empty">Nothing was deployed.</p>
				{:else}
					<ul>
						{#each lastResult.deployments as deployment (deployment.name)}
							<li>
								<span class="name">{deployment.name}</span>
								<code title={deployment.address}>{shorten(deployment.address)}</code>
								<span class="tag {deployment.change}">{changeLabel(deployment.change)}</span>
								{#if sinceLabel(deployment)}
									<span class="meta">{sinceLabel(deployment)}</span>
								{/if}
								<!-- Code SIZE, not just an address: a proxy over a missing implementation
								     would show an address here and answer 0x to every call. -->
								<span class="meta">{deployment.codeSize} bytes</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="panel">
				<h4>Deployment files</h4>
				{#if files.length === 0}
					<p class="empty">No files were written.</p>
				{:else}
					<ul class="files">
						{#each files as file (file)}
							<li><code>{file}</code></li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</section>

<style>
	:host {
		display: block;
	}

	.playground {
		border: 1px solid var(--rocketh-playground-border, #d0d7de);
		border-radius: 0.6rem;
		overflow: hidden;
		background: var(--rocketh-playground-surface, #ffffff);
		color: var(--rocketh-playground-text, #1f2328);
		font-family: var(
			--rocketh-playground-font,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Helvetica,
			Arial,
			sans-serif
		);
		margin: 1.5rem 0;
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 0.9rem 1rem;
		border-bottom: 1px solid var(--rocketh-playground-border, #d0d7de);
	}

	.titles h3 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.titles p {
		margin: 0.2rem 0 0;
		font-size: 0.8125rem;
		color: var(--rocketh-playground-muted, #656d76);
	}

	.controls {
		display: flex;
		gap: 0.5rem;
	}

	.terminal-placeholder {
		background: #0d1117;
		color: #6e7681;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.8125rem;
		padding: 0.75rem 0.9rem;
		height: 15rem;
	}

	.terminal-placeholder p {
		margin: 0;
		font-style: italic;
	}

	.load-error {
		margin: 0;
		padding: 0.6rem 1rem;
		background: #ffebe9;
		color: #82071e;
		font-size: 0.8125rem;
	}

	.results {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1px;
		background: var(--rocketh-playground-border, #d0d7de);
		border-top: 1px solid var(--rocketh-playground-border, #d0d7de);
	}

	.panel {
		background: var(--rocketh-playground-surface, #ffffff);
		padding: 0.75rem 1rem 0.9rem;
	}

	.panel h4 {
		margin: 0 0 0.45rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--rocketh-playground-muted, #656d76);
	}

	.panel ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.panel li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.4rem;
		font-size: 0.8125rem;
	}

	.name {
		font-weight: 600;
	}

	.meta,
	.empty {
		color: var(--rocketh-playground-muted, #656d76);
		font-size: 0.75rem;
	}

	.empty {
		margin: 0;
	}

	.tag {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.05rem 0.35rem;
		border-radius: 0.6rem;
		font-weight: 700;
	}

	.tag.new {
		background: #ddf4ff;
		color: #0969da;
	}

	/* The one that carries the lesson: the implementation was replaced. */
	.tag.changed {
		background: #fff1e5;
		color: #bc4c00;
	}

	/* And the other half of it: the proxy address did not move. */
	.tag.unchanged {
		background: #f0f1f3;
		color: #57606a;
	}

	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.75rem;
		background: var(--rocketh-playground-code-bg, #f6f8fa);
		border-radius: 0.25rem;
		padding: 0.05rem 0.3rem;
	}

	.files li {
		display: block;
	}
</style>
