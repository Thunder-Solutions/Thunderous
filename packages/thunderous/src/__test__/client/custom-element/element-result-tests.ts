import test, { expect } from '@playwright/test';
import { setup } from '../test-utilities';

export const elementResultTests = () => {
	test('define() registers a custom element with the given tag name', async ({ page }) => {
		await setup(page, async ({ customElement, html }) => {
			const TestElement = customElement(() => html`<span>Hello</span>`, {
				shadowRootOptions: { mode: 'open' },
			});
			TestElement.define('test-define-element');

			await customElements.whenDefined('test-define-element');

			const el = document.createElement('test-define-element');
			document.body.appendChild(el);
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('test-define-element');
			return {
				found: !!el,
				text: el?.shadowRoot?.textContent,
			};
		});

		expect(result.found).toBe(true);
		expect(result.text).toBe('Hello');
	});

	test('define() returns the ElementResult for chaining', async ({ page }) => {
		const setupResult = await setup(page, async ({ customElement, html }) => {
			const TestElement = customElement(() => html`<span>Chained</span>`, {
				shadowRootOptions: { mode: 'open' },
			});
			const result = TestElement.define('chain-define-test');

			// Verify the returned object has the expected methods
			const hasDefine = typeof result.define === 'function';
			const hasRegister = typeof result.register === 'function';
			const hasEject = typeof result.eject === 'function';

			await customElements.whenDefined('chain-define-test');

			const el = document.createElement('chain-define-test');
			document.body.appendChild(el);

			return { hasDefine, hasRegister, hasEject };
		});

		expect(setupResult.hasDefine).toBe(true);
		expect(setupResult.hasRegister).toBe(true);
		expect(setupResult.hasEject).toBe(true);

		await page.waitForTimeout(100);

		const textResult = await page.evaluate(() => {
			return document.querySelector('chain-define-test')?.shadowRoot?.textContent;
		});

		expect(textResult).toBe('Chained');
	});

	test('define() skips already-defined elements with warning', async ({ page }) => {
		await setup(page, async ({ customElement, html }) => {
			const TestElement = customElement(() => html`<span>First</span>`, {
				shadowRootOptions: { mode: 'open' },
			});
			TestElement.define('duplicate-define-test');

			// Try to define again with same tag name
			const SecondElement = customElement(() => html`<span>Second</span>`, {
				shadowRootOptions: { mode: 'open' },
			});
			SecondElement.define('duplicate-define-test');

			await customElements.whenDefined('duplicate-define-test');

			const el = document.createElement('duplicate-define-test');
			document.body.appendChild(el);
		});

		await page.waitForTimeout(100);

		const result = await page.evaluate(() => {
			const el = document.querySelector('duplicate-define-test');
			return {
				found: !!el,
				text: el?.shadowRoot?.textContent,
			};
		});

		// Should still have the first definition
		expect(result.found).toBe(true);
		expect(result.text).toBe('First');
	});

	test('eject() returns the underlying CustomElement class', async ({ page }) => {
		const result = await setup(page, async ({ customElement, html }) => {
			const TestElement = customElement(() => html`<span>Ejected</span>`);
			const CustomElementClass = TestElement.eject();

			return {
				isFunction: typeof CustomElementClass === 'function',
				extendsHTMLElement: CustomElementClass.prototype instanceof HTMLElement,
			};
		});

		expect(result.isFunction).toBe(true);
		expect(result.extendsHTMLElement).toBe(true);
	});
};
