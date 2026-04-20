import { describe, it, expect } from 'vitest';
import { html } from '../../../render';

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

	it('renders a string with a real signal getter (marked with getter: true)', () => {
		// Simulate a signal getter by tagging the function with `getter = true`.
		// This exercises the SIGNAL path in `processValue` on the server, which coerces the result to a string.
		const signalGetter = Object.assign(() => 'signal-value', { getter: true as const });
		const result = html`<div>${signalGetter}</div>`;
		expect(result).toBe('<div>signal-value</div>');
	});

	it('renders an array of values interpolated through a signal getter on the server', () => {
		// Signal getter whose value is an array; the server-side path maps each item through processValue and joins them.
		const signalGetter = Object.assign(() => ['a', 'b', 'c'], { getter: true as const });
		// prettier-ignore
		const result = html`<ul>${signalGetter}</ul>`;
		expect(result).toBe('<ul>abc</ul>');
	});
});
