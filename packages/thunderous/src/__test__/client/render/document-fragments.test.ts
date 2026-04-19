import { describe, test, expect } from 'vitest';
import { html } from '../../..';
import { getContent, assertDocumentFragment } from '../test-utilities';

describe('document fragments', () => {
	test('renders a DocumentFragment with an interpolated DocumentFragment', () => {
		const result = html`<div>${html`<span>Hello</span><span>World</span>`}</div>`;
		const content = getContent(assertDocumentFragment(result));
		expect(content).toBe('<div><span>Hello</span><span>World</span></div>');
	});

	test('renders a DocumentFragment with an interpolated DocumentFragment containing SVG', () => {
		const result = html`<div>${html`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>`}</div>`;
		const content = getContent(assertDocumentFragment(result));
		expect(content).toBe('<div><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"></circle></svg></div>');
	});

	test('renders multiple interpolated DocumentFragments', () => {
		const result = html`<div>${html`<span>1</span>`}${html`<span>2</span>`}${html`<span>3</span>`}</div>`;
		const content = getContent(assertDocumentFragment(result));
		expect(content).toBe('<div><span>1</span><span>2</span><span>3</span></div>');
	});
});
