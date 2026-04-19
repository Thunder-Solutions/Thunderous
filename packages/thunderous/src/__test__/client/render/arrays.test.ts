import { describe, test, expect } from 'vitest';
import { html } from '../../..';
import { getContent, assertDocumentFragment } from '../test-utilities';

describe('arrays', () => {
	describe('Array<primitive>', () => {
		test('renders a DocumentFragment with an interpolated Array<string>', () => {
			const result = html`<div>${['Hello', ' ', 'world', '!']}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>Hello world!</div>');
		});

		test('renders a DocumentFragment with an interpolated Array<number>', () => {
			const result = html`<div>${[1, 2, 3]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>123</div>');
		});

		test('renders a DocumentFragment with an interpolated Array<boolean>', () => {
			const result = html`<div>${[true, false, true]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>truefalsetrue</div>');
		});

		test('renders a DocumentFragment with an interpolated Array<null>', () => {
			const result = html`<div>${[null, 'middle', null]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>middle</div>');
		});

		test('renders a DocumentFragment with an interpolated Array<undefined>', () => {
			const result = html`<div>${[undefined, 'middle', undefined]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>middle</div>');
		});

		test('renders a DocumentFragment with an interpolated Array<symbol>', () => {
			const result = html`<div>${[Symbol('a'), Symbol('b')]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>Symbol(a)Symbol(b)</div>');
		});

		test('renders a DocumentFragment with an interpolated Array<bigint>', () => {
			const result = html`<div>${[1n, 2n, 3n]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>123</div>');
		});

		test('renders a DocumentFragment with an interpolated Array<primitive> (mixed types)', () => {
			const result = html`<div>${['str', 42, true, null, undefined, Symbol('sym'), 123n]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div>str42trueSymbol(sym)123</div>');
		});

		test('renders a DocumentFragment with an interpolated [] (empty array)', () => {
			const result = html`<div>${[]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div></div>');
		});
	});

	describe('Array<DocumentFragment>', () => {
		test('renders a DocumentFragment with an interpolated Array<DocumentFragment>', () => {
			const child1 = html`<span>Hello</span>`;
			const child2 = html`<span>world</span>`;
			const result = html`<div>${[child1, child2]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div><span>Hello</span><span>world</span></div>');
		});

		test('renders a DocumentFragment with an interpolated Array<DocumentFragment> containing multiple children each', () => {
			const child1 = html`<span>A</span><span>B</span>`;
			const child2 = html`<span>C</span><span>D</span>`;
			const result = html`<div>${[child1, child2]}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toBe('<div><span>A</span><span>B</span><span>C</span><span>D</span></div>');
		});
	});
});
