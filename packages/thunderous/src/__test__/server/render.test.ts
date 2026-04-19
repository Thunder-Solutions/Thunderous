import { describe, it, expect, vi } from 'vitest';
import { html, css } from '../../render';
import { NOOP } from '../../utilities';

describe('html', () => {
	it('renders a simple string', () => {
		const result = html`<div></div>`;
		expect(result).toBe('<div></div>');
	});
	it('renders a string with interpolated values', () => {
		const result = html`<div>${'Hello, world!'} ${1} ${true}</div>`;
		expect(result).toBe('<div>Hello, world! 1 true</div>');
	});
	it('renders a string with nested templates', () => {
		const result = html`<div>${html`<span>Hello, world!</span>`}</div>`;
		expect(result).toBe('<div><span>Hello, world!</span></div>');
	});
	it('renders a joined string from arrays', () => {
		const result = html`<div>${['Hello', ' ', 'world']}</div>`;
		expect(result).toBe('<div>Hello world</div>');
	});
	it('renders a joined string from nested template arrays', () => {
		// prettier-ignore
		const result = html`<ul>${['1', '2', '3'].map((str) => html`<li>${str}</li>`)}</ul>`;
		expect(result).toBe('<ul><li>1</li><li>2</li><li>3</li></ul>');
	});
	it('renders a string with signals', () => {
		const mockGetter = () => 'Hello, world!';
		const result = html`<div>${mockGetter}</div>`;
		expect(result).toBe('<div>Hello, world!</div>');
	});
});

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
