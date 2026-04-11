import { test, expect, type Page } from '@playwright/test';

/**
 * Tests for attribute signals when attributes are set before element upgrade/connection.
 *
 * When elements are created programmatically (createElement + setAttribute + append),
 * the attributes are set BEFORE the custom element constructor runs and BEFORE
 * connectedCallback starts the MutationObserver. This tests that attrSignals
 * correctly reflect the actual DOM attribute values in that scenario.
 */

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:5555');
	await page.addScriptTag({
		url: 'src/test.ts',
		type: 'module',
	});
});

type SetupArgs = typeof window.Thunderous & typeof window.TestUtils;
type SetupFn = ((args: SetupArgs) => Promise<void>) | ((args: SetupArgs) => void);

const setup = (page: Page, fn: SetupFn) =>
	page.evaluate((fnString) => {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval
		const fn = new Function('return (' + fnString + ')')();
		return fn({ ...window.Thunderous, ...window.TestUtils });
	}, fn.toString());

test.describe('customElement', () => {
	test.describe('Attribute signals', () => {
		test('signal reflects attribute value set before element connects', async ({ page }) => {
			await setup(page, async ({ customElement, derived, html }) => {
				// Component that simply displays its attribute value
				const TestElement = customElement(
					({ attrSignals }) => {
						const [message] = attrSignals.message;
						// Use derived to make the template reactive
						const output = derived(() => message() ?? 'NO_VALUE');
						return html`<span class="output">${output}</span>`;
					},
					{ shadowRootOptions: { mode: 'open' } },
				);

				TestElement.define('attr-test-element');

				// Create element programmatically (like CSR cloning does)
				const el = document.createElement('attr-test-element');
				el.setAttribute('message', 'hello world');

				// Append to DOM (triggers upgrade + connectedCallback)
				document.body.appendChild(el);
			});

			await page.waitForTimeout(300);

			// Verify the signal correctly reflected the pre-set attribute
			const result = await page.evaluate(() => {
				type TestElementType = HTMLElement & {
					__attrSignals?: Record<string, [() => string | null, (v: string | null) => void]>;
				};
				const el = document.querySelector<TestElementType>('attr-test-element');
				const shadow = el?.shadowRoot;
				// Try to access signal directly via the component instance
				const signalValue = el?.__attrSignals?.message?.[0]?.();
				return {
					found: !!el,
					attr: el?.getAttribute('message'),
					hasShadow: !!shadow,
					signalValue: signalValue ?? 'NO_SIGNAL',
					output: shadow?.textContent?.trim() ?? 'NO_SHADOW',
					shadowHTML: shadow?.innerHTML?.substring(0, 100) ?? 'NO_SHADOW',
					correct: shadow?.textContent?.includes('hello world') ?? false,
				};
			});

			expect(result.found).toBe(true);
			expect(result.attr).toBe('hello world');
			expect(result.hasShadow).toBe(true);
			expect(result.correct, 'Signal should reflect attribute set before connection').toBe(true);
		});

		test('signal reflects attribute value when element is replaced (simulated CSR)', async ({ page }) => {
			await setup(page, async ({ customElement, derived, html }) => {
				const TestElement = customElement(
					({ attrSignals }) => {
						const [value] = attrSignals.value;
						const display = derived(() => value() ?? 'NO_VALUE');
						return html`<span class="display">${display}</span>`;
					},
					{ shadowRootOptions: { mode: 'open' } },
				);

				TestElement.define('csr-test-element');

				// Initial render with container
				const container = document.createElement('div');
				container.id = 'test-container';
				container.innerHTML = '<csr-test-element value="first"></csr-test-element>';
				document.body.appendChild(container);
			});

			await page.waitForTimeout(300);

			// Verify initial state
			const initial = await page.evaluate(() => {
				const el = document.querySelector('csr-test-element');
				return {
					found: !!el,
					attr: el?.getAttribute('value'),
					output: el?.shadowRoot?.textContent?.trim(),
				};
			});

			expect(initial.found).toBe(true);
			expect(initial.attr).toBe('first');
			expect(initial.output).toBe('first');

			// Simulate CSR-style replacement (element created programmatically, then swapped in)
			await page.evaluate(() => {
				const container = document.getElementById('test-container');
				if (!container) return;

				// Create new element programmatically (no HTML parser involved)
				const newEl = document.createElement('csr-test-element');
				newEl.setAttribute('value', 'replaced');

				// Replace (simulates what CSR navigation does)
				container.replaceChildren(newEl);
			});

			await page.waitForTimeout(300);

			// Verify the replaced element correctly reads its pre-set attribute
			const after = await page.evaluate(() => {
				const el = document.querySelector('csr-test-element');
				return {
					found: !!el,
					attr: el?.getAttribute('value'),
					output: el?.shadowRoot?.textContent?.trim(),
					correct: el?.shadowRoot?.textContent === 'replaced',
				};
			});

			expect(after.found).toBe(true);
			expect(after.attr).toBe('replaced');
			expect(after.output).toBe('replaced');
			expect(after.correct, 'Signal should reflect attribute on replaced element').toBe(true);
		});

		test('multiple attributes set before connection all resolve correctly', async ({ page }) => {
			await setup(page, async ({ customElement, derived, html }) => {
				const MultiAttr = customElement(
					({ attrSignals }) => {
						const [a] = attrSignals['attr-a'];
						const [b] = attrSignals['attr-b'];
						const [c] = attrSignals['attr-c'];
						const outA = derived(() => a() ?? 'NO_A');
						const outB = derived(() => b() ?? 'NO_B');
						const outC = derived(() => c() ?? 'NO_C');
						return html`<span class="a">${outA}</span><span class="b">${outB}</span><span class="c">${outC}</span>`;
					},
					{ shadowRootOptions: { mode: 'open' } },
				);

				MultiAttr.define('multi-attr-test');

				// Create and set multiple attributes before connecting
				const el = document.createElement('multi-attr-test');
				el.setAttribute('attr-a', 'alpha');
				el.setAttribute('attr-b', 'beta');
				el.setAttribute('attr-c', 'gamma');
				document.body.appendChild(el);
			});

			await page.waitForTimeout(300);

			const result = await page.evaluate(() => {
				const el = document.querySelector('multi-attr-test');
				const shadow = el?.shadowRoot;
				return {
					a: shadow?.querySelector('.a')?.textContent,
					b: shadow?.querySelector('.b')?.textContent,
					c: shadow?.querySelector('.c')?.textContent,
				};
			});

			expect(result.a).toBe('alpha');
			expect(result.b).toBe('beta');
			expect(result.c).toBe('gamma');
		});
	});
});
