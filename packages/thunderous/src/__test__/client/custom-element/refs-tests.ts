import { describe, test, expect } from 'vitest';
import { customElement, html } from '../../..';

describe('Refs', () => {
	test('refs provide access to elements with ref attribute', async () => {
		let refTagName: string | undefined;

		const TestElement = customElement(
			({ refs, connectedCallback: cb }) => {
				cb(() => {
					const refResult = refs.myButton;
					refTagName = refResult?.tagName;
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

		// Wait for connectedCallback
		await new Promise((resolve) => setTimeout(resolve, 300));

		expect(refTagName).toBe('BUTTON');

		// Cleanup
		el.remove();
	});
});
