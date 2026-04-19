import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const getterHelperTests = () => {
	test('getter creates a signal getter from a function', async ({ page }) => {
		await setup(page, async ({ customElement, html, derived }) => {
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
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('getter-helper-test');
			return el?.shadowRoot?.textContent;
		});

		expect(result).toBe('Count: 1');
	});
};
