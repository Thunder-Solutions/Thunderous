import { describe, test, expect } from 'vitest';
import { customElement, derived, html } from '../../..';

/**
 * Tests for attribute signals when attributes are set before element upgrade/connection.
 *
 * When elements are created programmatically (createElement + setAttribute + append),
 * the attributes are set BEFORE the custom element constructor runs and BEFORE
 * connectedCallback starts the MutationObserver. This tests that attrSignals
 * correctly reflect the actual DOM attribute values in that scenario.
 */

describe('Attribute signals', () => {
	test('signal reflects attribute value set before element connects', async () => {
		// Component that simply displays its attribute value
		const TestElement = customElement(
			({ attrSignals }) => {
				const [message] = attrSignals.message;
				// Use derived to make the template reactive
				const output = derived(() => message() ?? 'NO_VALUE');
				return html`<span class="output">${output}</span>`;
			},
			{ shadowRootOptions: { mode: 'open' } },
		);

		TestElement.define('attr-test-element');

		// Create element programmatically (like CSR cloning does)
		const el = document.createElement('attr-test-element');
		el.setAttribute('message', 'hello world');

		// Append to DOM (triggers upgrade + connectedCallback)
		document.body.appendChild(el);

		// Wait for element to be connected and rendered
		await new Promise((resolve) => setTimeout(resolve, 300));

		// Verify the signal correctly reflected the pre-set attribute
		const shadow = el.shadowRoot;

		expect(el.getAttribute('message')).toBe('hello world');
		expect(shadow?.textContent?.trim()).toBe('hello world');
		expect(shadow?.textContent?.includes('hello world')).toBe(true);

		// Cleanup
		el.remove();
	});

	test('signal reflects attribute value when element is replaced (simulated CSR)', async () => {
		const TestElement = customElement(
			({ attrSignals }) => {
				const [value] = attrSignals.value;
				const display = derived(() => value() ?? 'NO_VALUE');
				return html`<span class="display">${display}</span>`;
			},
			{ shadowRootOptions: { mode: 'open' } },
		);

		TestElement.define('csr-test-element');

		// Initial render with container
		const container = document.createElement('div');
		container.id = 'test-container';
		container.innerHTML = '<csr-test-element value="first"></csr-test-element>';
		document.body.appendChild(container);

		// Wait for initial render
		await new Promise((resolve) => setTimeout(resolve, 300));

		const initialEl = container.querySelector('csr-test-element');
		expect(initialEl?.getAttribute('value')).toBe('first');
		expect(initialEl?.shadowRoot?.textContent?.trim()).toBe('first');

		// Simulate CSR-style replacement (element created programmatically, then swapped in)
		const newEl = document.createElement('csr-test-element');
		newEl.setAttribute('value', 'replaced');

		// Replace (simulates what CSR navigation does)
		container.replaceChildren(newEl);

		// Wait for replacement to render
		await new Promise((resolve) => setTimeout(resolve, 300));

		// Verify the replaced element correctly reads its pre-set attribute
		const replacedEl = container.querySelector('csr-test-element');
		expect(replacedEl?.getAttribute('value')).toBe('replaced');
		expect(replacedEl?.shadowRoot?.textContent?.trim()).toBe('replaced');

		// Cleanup
		container.remove();
	});

	test('attrSignals setter reflects changes back to the element attribute', async () => {
		let captured: ((value: string) => void) | undefined;
		const TestElement = customElement(
			({ attrSignals }) => {
				const [value, setValue] = attrSignals.mirrored;
				captured = setValue;
				return html`<span class="display">${value}</span>`;
			},
			{ shadowRootOptions: { mode: 'open' } },
		);

		TestElement.define('attr-signal-setter-test');
		await customElements.whenDefined('attr-signal-setter-test');

		const el = document.createElement('attr-signal-setter-test');
		document.body.appendChild(el);
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Invoke the setter returned by the attrSignals proxy – this should set the attribute on the element.
		captured?.('mirrored-value');
		await new Promise((resolve) => setTimeout(resolve, 50));

		expect(el.getAttribute('mirrored')).toBe('mirrored-value');
		el.remove();
	});

	test('multiple attributes set before connection all resolve correctly', async () => {
		const MultiAttr = customElement(
			({ attrSignals }) => {
				const [a] = attrSignals['attr-a'];
				const [b] = attrSignals['attr-b'];
				const [c] = attrSignals['attr-c'];
				const outA = derived(() => a() ?? 'NO_A');
				const outB = derived(() => b() ?? 'NO_B');
				const outC = derived(() => c() ?? 'NO_C');
				return html`<span class="a">${outA}</span><span class="b">${outB}</span><span class="c">${outC}</span>`;
			},
			{ shadowRootOptions: { mode: 'open' } },
		);

		MultiAttr.define('multi-attr-test');

		// Create and set multiple attributes before connecting
		const el = document.createElement('multi-attr-test');
		el.setAttribute('attr-a', 'alpha');
		el.setAttribute('attr-b', 'beta');
		el.setAttribute('attr-c', 'gamma');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 300));

		const shadow = el.shadowRoot;
		expect(shadow?.querySelector('.a')?.textContent).toBe('alpha');
		expect(shadow?.querySelector('.b')?.textContent).toBe('beta');
		expect(shadow?.querySelector('.c')?.textContent).toBe('gamma');

		// Cleanup
		el.remove();
	});
});
