import { describe, test, expect } from 'vitest';
import { customElement, css, html } from '../../..';

describe('Adopting stylesheets', () => {
	test('adoptStyleSheet with CSSStyleSheet adds styles to shadow root', async () => {
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

		// Wait for render
		await new Promise((resolve) => setTimeout(resolve, 100));

		const shadow = el.shadowRoot;
		const adoptedSheets = shadow?.adoptedStyleSheets;

		expect(adoptedSheets?.length ?? 0).toBeGreaterThan(0);
		expect(adoptedSheets && adoptedSheets.length > 0 && adoptedSheets[0].cssRules.length > 0).toBe(true);

		// Cleanup
		el.remove();
	});
});
