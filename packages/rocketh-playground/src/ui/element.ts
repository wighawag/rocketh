/**
 * Registers `<rocketh-playground>`.
 *
 * WHY a custom element rather than a component for the docs site's framework: the docs are
 * VitePress (Vue) today, may be Svelte later, and the same widget should be droppable into a
 * README demo or anyone else's page. A custom element is the only form that is all three
 * without a per-framework wrapper, so the widget is never coupled to VitePress.
 *
 * Importing this module registers the element as a side effect. The registration itself lives
 * in `Playground.svelte`'s `<svelte:options customElement>`, which the Svelte compiler turns
 * into the `customElements.define` call; this module exists so consumers import a `.js` entry
 * with a stable name instead of a `.svelte` file, and so the tag name is available as a value.
 */
import './Playground.svelte';

export const ELEMENT_NAME = 'rocketh-playground';
