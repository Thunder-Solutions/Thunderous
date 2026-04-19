import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const stylesheetTests = () => {
	test('adoptStyleSheet with CSSStyleSheet adds styles to shadow root', async ({ page }) => {
		await setup(page, async ({ customElement, html, css }) => {
			const TestElement = customElement(
				({ adoptStyleSheet }) => {
					const styles = css`
						:host {
							display: block;
						}
						.test {
							color: red;
						}
					`;
					adoptStyleSheet(styles);
					return html`<span class="test">Styled</span>`;
				},
				{
					shadowRootOptions: { mode: 'open' },
				},
			);

			TestElement.define('adopt-stylesheet-test');

			await customElements.whenDefined('adopt-stylesheet-test');

			const el = document.createElement('adopt-stylesheet-test');
			document.body.appendChild(el);
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('adopt-stylesheet-test');
			const shadow = el?.shadowRoot;
			const adoptedSheets = shadow?.adoptedStyleSheets;
			return {
				sheetCount: adoptedSheets?.length ?? 0,
				hasCSSRules: adoptedSheets && adoptedSheets.length > 0 && adoptedSheets[0].cssRules.length > 0,
			};
		});

		expect(result.sheetCount).toBeGreaterThan(0);
		expect(result.hasCSSRules).toBe(true);
	});
};
