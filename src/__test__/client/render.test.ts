import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:5555');
	await page.addScriptTag({
		url: 'src/test.ts',
		type: 'module',
	});
});

test.describe('html', () => {
	test('renders a DocumentFragment with children', async ({ page }) => {
		const content = await page.evaluate(async () => {
			const { html } = window.Thunderous;
			const { getContent, assertDocumentFragment } = window.TestUtils;
			const result = html`<div><span>Hello</span><span>World</span></div>`;
			return getContent(assertDocumentFragment(result));
		});
		expect(content).toBe('<div><span>Hello</span><span>World</span></div>');
	});

	test('renders a string with interpolated values', async ({ page }) => {
		const content = await page.evaluate(async () => {
			const { html } = window.Thunderous;
			const { getContent } = window.TestUtils;
			const result = html`<div>${'Hello, world!'} ${1} ${true}</div>`;
			return getContent(result);
		});
		expect(content).toBe('<div>Hello, world! 1 true</div>');
	});
});

test.describe('css', () => {
	test('renders a CSSStyleSheet with rules', async ({ page }) => {
		const stylesheet = await page.evaluate(async () => {
			const { css } = window.Thunderous;
			const { assertCSSStyleSheet, getContent } = window.TestUtils;
			const result = assertCSSStyleSheet(css`
				div {
					color: red;
				}
			`);
			return getContent(result);
		});
		expect(stylesheet).toContain('div');
		expect(stylesheet).toContain('color: red;');
	});

	test('renders a string with interpolated values', async ({ page }) => {
		const cssText = await page.evaluate(async () => {
			const { css } = window.Thunderous;
			const { assertCSSStyleSheet, getContent } = window.TestUtils;
			return getContent(
				assertCSSStyleSheet(css`
					div {
						--str: ${'str'};
						--num: ${1};
						--bool: ${true};
					}
				`),
			);
		});
		expect(cssText).toContain('--str: str');
		expect(cssText).toContain('--num: 1');
		expect(cssText).toContain('--bool: true');
	});

	test('logs an error if a non-primitive value is interpolated', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { css } = window.Thunderous;
			const { assertCSSStyleSheet, getContent } = window.TestUtils;
			return getContent(
				assertCSSStyleSheet(css`
					div {
						--obj: ${{}};
					}
				`),
			);
		});
		expect(result).toContain('--obj:');
	});
});
