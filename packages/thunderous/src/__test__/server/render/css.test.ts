import { describe, it, expect, vi } from 'vitest';
import { css } from '../../../render';
import { NOOP } from '../../../utilities';

describe('css', () => {
	it('renders a simple string', () => {
		// prettier-ignore
		const result = css`div { color: red; }`;
		expect(result).toBe('div { color: red; }');
	});

	it('renders a string with interpolated values', () => {
		// prettier-ignore
		const result = css`div { --str: ${'str'}; --num: ${1}; --bool: ${true}; }`;
		expect(result).toBe('div { --str: str; --num: 1; --bool: true; }');
	});

	it('logs an error if a non-primitive value is interpolated', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(NOOP);
		const obj = {};
		// prettier-ignore
		const result = css`div { --obj: ${obj}; }`;
		expect(result).toBe('div { --obj: ; }');
		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenNthCalledWith(1, 'Objects are not valid in CSS values. Received:', obj);
	});

	it('renders a string with signals', () => {
		const mockGetter = () => 'red';
		// prettier-ignore
		const result = css`div { color: ${mockGetter}; }`;
		expect(result).toBe('div { color: red; }');
	});
});
