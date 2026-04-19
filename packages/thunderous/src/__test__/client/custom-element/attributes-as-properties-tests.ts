import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const attributesAsPropertiesTests = () => {
	test('attributesAsProperties coerces string attributes to typed properties', async ({ page }) => {
		await setup(page, async ({ customElement, derived, html }) => {
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
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('attr-as-prop-test');
			return el?.shadowRoot?.textContent;
		});

		expect(result).toBe('Count: 42');
	});

	test('kebab-case attributes convert to camelCase properties', async ({ page }) => {
		await setup(page, async ({ customElement, derived, html }) => {
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
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('kebab-case-test');
			return el?.shadowRoot?.textContent;
		});

		expect(result).toBe('test-value');
	});

	test('Boolean coercion works correctly', async ({ page }) => {
		await setup(page, async ({ customElement, derived, html }) => {
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
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('bool-coerce-test');
			return el?.shadowRoot?.textContent;
		});

		expect(result).toBe('ON');
	});
};
