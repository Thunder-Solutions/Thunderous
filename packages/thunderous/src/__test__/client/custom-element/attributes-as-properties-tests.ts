import { describe, test, expect } from 'vitest';
import { customElement, derived, html } from '../../..';

describe('Attributes as properties', () => {
	test('attributesAsProperties coerces string attributes to typed properties', async () => {
		type Props = { count: number };

		const CounterElement = customElement<Props>(
			({ propSignals }) => {
				const [count] = propSignals.count.init(0);
				const display = derived(() => `Count: ${count()}`);
				return html`<span class="display">${display}</span>`;
			},
			{
				attributesAsProperties: [['count', Number]],
				shadowRootOptions: { mode: 'open' },
			},
		);

		CounterElement.define('attr-as-prop-test');

		await customElements.whenDefined('attr-as-prop-test');

		const el = document.createElement('attr-as-prop-test');
		el.setAttribute('count', '42');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(el.shadowRoot?.textContent).toBe('Count: 42');

		// Cleanup
		el.remove();
	});

	test('kebab-case attributes convert to camelCase properties', async () => {
		type Props = { myValue: string };

		const TestElement = customElement<Props>(
			({ propSignals }) => {
				const [myValue] = propSignals.myValue.init('');
				const display = derived(() => myValue());
				return html`<span class="display">${display}</span>`;
			},
			{
				attributesAsProperties: [['my-value', String]],
				shadowRootOptions: { mode: 'open' },
			},
		);

		TestElement.define('kebab-case-test');

		await customElements.whenDefined('kebab-case-test');

		const el = document.createElement('kebab-case-test');
		el.setAttribute('my-value', 'test-value');
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(el.shadowRoot?.textContent).toBe('test-value');

		// Cleanup
		el.remove();
	});

	test('Boolean coercion works correctly', async () => {
		type Props = { active: boolean };

		const ToggleElement = customElement<Props>(
			({ propSignals }) => {
				const [active] = propSignals.active.init(false);
				const display = derived(() => (active() ? 'ON' : 'OFF'));
				return html`<span class="display">${display}</span>`;
			},
			{
				attributesAsProperties: [['active', Boolean]],
				shadowRootOptions: { mode: 'open' },
			},
		);

		ToggleElement.define('bool-coerce-test');

		await customElements.whenDefined('bool-coerce-test');

		const el = document.createElement('bool-coerce-test');
		el.setAttribute('active', ''); // Boolean attribute with empty value
		document.body.appendChild(el);

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(el.shadowRoot?.textContent).toBe('ON');

		// Cleanup
		el.remove();
	});
});
