import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const elementInternalsTests = () => {
	test('elementRef provides access to the custom element instance', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			let elementTagName = '';

			const TestElement = customElement(({ elementRef }) => {
				elementTagName = elementRef.tagName.toLowerCase();
				return html`<span>Test</span>`;
			});

			TestElement.define('element-ref-test');

			await customElements.whenDefined('element-ref-test');

			const el = document.createElement('element-ref-test');
			document.body.appendChild(el);

			// Wait for element to be connected
			await new Promise((resolve) => setTimeout(resolve, 100));

			return elementTagName;
		});

		expect(result).toBe('element-ref-test');
	});

	test('internals provides ElementInternals', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			let hasInternals = false;

			const TestElement = customElement(({ internals }) => {
				hasInternals = !!internals;
				return html`<span>Test</span>`;
			});

			TestElement.define('internals-test');

			await customElements.whenDefined('internals-test');

			const el = document.createElement('internals-test');
			document.body.appendChild(el);

			// Wait for element to be connected
			await new Promise((resolve) => setTimeout(resolve, 100));

			return hasInternals;
		});

		expect(result).toBe(true);
	});

	test('root points to shadow root when using shadow DOM', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			let rootType = '';

			const TestElement = customElement(
				({ root }) => {
					rootType = root instanceof ShadowRoot ? 'shadowroot' : 'element';
					return html`<span>Test</span>`;
				},
				{
					shadowRootOptions: { mode: 'open' },
				},
			);

			TestElement.define('root-shadow-test');

			await customElements.whenDefined('root-shadow-test');

			const el = document.createElement('root-shadow-test');
			document.body.appendChild(el);

			// Wait for element to be connected
			await new Promise((resolve) => setTimeout(resolve, 100));

			return rootType;
		});

		expect(result).toBe('shadowroot');
	});

	test('root points to element when not using shadow DOM', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			let rootType = '';

			const TestElement = customElement(
				({ root }) => {
					rootType = root instanceof HTMLElement ? 'element' : 'other';
					return html`<span>Test</span>`;
				},
				{
					attachShadow: false,
				},
			);

			TestElement.define('root-element-test');

			await customElements.whenDefined('root-element-test');

			const el = document.createElement('root-element-test');
			document.body.appendChild(el);

			// Wait for element to be connected
			await new Promise((resolve) => setTimeout(resolve, 100));

			return rootType;
		});

		expect(result).toBe('element');
	});
};
