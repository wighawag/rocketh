import type {Theme} from 'vitepress';
import DefaultTheme from 'vitepress/theme';

/**
 * The docs theme, extended only to register the interactive widgets.
 *
 * `<rocketh-playground>` is a CUSTOM ELEMENT, not a Vue component, so there is nothing to
 * register with Vue here: `isCustomElement` in `config.mts` tells the Vue compiler to leave
 * the tag alone, and importing the module defines it in the browser. That is what keeps the
 * widget usable outside this site.
 *
 * Imported dynamically and only outside SSR, because defining a custom element needs
 * `customElements`, which does not exist while VitePress renders pages in node. The import is
 * also deliberately NOT awaited: the page must paint without waiting on the widget, and an
 * upgrade of an already-parsed `<rocketh-playground>` element is exactly what custom elements
 * are specified to handle.
 *
 * It loads on EVERY page, not only pages that use the tag, which costs about 15KB gzipped of
 * Svelte and component code site-wide. That is a deliberate trade for having no route hook and
 * no DOM watching to keep correct. The part that would actually hurt (the EVM and rocketh, a
 * 1.6MB chunk) is behind the Run button, not here.
 */
export default {
	extends: DefaultTheme,
	enhanceApp() {
		if (!import.meta.env.SSR) {
			void import('@rocketh/playground/element');
		}
	},
} satisfies Theme;
