import { describe, test, expect } from 'vitest';
import { createRegistry } from '../../../registry';
import { customElement } from '../../../custom-element';
import { html } from '../../../render';

describe('chainable', () => {
	test('define method is chainable on client', async () => {
		const registry = createRegistry();
		const MyElement1 = customElement(() => html`<span>Test 1</span>`);
		const MyElement2 = customElement(() => html`<span>Test 2</span>`);

		const result = registry.define('chain-test-1', MyElement1).define('chain-test-2', MyElement2);

		expect(result).toBe(registry);

		await customElements.whenDefined('chain-test-1');
		await customElements.whenDefined('chain-test-2');
		expect(customElements.get('chain-test-1')).toBeTruthy();
		expect(customElements.get('chain-test-2')).toBeTruthy();
	});
});
