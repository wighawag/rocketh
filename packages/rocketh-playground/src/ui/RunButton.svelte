<script lang="ts">
	/**
	 * The Run control. Presentational on purpose: it owns no playground and no chain, so it can
	 * sit above any core-driven snippet.
	 */
	let {
		running = false,
		hasRun = false,
		onrun,
	}: {running?: boolean; hasRun?: boolean; onrun: () => void} = $props();
</script>

<button type="button" class="run" disabled={running} onclick={onrun} aria-busy={running}>
	{#if running}
		<span class="spinner" aria-hidden="true"></span>
		Deploying…
	{:else}
		<span class="glyph" aria-hidden="true">▶</span>
		{hasRun ? 'Run again' : 'Run'}
	{/if}
</button>

<style>
	.run {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 0;
		border-radius: 0.375rem;
		padding: 0.4rem 0.9rem;
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #ffffff;
		background: #2f6feb;
		cursor: pointer;
		transition: background 120ms ease;
	}

	.run:hover:not(:disabled) {
		background: #1f5ed4;
	}

	.run:disabled {
		background: #4b5563;
		cursor: progress;
	}

	.run:focus-visible {
		outline: 2px solid #58a6ff;
		outline-offset: 2px;
	}

	.glyph {
		font-size: 0.7rem;
	}

	.spinner {
		width: 0.7rem;
		height: 0.7rem;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 700ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* A reader who asked for less motion gets a static ring rather than no feedback at all. */
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
