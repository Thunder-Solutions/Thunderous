import { describe, test, expect } from 'vitest';
import { customElement, html } from '../../..';

describe('Shadow DOM options', () => {
	test('shadowRootOptions.mode=open creates open shadow root', async () => {
		const TestElement = customElement(() => html`<span>Open Shadow</span>`, {
			shadowRootOptions: { mode: 'open' },
		});

		TestElement.define('shadow-open-test');

		await customElements.whenDefined('shadow-open-test');

		const el = document.createElement('shadow-open-test');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(el.shadowRoot).toBeTruthy();
		expect(el.shadowRoot?.textContent).toBe('Open Shadow');

		// Cleanup
		el.remove();
	});

	test('shadowRootOptions.mode=closed creates closed shadow root', async () => {
		const TestElement = customElement(() => html`<span>Closed Shadow</span>`, {
			shadowRootOptions: { mode: 'closed' },
		});

		TestElement.define('shadow-closed-test');

		await customElements.whenDefined('shadow-closed-test');

		const el = document.createElement('shadow-closed-test');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		// For closed shadow root, shadowRoot property is null from outside
		expect(el.shadowRoot).toBeNull();
		// Content is encapsulated in closed shadow root and not visible externally
		expect(el.textContent).toBe('');

		// Cleanup
		el.remove();
	});

	test('attachShadow=false renders to element instead of shadow root', async () => {
		const TestElement = customElement(() => html`<span class="light-dom-content">No Shadow</span>`, {
			attachShadow: false,
		});

		TestElement.define('no-shadow-test');

		// Wait for definition to register
		await customElements.whenDefined('no-shadow-test');

		// Create element via HTML parsing to ensure proper upgrade timing
		const container = document.createElement('div');
		container.innerHTML = '<no-shadow-test></no-shadow-test>';
		document.body.appendChild(container);

		const el = container.querySelector('no-shadow-test')!;

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 200));

		expect(el.shadowRoot).toBeNull();
		// Content is in light DOM - the element itself contains the content
		expect(el.textContent).toBe('No Shadow');

		// Cleanup
		container.remove();
	});
});
