import { describe, test, expect, vi } from 'vitest';
import { customElement, css, html } from '../../..';

describe('Adopting stylesheets', () => {
	test('adoptStyleSheet with CSSStyleSheet adds styles to shadow root', async () => {
		const TestElement = customElement(
			({ adoptStyleSheet }) => {
				const styles = css`
					:host {
						display: block;
					}
					.test {
						color: red;
					}
				`;
				adoptStyleSheet(styles);
				return html`<span class="test">Styled</span>`;
			},
			{
				shadowRootOptions: { mode: 'open' },
			},
		);

		TestElement.define('adopt-stylesheet-test');

		await customElements.whenDefined('adopt-stylesheet-test');

		const el = document.createElement('adopt-stylesheet-test');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		const shadow = el.shadowRoot;
		const adoptedSheets = shadow?.adoptedStyleSheets;

		expect(adoptedSheets?.length ?? 0).toBeGreaterThan(0);
		expect(adoptedSheets && adoptedSheets.length > 0 && adoptedSheets[0].cssRules.length > 0).toBe(true);

		// Cleanup
		el.remove();
	});

	test('adoptStyleSheet appends style element to shadow root when not a CSSStyleSheet', async () => {
		const TestElement = customElement(
			({ adoptStyleSheet }) => {
				// Create a style element instead of using css``
				const styleEl = document.createElement('style');
				styleEl.textContent = '.test { color: blue; }';
				adoptStyleSheet(styleEl);
				return html`<span class="test">Styled</span>`;
			},
			{
				shadowRootOptions: { mode: 'open' },
			},
		);

		TestElement.define('adopt-style-element-test');

		await customElements.whenDefined('adopt-style-element-test');

		const el = document.createElement('adopt-style-element-test');
		document.body.appendChild(el);

		// Wait for render and rAF
		await new Promise((resolve) => setTimeout(resolve, 100));

		const shadow = el.shadowRoot;
		const styleElement = shadow?.querySelector('style');

		expect(styleElement).toBeTruthy();
		expect(styleElement?.textContent).toContain('color: blue');

		// Cleanup
		el.remove();
	});

	test('warns and applies to document when no shadow DOM and :host styles present', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const TestElement = customElement(
			({ adoptStyleSheet }) => {
				const styles = css`
					:host {
						display: block;
					}
				`;
				adoptStyleSheet(styles);
				return html`<span>No Shadow</span>`;
			},
			{
				attachShadow: false,
			},
		);

		TestElement.define('no-shadow-styles-test');

		await customElements.whenDefined('no-shadow-styles-test');

		const container = document.createElement('div');
		container.innerHTML = '<no-shadow-styles-test></no-shadow-styles-test>';
		document.body.appendChild(container);

		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should have warned about styles not being encapsulated
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Styles are only encapsulated when using shadow DOM'));

		// Should have errored about :host styles
		expect(errorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Styles with :host are not supported when not using shadow DOM'),
		);

		// Cleanup
		warnSpy.mockRestore();
		errorSpy.mockRestore();
		container.remove();
	});
});
