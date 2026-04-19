import { describe, test, expect } from 'vitest';
import { html } from '../../..';
import { getContent, assertDocumentFragment } from '../test-utilities';

describe('primitives', () => {
	test('renders a DocumentFragment', () => {
		const result = html`<div><span>Hello</span><span>World</span></div>`;
		const content = getContent(assertDocumentFragment(result));
		expect(content).toBe('<div><span>Hello</span><span>World</span></div>');
	});

	test('renders a DocumentFragment with an SVG element', () => {
		const result = html`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>`;
		const content = getContent(assertDocumentFragment(result));
		expect(content).toBe('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"></circle></svg>');
	});

	test('renders a DocumentFragment with an interpolated string', () => {
		const result = html`<div>${'Hello, world!'}</div>`;
		const content = getContent(result);
		expect(content).toBe('<div>Hello, world!</div>');
	});

	test('renders a DocumentFragment with an interpolated number', () => {
		const result = html`<div>${42}</div>`;
		const content = getContent(result);
		expect(content).toBe('<div>42</div>');
	});

	test('renders a DocumentFragment with an interpolated boolean', () => {
		const result = html`<div>${true}</div>`;
		const content = getContent(result);
		expect(content).toBe('<div>true</div>');
	});

	test('renders a DocumentFragment with an interpolated null', () => {
		const result = html`<div>${null}</div>`;
		const content = getContent(result);
		expect(content).toBe('<div></div>');
	});

	test('renders a DocumentFragment with an interpolated undefined', () => {
		const result = html`<div>${undefined}</div>`;
		const content = getContent(result);
		expect(content).toBe('<div></div>');
	});

	test('renders a DocumentFragment with an interpolated symbol', () => {
		const result = html`<div>${Symbol('test')}</div>`;
		const content = getContent(result);
		expect(content).toBe('<div>Symbol(test)</div>');
	});

	test('renders a DocumentFragment with an interpolated bigint', () => {
		const result = html`<div>${123n}</div>`;
		const content = getContent(result);
		expect(content).toBe('<div>123</div>');
	});
});
