import { describe, test, expect, vi } from 'vitest';
import { customElement, html } from '../../..';

describe('Attribute changed callback', () => {
	test('attributeChangedCallback is called when attribute changes', async () => {
		const callbackSpy = vi.fn();

		const TestElement = customElement(
			({ attributeChangedCallback, attrSignals }) => {
				attributeChangedCallback(callbackSpy);
				const [getValue] = attrSignals.testAttr;

				return html`<span data-value="${getValue}">Test</span>`;
			},
			{ observedAttributes: ['test-attr'] },
		);

		TestElement.define('attr-callback-test');
		await customElements.whenDefined('attr-callback-test');

		const el = document.createElement('attr-callback-test');
		el.setAttribute('test-attr', 'initial');
		document.body.appendChild(el);

		// Wait for initial render
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Change the attribute to trigger the callback
		el.setAttribute('test-attr', 'changed');

		// Wait for the callback
		await new Promise((resolve) => setTimeout(resolve, 10));

		// The callback should have been called
		expect(callbackSpy).toHaveBeenCalled();

		// Cleanup
		el.remove();
	});
});
