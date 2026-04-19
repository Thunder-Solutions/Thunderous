import { describe, test, expect } from 'vitest';
import { customElement, html } from '../../..';

describe('Element internals and root', () => {
	test('elementRef provides access to the custom element instance', async () => {
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

		expect(elementTagName).toBe('element-ref-test');

		// Cleanup
		el.remove();
	});

	test('internals provides ElementInternals', async () => {
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

		expect(hasInternals).toBe(true);

		// Cleanup
		el.remove();
	});

	test('root points to shadow root when using shadow DOM', async () => {
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

		expect(rootType).toBe('shadowroot');

		// Cleanup
		el.remove();
	});

	test('root points to element when not using shadow DOM', async () => {
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

		// Use innerHTML to avoid "newly constructed custom element must not have children" error
		const container = document.createElement('div');
		container.innerHTML = '<root-element-test></root-element-test>';
		document.body.appendChild(container);

		// Wait for element to be connected and upgraded
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(rootType).toBe('element');

		// Cleanup
		container.remove();
	});
});
