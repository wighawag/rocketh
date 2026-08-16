<script lang="ts">
	/**
	 * The step list: where the reader is, and what happens next.
	 *
	 * Presentational. It owns no playground, so a different tutorial can reuse it.
	 */
	import type {StepState} from '../core/playground.js';

	let {steps, activeIndex, running}: {steps: readonly StepState[]; activeIndex: number; running: boolean} = $props();
</script>

<ol class="steps">
	{#each steps as {step, status}, index (step.id)}
		<li class="step {status}" class:active={index === activeIndex} aria-current={index === activeIndex ? 'step' : undefined}>
			<span class="marker" aria-hidden="true">
				{#if status === 'done'}✓{:else if status === 'failed'}×{:else if status === 'running'}…{:else}{index + 1}{/if}
			</span>
			<span class="body">
				<span class="label">{step.label}</span>
				{#if step.description}<span class="description">{step.description}</span>{/if}
			</span>
			<span class="state">
				{#if status === 'running' || (running && index === activeIndex)}
					running
				{:else if status === 'done'}
					done
				{:else if status === 'failed'}
					failed
				{/if}
			</span>
		</li>
	{/each}
</ol>

<style>
	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.step {
		display: grid;
		grid-template-columns: 1.5rem 1fr auto;
		gap: 0.6rem;
		align-items: baseline;
		padding: 0.5rem 1rem;
		border-top: 1px solid var(--rocketh-playground-border, #d0d7de);
		font-size: 0.8125rem;
	}

	.step:first-child {
		border-top: 0;
	}

	/* The step the reader is about to run, or is watching run. */
	.step.active {
		background: var(--rocketh-playground-active, #f2f7ff);
	}

	.marker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 50%;
		font-size: 0.7rem;
		font-weight: 700;
		background: #e6e9ee;
		color: #57606a;
	}

	.step.done .marker {
		background: #dafbe1;
		color: #1a7f37;
	}

	.step.failed .marker {
		background: #ffebe9;
		color: #cf222e;
	}

	.step.active .marker {
		background: #2f6feb;
		color: #ffffff;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.label {
		font-weight: 600;
	}

	.description {
		color: var(--rocketh-playground-muted, #656d76);
		font-size: 0.75rem;
	}

	.state {
		color: var(--rocketh-playground-muted, #656d76);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.step.done .state {
		color: #1a7f37;
	}

	.step.failed .state {
		color: #cf222e;
	}
</style>
