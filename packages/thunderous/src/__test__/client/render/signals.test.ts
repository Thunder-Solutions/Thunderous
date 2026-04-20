import { describe, test, expect } from 'vitest';
import { html, createSignal } from '../../..';
import { getContent, getContentWithoutComments, assertDocumentFragment, flushPromises } from '../test-utilities';

type primitive = string | number | bigint | boolean | symbol | null | undefined;

describe('signals', () => {
	describe('Signal<primitive>', () => {
		test('renders a DocumentFragment with a Signal<string>', () => {
			const [signal] = createSignal('Hello, world!');
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>Hello, world!</div>');
		});

		test('renders a DocumentFragment with a Signal<number>', () => {
			const [signal] = createSignal(42);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>42</div>');
		});

		test('renders a DocumentFragment with a Signal<boolean>', () => {
			const [signal] = createSignal(true);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>true</div>');
		});

		test('renders a DocumentFragment with a Signal<null>', () => {
			const [signal] = createSignal(null);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div></div>');
		});

		test('renders a DocumentFragment with a Signal<undefined>', () => {
			const [signal] = createSignal(undefined);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div></div>');
		});

		test('renders a DocumentFragment with a Signal<bigint>', () => {
			const [signal] = createSignal(123n);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>123</div>');
		});

		test('updates a DocumentFragment when a Signal<string> changes', async () => {
			const [signal, setSignal] = createSignal('Hello, world!');
			const result = html`<div>${signal}</div>`;
			setSignal('Hello, updated!');
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>Hello, updated!</div>');
		});

		test('toggles between Signal<string> and Signal<null | undefined>', async () => {
			const [signal, setSignal] = createSignal<string | null | undefined>('test');
			const frag = html`<div>${signal}</div>`;
			const actuals: string[] = [];
			const expects: string[] = [];
			const setAndExpect = (value: string | null | undefined, expected: string) => {
				setSignal(value);
				actuals.push(frag.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			// string
			setAndExpect('test', 'test');
			setAndExpect(null, '');
			setAndExpect('test', 'test');
			setAndExpect(undefined, '');
			setAndExpect('test', 'test');

			// number
			const [signal2, setSignal2] = createSignal<number | null | undefined>(42);
			const frag2 = html`<div>${signal2}</div>`;
			const setAndExpect2 = (value: number | null | undefined, expected: string) => {
				setSignal2(value);
				actuals.push(frag2.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			setAndExpect2(42, '42');
			setAndExpect2(null, '');
			setAndExpect2(42, '42');
			setAndExpect2(undefined, '');
			setAndExpect2(42, '42');

			// boolean
			const [signal3, setSignal3] = createSignal<boolean | null | undefined>(true);
			const frag3 = html`<div>${signal3}</div>`;
			const setAndExpect3 = (value: boolean | null | undefined, expected: string) => {
				setSignal3(value);
				actuals.push(frag3.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			setAndExpect3(true, 'true');
			setAndExpect3(null, '');
			setAndExpect3(true, 'true');
			setAndExpect3(undefined, '');
			setAndExpect3(true, 'true');

			// bigint
			const [signal4, setSignal4] = createSignal<bigint | null | undefined>(123n);
			const frag4 = html`<div>${signal4}</div>`;
			const setAndExpect4 = (value: bigint | null | undefined, expected: string) => {
				setSignal4(value);
				actuals.push(frag4.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			setAndExpect4(123n, '123');
			setAndExpect4(null, '');
			setAndExpect4(123n, '123');
			setAndExpect4(undefined, '');
			setAndExpect4(123n, '123');

			// symbol
			const [signal5, setSignal5] = createSignal<symbol | null | undefined>(Symbol('test'));
			const frag5 = html`<div>${signal5}</div>`;
			const setAndExpect5 = (value: symbol | null | undefined, expected: string) => {
				setSignal5(value);
				actuals.push(frag5.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			setAndExpect5(Symbol('test'), 'Symbol(test)');
			setAndExpect5(null, '');
			setAndExpect5(Symbol('test'), 'Symbol(test)');
			setAndExpect5(undefined, '');
			setAndExpect5(Symbol('test'), 'Symbol(test)');

			expect(actuals).toEqual(expects);
		});

		test('inserts comment anchors for signal binding', () => {
			const [signal] = createSignal('test');
			const result = html`<div>${signal}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toMatch(/<div><!--[a-f0-9-]+:start-->test<!--[a-f0-9-]+:end--><\/div>/);
		});
	});

	describe('Signal<DocumentFragment>', () => {
		test('renders a DocumentFragment with a Signal<DocumentFragment>', () => {
			const [signal] = createSignal(html`<span>Hello, world!</span>`);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div><span>Hello, world!</span></div>');
		});

		test('renders a DocumentFragment with a Signal<DocumentFragment> that updates', () => {
			const [signal, setSignal] = createSignal(html`<span>Hello, world!</span>`);
			const result = html`<div>${signal}</div>`;
			setSignal(html`<span>Hello, updated!</span>`);
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div><span>Hello, updated!</span></div>');
		});

		test('renders a DocumentFragment with a Signal<DocumentFragment> that updates to a different structure', () => {
			const [signal, setSignal] = createSignal(html`<span>Initial</span>`);
			const result = html`<div>${signal}</div>`;
			// prettier-ignore
			setSignal(html`<p>Paragraph</p><span>Final</span>`);
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div><p>Paragraph</p><span>Final</span></div>');
		});

		test('inserts comment anchors for DocumentFragment signal binding', () => {
			const [signal] = createSignal(html`<span>test</span>`);
			const result = html`<div>${signal}</div>`;
			const content = getContent(assertDocumentFragment(result));
			expect(content).toMatch(/<div><!--[a-f0-9-]+:start-->.*?<!--[a-f0-9-]+:end--><\/div>/);
		});

		test('toggles between Signal<DocumentFragment> and Signal<null | undefined>', () => {
			const [signal, setSignal] = createSignal<DocumentFragment | null | undefined>(html`<div>test</div>`);
			const frag = html`<div>${signal}</div>`;
			const actuals: string[] = [];
			const expects: string[] = [];
			const setAndExpect = (value: DocumentFragment | null | undefined, expected: string) => {
				setSignal(value);
				actuals.push(frag.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			// DocumentFragment toggle
			setAndExpect(null, '');
			setAndExpect(html`<div>test</div>`, 'test');
			setAndExpect(undefined, '');
			setAndExpect(html`<div>test</div>`, 'test');

			expect(actuals).toEqual(expects);
		});
	});

	describe('Signal<Array<primitive>>', () => {
		test('renders a DocumentFragment with a Signal<Array<string>>', () => {
			const [signal] = createSignal(['Hello', ' ', 'world', '!']);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>Hello world!</div>');
		});

		test('renders a DocumentFragment with a Signal<Array<number>>', () => {
			const [signal] = createSignal([1, 2, 3]);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>123</div>');
		});

		test('renders a DocumentFragment with a Signal<Array<boolean>>', () => {
			const [signal] = createSignal([true, false]);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>truefalse</div>');
		});

		test('renders a DocumentFragment with a Signal<Array<primitive>> that updates', () => {
			const [signal, setSignal] = createSignal(['A', 'B']);
			const result = html`<div>${signal}</div>`;
			setSignal(['X', 'Y', 'Z']);
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div>XYZ</div>');
		});

		test('toggles between Signal<Array<primitive>> and Signal<null | undefined>', () => {
			const [signal, setSignal] = createSignal<primitive[] | null | undefined>(['a', 'b']);
			const frag = html`<div>${signal}</div>`;
			const actuals: string[] = [];
			const expects: string[] = [];
			const setAndExpect = (value: primitive[] | null | undefined, expected: string) => {
				setSignal(value);
				actuals.push(frag.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			setAndExpect(null, '');
			setAndExpect(['a', 'b'], 'ab');
			setAndExpect(undefined, '');
			setAndExpect(['a', 'b'], 'ab');

			expect(actuals).toEqual(expects);
		});
	});

	describe('Signal<Array<DocumentFragment>>', () => {
		test('renders a DocumentFragment with a Signal<Array<DocumentFragment>>', () => {
			const child1 = html`<span>Hello</span>`;
			const child2 = html`<span>world</span>`;
			const [signal] = createSignal([child1, child2]);
			const result = html`<div>${signal}</div>`;
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div><span key="0">Hello</span><span key="1">world</span></div>');
		});

		test('renders a DocumentFragment with a Signal<Array<DocumentFragment>> that updates', () => {
			// Use explicit unique keys so each update produces a fresh element
			// (persistence only reuses elements when the key matches across renders)
			const child1 = html`<span key="a">Initial</span>`;
			const [signal, setSignal] = createSignal([child1]);
			const result = html`<div>${signal}</div>`;
			const child2 = html`<span key="b">Updated</span>`;
			const child3 = html`<span key="c">Final</span>`;
			setSignal([child2, child3]);
			const content = getContentWithoutComments(assertDocumentFragment(result));
			expect(content).toBe('<div><span key="b">Updated</span><span key="c">Final</span></div>');
		});

		test('toggles between Signal<Array<DocumentFragment>> and Signal<null | undefined>', async () => {
			const child = html`<span>test</span>`;
			const [signal, setSignal] = createSignal<Array<DocumentFragment> | null | undefined>([child]);
			const frag = html`<div>${signal}</div>`;
			const actuals: string[] = [];
			const expects: string[] = [];
			const setAndExpect = async (value: Array<DocumentFragment> | null | undefined, expected: string) => {
				setSignal(value);
				await flushPromises();
				actuals.push(frag.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			setAndExpect(null, '');
			setAndExpect([html`<span>test</span>`], 'test');
			setAndExpect(undefined, '');
			setAndExpect([html`<span>test</span>`], 'test');

			expect(actuals).toEqual(expects);
		});
	});

	describe('type switching', () => {
		test('toggles between Signal<primitive> and Signal<DocumentFragment>', async () => {
			const [signal, setSignal] = createSignal<DocumentFragment | primitive>(html`<span>frag</span>`);
			const frag = html`<div>${signal}</div>`;
			const actuals: string[] = [];
			const expects: string[] = [];
			const setAndExpect = async (value: DocumentFragment | primitive, expected: string) => {
				setSignal(value);
				await flushPromises();
				actuals.push(frag.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			// primitive <-> DocumentFragment
			await setAndExpect(html`<span>frag</span>`, 'frag');
			await setAndExpect('text', 'text');
			await setAndExpect(html`<span>frag</span>`, 'frag');
			await setAndExpect('text', 'text');

			expect(actuals).toEqual(expects);
		});

		test('toggles between Signal<primitive> and Signal<Array<DocumentFragment>>', async () => {
			const [signal, setSignal] = createSignal<DocumentFragment | Array<DocumentFragment> | primitive>(
				html`<span>frag</span>`,
			);
			const frag = html`<div>${signal}</div>`;
			const actuals: string[] = [];
			const expects: string[] = [];
			const setAndExpect = async (value: DocumentFragment | Array<DocumentFragment> | primitive, expected: string) => {
				setSignal(value);
				await flushPromises();
				actuals.push(frag.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			// primitive <-> DocumentFragment
			await setAndExpect(html`<span>frag</span>`, 'frag');
			await setAndExpect('text', 'text');
			await setAndExpect(html`<span>frag</span>`, 'frag');
			await setAndExpect('text', 'text');

			// primitive <-> Array<DocumentFragment>
			await setAndExpect([html`<span>hello</span>`, html`<span>world</span>`], 'helloworld');
			await setAndExpect('text', 'text');
			await setAndExpect([html`<span>hello</span>`, html`<span>world</span>`], 'helloworld');
			await setAndExpect('text', 'text');

			expect(actuals).toEqual(expects);
		});

		test('toggles between Signal<Array<primitive>> and Signal<Array<DocumentFragment>>', async () => {
			const [signal, setSignal] = createSignal<Array<primitive> | Array<DocumentFragment>>(['test']);
			const frag = html`<div>${signal}</div>`;
			const actuals: string[] = [];
			const expects: string[] = [];
			const setAndExpect = async (value: Array<primitive> | Array<DocumentFragment>, expected: string) => {
				setSignal(value);
				await flushPromises();
				actuals.push(frag.querySelector('div')?.textContent ?? '');
				expects.push(expected);
			};

			// Array<primitive> <-> Array<DocumentFragment>
			await setAndExpect(['hello', 'world'], 'helloworld');
			await setAndExpect([html`<span>frag</span>`], 'frag');
			await setAndExpect(['hello', 'world'], 'helloworld');
			await setAndExpect([html`<span>frag</span>`], 'frag');

			expect(actuals).toEqual(expects);
		});
	});
});
