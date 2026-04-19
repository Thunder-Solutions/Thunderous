import { describe, test, expect } from 'vitest';
import { customElement, derived, html } from '../../..';

describe('Getter helper', () => {
	test('getter creates a signal getter from a function', async () => {
		const TestElement = customElement(
			({ getter: getHelper }) => {
				let counter = 0;
				const getCounter = getHelper(() => ++counter);

				// Use derived to make it reactive in template
				const display = derived(() => `Count: ${getCounter()}`);
				return html`<span class="display">${display}</span>`;
			},
			{
				shadowRootOptions: { mode: 'open' },
			},
		);

		TestElement.define('getter-helper-test');

		await customElements.whenDefined('getter-helper-test');

		const el = document.createElement('getter-helper-test');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(el.shadowRoot?.textContent).toBe('Count: 1');

		// Cleanup
		el.remove();
	});
});

describe('customCallback helper', () => {
	test('returns a callback string for event binding', async () => {
		let callbackExecuted = false;

		const TestElement = customElement(({ customCallback }) => {
			const clickHandler = customCallback(() => {
				callbackExecuted = true;
			});
			// The callback string should be a valid JS expression
			expect(typeof clickHandler).toBe('string');
			expect(clickHandler).toContain('__customCallbackFns');
			return html`<span>Test</span>`;
		});

		TestElement.define('custom-callback-test');

		await customElements.whenDefined('custom-callback-test');

		const el = document.createElement('custom-callback-test');
		document.body.appendChild(el);

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Verify callbackExecuted is still false (callback is just registered, not executed)
		expect(callbackExecuted).toBe(false);

		// Cleanup
		el.remove();
	});
});
