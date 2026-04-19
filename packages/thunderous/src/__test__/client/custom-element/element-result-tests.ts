import { describe, test, expect } from 'vitest';
import { customElement, html } from '../../..';

describe('ElementResult methods', () => {
	test('define() registers a custom element with the given tag name', async () => {
		const TestElement = customElement(() => html`<span>Hello</span>`, {
			shadowRootOptions: { mode: 'open' },
		});
		TestElement.define('test-define-element');

		await customElements.whenDefined('test-define-element');

		const el = document.createElement('test-define-element');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(document.querySelector('test-define-element')).toBeTruthy();
		expect(el.shadowRoot?.textContent).toBe('Hello');

		// Cleanup
		el.remove();
	});

	test('define() returns the ElementResult for chaining', async () => {
		const TestElement = customElement(() => html`<span>Chained</span>`, {
			shadowRootOptions: { mode: 'open' },
		});
		const result = TestElement.define('chain-define-test');

		// Verify the returned object has the expected methods
		expect(typeof result.define).toBe('function');
		expect(typeof result.register).toBe('function');
		expect(typeof result.eject).toBe('function');

		await customElements.whenDefined('chain-define-test');

		const el = document.createElement('chain-define-test');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(document.querySelector('chain-define-test')?.shadowRoot?.textContent).toBe('Chained');

		// Cleanup
		el.remove();
	});

	test('define() skips already-defined elements with warning', async () => {
		const TestElement = customElement(() => html`<span>First</span>`, {
			shadowRootOptions: { mode: 'open' },
		});
		TestElement.define('duplicate-define-test');

		// Try to define again with same tag name
		const SecondElement = customElement(() => html`<span>Second</span>`, {
			shadowRootOptions: { mode: 'open' },
		});
		SecondElement.define('duplicate-define-test');

		await customElements.whenDefined('duplicate-define-test');

		const el = document.createElement('duplicate-define-test');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Should still have the first definition
		expect(document.querySelector('duplicate-define-test')).toBeTruthy();
		expect(el.shadowRoot?.textContent).toBe('First');

		// Cleanup
		el.remove();
	});

	test('eject() returns the underlying CustomElement class', () => {
		const TestElement = customElement(() => html`<span>Ejected</span>`);
		const CustomElementClass = TestElement.eject();

		expect(typeof CustomElementClass).toBe('function');
		expect(CustomElementClass.prototype instanceof HTMLElement).toBe(true);
	});
});
