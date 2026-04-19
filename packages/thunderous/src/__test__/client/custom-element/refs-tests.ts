import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const refsTests = () => {
	test('refs provide access to elements with ref attribute', async ({ page }) => {
		await setup(page, async ({ customElement, html }) => {
			const TestElement = customElement(
				({ refs, connectedCallback: cb }) => {
					cb(() => {
						const refResult = refs.myButton;
						// Store on window for retrieval
						(window as unknown as { refTagName: string | undefined }).refTagName = refResult?.tagName;
					});
					return html`<button ref="myButton">Click me</button>`;
				},
				{
					shadowRootOptions: { mode: 'open' },
				},
			);

			TestElement.define('refs-test');

			await customElements.whenDefined('refs-test');

			const el = document.createElement('refs-test');
			document.body.appendChild(el);
		});

		await page.waitForTimeout(300);

		const result = await page.evaluate(() => {
			return (window as unknown as { refTagName: string | undefined }).refTagName;
		});

		expect(result).toBe('BUTTON');
	});
};
