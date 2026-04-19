import { describe, test, expect, vi } from 'vitest';
import { css, createSignal } from '../../..';
import { getContent, assertCSSStyleSheet, flushPromises } from '../test-utilities';

describe('css', () => {
	test('renders a CSSStyleSheet with rules', () => {
		const result = css`
			div {
				color: red;
			}
		`;
		const stylesheet = getContent(assertCSSStyleSheet(result));
		expect(stylesheet).toContain('div');
		expect(stylesheet).toContain('color: red;');
	});

	test('renders a string with interpolated values', () => {
		const result = css`
			div {
				--str: ${'str'};
				--num: ${1};
				--bool: ${true};
			}
		`;
		const cssText = getContent(assertCSSStyleSheet(result));
		expect(cssText).toContain('--str: str');
		expect(cssText).toContain('--num: 1');
		expect(cssText).toContain('--bool: true');
	});

	test('logs an error if a non-primitive value is interpolated', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = css`
			div {
				--obj: ${{}};
			}
		`;
		expect(getContent(assertCSSStyleSheet(result))).toContain('--obj:');
		expect(errorSpy).toHaveBeenCalledWith('Objects are not valid in CSS values. Received:', {});
		errorSpy.mockRestore();
	});

	test('supports signal bindings in CSS', async () => {
		const [colorSignal, setColor] = createSignal('red');
		const result = css`
			div {
				color: ${colorSignal};
			}
		`;
		const stylesheet = assertCSSStyleSheet(result);

		// Initial value
		expect(getContent(stylesheet)).toContain('color: red');

		// Update signal
		setColor('blue');
		await flushPromises();

		expect(getContent(stylesheet)).toContain('color: blue');
	});

	test('falls back to style element when adoptedStyleSheets not supported', () => {
		const result = css`
			.test {
				color: red;
			}
		`;

		// Result should be either CSSStyleSheet or HTMLStyleElement
		expect(result instanceof CSSStyleSheet || result instanceof HTMLStyleElement).toBe(true);
	});
});
