import { describe, test, expect } from 'vitest';
import { customElement, html, createRegistry } from '../../..';

describe('ElementResult register method', () => {
	test('register assigns registry to element', async () => {
		const registry = createRegistry();

		const TestElement = customElement(() => {
			return html`<span>Test</span>`;
		});

		// Register before define
		TestElement.register(registry);
		TestElement.define('register-test');

		await customElements.whenDefined('register-test');

		const el = document.createElement('register-test');
		expect(el).toBeTruthy();
	});
});
