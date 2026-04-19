import { describe, test, expect } from 'vitest';
import { customElement, html } from '../../..';

describe('attributeChangedCallback', () => {
	test('all registered callbacks fire when attributes change', async () => {
		const callbacks: string[] = [];

		const TestElement = customElement(({ attributeChangedCallback }) => {
			// Register multiple callbacks
			attributeChangedCallback((name, oldVal, newVal) => {
				callbacks.push(`cb1:${name}:${oldVal}:${newVal}`);
			});
			attributeChangedCallback((name, oldVal, newVal) => {
				callbacks.push(`cb2:${name}:${oldVal}:${newVal}`);
			});
			return html`<span>Test</span>`;
		});

		TestElement.define('multi-attr-changed-test');

		await customElements.whenDefined('multi-attr-changed-test');

		const el = document.createElement('multi-attr-changed-test');
		document.body.appendChild(el);

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Change an attribute
		el.setAttribute('data-test', 'value1');

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Change it again
		el.setAttribute('data-test', 'value2');

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Both callbacks should have fired for each change
		expect(callbacks.length).toBeGreaterThanOrEqual(2);
		expect(callbacks.some((c) => c.startsWith('cb1:'))).toBe(true);
		expect(callbacks.some((c) => c.startsWith('cb2:'))).toBe(true);

		// Cleanup
		el.remove();
	});
});
