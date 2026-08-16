<script lang="ts">
	/**
	 * A terminal-style view of a playground's log stream.
	 *
	 * Deliberately depends on NOTHING but the core's `LogStream` type, so a component that just
	 * wants to show a runnable snippet's output can use the core plus this and nothing else.
	 */
	import type {LogEntry, LogStream} from '../core/log-stream.js';

	let {logs, placeholder = 'Press Run to deploy.'}: {logs: LogStream; placeholder?: string} = $props();

	let entries = $state<LogEntry[]>([]);
	let scroller = $state<HTMLDivElement | undefined>();
	let pinnedToBottom = $state(true);

	$effect(() => {
		// Read what already happened BEFORE subscribing. The stream does not replay, and a
		// terminal that mounts mid-run must still show the lines it missed.
		entries = [...logs.entries()];
		// Re-read from the stream on every change rather than accumulating locally. Accumulating
		// meant a second run appended its lines to the first run's, and since `clear` restarts
		// `seq` at 0 the keyed `{#each}` then saw two entries keyed 0 and threw. Reading from the
		// source of truth cannot drift from it.
		return logs.subscribe(() => {
			entries = [...logs.entries()];
		});
	});

	$effect(() => {
		// Touch `entries` so this re-runs per line. Only follow the tail while the reader has
		// not scrolled up, so reading an earlier line is not yanked away by the next one.
		entries.length;
		if (pinnedToBottom && scroller) {
			scroller.scrollTop = scroller.scrollHeight;
		}
	});

	function onScroll() {
		if (!scroller) {
			return;
		}
		const distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
		pinnedToBottom = distanceFromBottom < 24;
	}
</script>

<div class="terminal" bind:this={scroller} onscroll={onScroll} role="log" aria-live="polite" aria-label="Deploy output">
	{#if entries.length === 0}
		<p class="placeholder">{placeholder}</p>
	{:else}
		{#each entries as entry (entry.seq)}
			<p class="line {entry.source}"><span class="gutter" aria-hidden="true">{prefixFor(entry.source)}</span>{entry.text}</p>
		{/each}
	{/if}
</div>

<script lang="ts" module>
	import type {LogSource} from '../core/log-stream.js';

	/** A one-glyph gutter, so the source is readable without relying on colour alone. */
	function prefixFor(source: LogSource): string {
		switch (source) {
			case 'playground':
				return '·';
			case 'script':
				return '>';
			case 'warning':
				return '!';
			case 'error':
				return '×';
			case 'success':
				return '✓';
		}
	}
</script>

<style>
	.terminal {
		background: #0d1117;
		color: #c9d1d9;
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.8125rem;
		line-height: 1.55;
		padding: 0.75rem 0.9rem;
		height: 15rem;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.placeholder {
		margin: 0;
		color: #6e7681;
		font-style: italic;
	}

	.line {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.gutter {
		display: inline-block;
		width: 1.1rem;
		color: #6e7681;
		user-select: none;
	}

	.playground {
		color: #8b949e;
	}
	.script {
		color: #c9d1d9;
	}
	.warning {
		color: #d29922;
	}
	.error {
		color: #f85149;
	}
	.success {
		color: #3fb950;
	}
</style>
