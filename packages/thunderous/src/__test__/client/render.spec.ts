import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('http://localhost:5555');
	await page.addScriptTag({
		url: 'src/test.ts',
		type: 'module',
	});
});

type SetupArgs = typeof window.Thunderous & typeof window.TestUtils;
type SetupFn = ((args: SetupArgs) => Promise<void>) | ((args: SetupArgs) => void);
type primitive = string | number | bigint | boolean | symbol | null | undefined;

const setup = (page: Page, fn: SetupFn) =>
	page.evaluate((fnString) => {
		// eslint-disable-next-line @typescript-eslint/no-implied-eval
		const fn = new Function('return (' + fnString + ')')();
		return fn({ ...window.Thunderous, ...window.TestUtils });
	}, fn.toString());

test.describe('html', () => {
	test('renders a DocumentFragment', async ({ page }) => {
		const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
			const result = html`<div><span>Hello</span><span>World</span></div>`;
			return getContent(assertDocumentFragment(result));
		});
		expect(content).toBe('<div><span>Hello</span><span>World</span></div>');
	});

	test('renders a DocumentFragment with an SVG element', async ({ page }) => {
		const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
			const result = html`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>`;
			return getContent(assertDocumentFragment(result));
		});
		expect(content).toBe('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"></circle></svg>');
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('<primitive>', () => {
		test('renders a DocumentFragment with an interpolated string', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent }) => {
				const result = html`<div>${'Hello, world!'}</div>`;
				return getContent(result);
			});
			expect(content).toBe('<div>Hello, world!</div>');
		});
		test('renders a DocumentFragment with an interpolated number', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent }) => {
				const result = html`<div>${42}</div>`;
				return getContent(result);
			});
			expect(content).toBe('<div>42</div>');
		});
		test('renders a DocumentFragment with an interpolated boolean', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent }) => {
				const result = html`<div>${true}</div>`;
				return getContent(result);
			});
			expect(content).toBe('<div>true</div>');
		});
		test('renders a DocumentFragment with an interpolated null', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent }) => {
				const result = html`<div>${null}</div>`;
				return getContent(result);
			});
			expect(content).toBe('<div></div>');
		});
		test('renders a DocumentFragment with an interpolated undefined', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent }) => {
				const result = html`<div>${undefined}</div>`;
				return getContent(result);
			});
			expect(content).toBe('<div></div>');
		});
		test('renders a DocumentFragment with an interpolated symbol', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent }) => {
				const result = html`<div>${Symbol('test')}</div>`;
				return getContent(result);
			});
			expect(content).toBe('<div>Symbol(test)</div>');
		});
		test('renders a DocumentFragment with an interpolated bigint', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent }) => {
				const result = html`<div>${123n}</div>`;
				return getContent(result);
			});
			expect(content).toBe('<div>123</div>');
		});
	});

	test.describe('<DocumentFragment>`', () => {
		test('renders a DocumentFragment with an interpolated DocumentFragment', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${html`<span>Hello</span><span>World</span>`}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello</span><span>World</span></div>');
		});
		test('renders a DocumentFragment with an interpolated DocumentFragment containing SVG', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${html`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>`}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"></circle></svg></div>');
		});
		test('renders multiple interpolated DocumentFragments', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${html`<span>1</span>`}${html`<span>2</span>`}${html`<span>3</span>`}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>1</span><span>2</span><span>3</span></div>');
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('<Array<primitive>>`', () => {
		test('renders a DocumentFragment with an interpolated Array<string>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${['Hello', ' ', 'world', '!']}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Hello world!</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<number>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${[1, 2, 3]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>123</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<boolean>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${[true, false, true]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>truefalsetrue</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<null>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${[null, 'middle', null]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>middle</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<undefined>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${[undefined, 'middle', undefined]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>middle</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<symbol>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${[Symbol('a'), Symbol('b')]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Symbol(a)Symbol(b)</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<bigint>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${[1n, 2n, 3n]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>123</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<primitive> (mixed types)', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${['str', 42, true, null, undefined, Symbol('sym'), 123n]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>str42trueSymbol(sym)123</div>');
		});
		test('renders a DocumentFragment with an interpolated [] (empty array)', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${[]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div></div>');
		});
	});

	test.describe('<Array<DocumentFragment>>`', () => {
		test('renders a DocumentFragment with an interpolated Array<DocumentFragment>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const child1 = html`<span>Hello</span>`;
				const child2 = html`<span>world</span>`;
				const result = html`<div>${[child1, child2]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello</span><span>world</span></div>');
		});
		test('renders a DocumentFragment with an interpolated Array<DocumentFragment> containing multiple children each', async ({
			page,
		}) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const child1 = html`<span>A</span><span>B</span>`;
				const child2 = html`<span>C</span><span>D</span>`;
				const result = html`<div>${[child1, child2]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>A</span><span>B</span><span>C</span><span>D</span></div>');
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('<Signal<primitive>>`', () => {
		test('renders a DocumentFragment with a Signal<string>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal('Hello, world!');
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>Hello, world!</div>');
		});
		test('renders a DocumentFragment with a Signal<number>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal(42);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>42</div>');
		});
		test('renders a DocumentFragment with a Signal<boolean>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal(true);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>true</div>');
		});
		test('renders a DocumentFragment with a Signal<null>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal<string | null>(null);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div></div>');
		});
		test('renders a DocumentFragment with a Signal<number> that updates', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal, setSignal] = createSignal(42);
					const result = html`<div>${signal}</div>`;
					setSignal(100);
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>100</div>');
		});
		test('renders a DocumentFragment with a Signal<boolean> that updates to null', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal, setSignal] = createSignal<boolean | null>(true);
					const result = html`<div>${signal}</div>`;
					setSignal(null);
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div></div>');
		});
		test('toggles between Signal<primitive> and Signal<null | undefined>', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal }) => {
				const [signal, setSignal] = createSignal<primitive>('test');
				const frag = html`<div>${signal}</div>`;
				const actuals: string[] = [];
				const expects: string[] = [];
				const setAndExpect = (value: primitive, expected: string) => {
					setSignal(value);
					actuals.push(frag.querySelector('div')?.textContent ?? '');
					expects.push(expected);
				};

				// string
				setAndExpect(null, '');
				setAndExpect('test', 'test');
				setAndExpect(undefined, '');
				setAndExpect('test', 'test');

				// number
				setAndExpect(42, '42');
				setAndExpect(null, '');
				setAndExpect(42, '42');
				setAndExpect(undefined, '');
				setAndExpect(42, '42');

				// boolean
				setAndExpect(true, 'true');
				setAndExpect(null, '');
				setAndExpect(true, 'true');
				setAndExpect(undefined, '');
				setAndExpect(true, 'true');

				// bigint
				setAndExpect(123n, '123');
				setAndExpect(null, '');
				setAndExpect(123n, '123');
				setAndExpect(undefined, '');
				setAndExpect(123n, '123');

				// symbol
				setAndExpect(Symbol('test'), 'Symbol(test)');
				setAndExpect(null, '');
				setAndExpect(Symbol('test'), 'Symbol(test)');
				setAndExpect(undefined, '');
				setAndExpect(Symbol('test'), 'Symbol(test)');

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
		test('inserts comment anchors for signal binding', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal] = createSignal('test');
				const result = html`<div>${signal}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toMatch(/<div><!--[a-f0-9-]+:start-->test<!--[a-f0-9-]+:end--><\/div>/);
		});
	});

	test.describe('<Signal<DocumentFragment>>`', () => {
		test('renders a DocumentFragment with a Signal<DocumentFragment>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal(html`<span>Hello, world!</span>`);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div><span>Hello, world!</span></div>');
		});
		test('renders a DocumentFragment with a Signal<DocumentFragment> that updates', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal, setSignal] = createSignal(html`<span>Hello, world!</span>`);
					const result = html`<div>${signal}</div>`;
					setSignal(html`<span>Hello, updated!</span>`);
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div><span>Hello, updated!</span></div>');
		});
		test('renders a DocumentFragment with a Signal<DocumentFragment> that updates to a different structure', async ({
			page,
		}) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal, setSignal] = createSignal(html`<span>Initial</span>`);
					const result = html`<div>${signal}</div>`;
					// prettier-ignore
					setSignal(html`<p>Paragraph</p><span>Final</span>`);
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div><p>Paragraph</p><span>Final</span></div>');
		});
		test('inserts comment anchors for DocumentFragment signal binding', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal] = createSignal(html`<span>test</span>`);
				const result = html`<div>${signal}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			// DocumentFragment signals create comment anchors - content is between them
			expect(content).toMatch(/<div><!--[a-f0-9-]+:start-->.*?<!--[a-f0-9-]+:end--><\/div>/);
		});
		test('toggles between Signal<DocumentFragment> and Signal<null | undefined>', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal }) => {
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

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('<Signal<Array<primitive>>`', () => {
		test('renders a DocumentFragment with a Signal<Array<string>>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal(['Hello', ' ', 'world', '!']);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>Hello world!</div>');
		});
		test('renders a DocumentFragment with a Signal<Array<number>>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal([1, 2, 3]);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>123</div>');
		});
		test('renders a DocumentFragment with a Signal<Array<boolean>>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal] = createSignal([true, false]);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>truefalse</div>');
		});
		test('renders a DocumentFragment with a Signal<Array<primitive>> that updates', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal, setSignal] = createSignal(['A', 'B']);
					const result = html`<div>${signal}</div>`;
					setSignal(['X', 'Y', 'Z']);
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>XYZ</div>');
		});
		test('toggles between Signal<Array<primitive>> and Signal<null | undefined>', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal }) => {
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

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
	});

	test.describe('<Signal<Array<DocumentFragment>>`', () => {
		test('renders a DocumentFragment with a Signal<Array<DocumentFragment>>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const child1 = html`<span>Hello</span>`;
					const child2 = html`<span>world</span>`;
					const [signal] = createSignal([child1, child2]);
					const result = html`<div>${signal}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div><span key="0">Hello</span><span key="1">world</span></div>');
		});
		test('renders a DocumentFragment with a Signal<Array<DocumentFragment>> that updates', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const child1 = html`<span>Initial</span>`;
					const [signal, setSignal] = createSignal([child1]);
					const result = html`<div>${signal}</div>`;
					const child2 = html`<span>Updated</span>`;
					setSignal([child2]);
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div><span key="0">Updated</span></div>');
		});
		test('toggles between Signal<Array<DocumentFragment>> and Signal<null | undefined>', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal }) => {
				const [signal, setSignal] = createSignal<DocumentFragment[] | null | undefined>([html`<span>a</span>`]);
				const frag = html`<div>${signal}</div>`;
				const actuals: string[] = [];
				const expects: string[] = [];
				const setAndExpect = (value: DocumentFragment[] | null | undefined, expected: string) => {
					setSignal(value);
					actuals.push(frag.querySelector('div')?.textContent ?? '');
					expects.push(expected);
				};

				setAndExpect(null, '');
				setAndExpect([html`<span>a</span>`], 'a');
				setAndExpect(undefined, '');
				setAndExpect([html`<span>a</span>`], 'a');

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('<Array<Signal<primitive>>`', () => {
		test('renders a DocumentFragment with an interpolated Array<Signal<string>>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal1] = createSignal('Hello');
					const [signal2] = createSignal('world');
					const result = html`<div>${[signal1, signal2]}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>Helloworld</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<Signal<number>>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal1] = createSignal(1);
					const [signal2] = createSignal(2);
					const result = html`<div>${[signal1, signal2]}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>12</div>');
		});
		test('renders a DocumentFragment with an interpolated Array<Signal<primitive>> where values update', async ({
			page,
		}) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal1, setSignal1] = createSignal('A');
					const [signal2, setSignal2] = createSignal('B');
					const result = html`<div>${[signal1, signal2]}</div>`;
					setSignal1('X');
					setSignal2('Y');
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div>XY</div>');
		});
		test('toggles between Signal<primitive> and Signal<null | undefined> in array', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal }) => {
				const [signal1, setSignal1] = createSignal<primitive>('a');
				const [signal2, setSignal2] = createSignal<primitive>('b');
				const frag = html`<div>${[signal1, signal2]}</div>`;
				const actuals: string[] = [];
				const expects: string[] = [];
				const setAndExpect = (setSignal: (v: primitive) => void, value: primitive, expected: string) => {
					setSignal(value);
					actuals.push(frag.querySelector('div')?.textContent ?? '');
					expects.push(expected);
				};

				setAndExpect(setSignal1, null, 'b');
				setAndExpect(setSignal1, 'a', 'ab');
				setAndExpect(setSignal1, undefined, 'b');
				setAndExpect(setSignal1, 'a', 'ab');
				setAndExpect(setSignal2, null, 'a');
				setAndExpect(setSignal2, 'b', 'ab');
				setAndExpect(setSignal2, undefined, 'a');
				setAndExpect(setSignal2, 'b', 'ab');

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
	});

	test.describe('<Array<Signal<DocumentFragment>>`', () => {
		test('renders a DocumentFragment with an interpolated Array<Signal<DocumentFragment>>', async ({ page }) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal1] = createSignal(html`<span>Hello</span>`);
					const [signal2] = createSignal(html`<span>world</span>`);
					const result = html`<div>${[signal1, signal2]}</div>`;
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div><span key="0">Hello</span><span key="1">world</span></div>');
		});
		test('renders a DocumentFragment with an interpolated Array<Signal<DocumentFragment>> where values update', async ({
			page,
		}) => {
			const content = await setup(
				page,
				async ({ html, createSignal, getContentWithoutComments, assertDocumentFragment }) => {
					const [signal1, setSignal1] = createSignal(html`<span>Initial</span>`);
					const [signal2, setSignal2] = createSignal(html`<span>State</span>`);
					const result = html`<div>${[signal1, signal2]}</div>`;
					setSignal1(html`<span>Updated</span>`);
					setSignal2(html`<span>Values</span>`);
					return getContentWithoutComments(assertDocumentFragment(result));
				},
			);
			expect(content).toBe('<div><span key="0">Updated</span><span key="1">Values</span></div>');
		});
		test('toggles between Signal<DocumentFragment> and Signal<null | undefined> in array', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal }) => {
				const [signal1, setSignal1] = createSignal<DocumentFragment | null | undefined>(html`<span>a</span>`);
				const [signal2, setSignal2] = createSignal<DocumentFragment | null | undefined>(html`<span>b</span>`);
				const frag = html`<div>${[signal1, signal2]}</div>`;
				const actuals: string[] = [];
				const expects: string[] = [];
				const setAndExpect = (
					setSignal: (v: DocumentFragment | null | undefined) => void,
					value: DocumentFragment | null | undefined,
					expected: string,
				) => {
					setSignal(value);
					actuals.push(frag.querySelector('div')?.textContent ?? '');
					expects.push(expected);
				};

				setAndExpect(setSignal1, null, 'b');
				setAndExpect(setSignal1, html`<span>a</span>`, 'ab');
				setAndExpect(setSignal1, undefined, 'b');
				setAndExpect(setSignal1, html`<span>a</span>`, 'ab');
				setAndExpect(setSignal2, null, 'a');
				setAndExpect(setSignal2, html`<span>b</span>`, 'ab');
				setAndExpect(setSignal2, undefined, 'a');
				setAndExpect(setSignal2, html`<span>b</span>`, 'ab');

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
	});
	test.describe('Mixed type toggles', () => {
		test('toggles between Signal<primitive> and Signal<Array<primitive>>', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal, flushPromises }) => {
				const [signal, setSignal] = createSignal<Array<primitive> | primitive>('test');
				const frag = html`<div>${signal}</div>`;
				const actuals: string[] = [];
				const expects: string[] = [];
				const setAndExpect = async (value: Array<primitive> | primitive, expected: string) => {
					setSignal(value);
					await flushPromises();
					actuals.push(frag.querySelector('div')?.textContent ?? '');
					expects.push(expected);
				};

				// primitive <-> Array<primitive>
				await setAndExpect(['hello', 'world'], 'helloworld');
				await setAndExpect('text', 'text');
				await setAndExpect(['hello', 'world'], 'helloworld');
				await setAndExpect('text', 'text');

				// All primitives are converted to Text() nodes, so we'll just
				// test the plain string condition to represent primitives.
				// Other primitives are already well-tested in other tests.

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
		test('toggles between Signal<primitive> and Signal<DocumentFragment | Array<DocumentFragment>', async ({
			page,
		}) => {
			const results = await setup(page, async ({ html, createSignal, flushPromises }) => {
				const [signal, setSignal] = createSignal<DocumentFragment | Array<DocumentFragment> | primitive>('test');
				const frag = html`<div>${signal}</div>`;
				const actuals: string[] = [];
				const expects: string[] = [];
				const setAndExpect = async (
					value: DocumentFragment | Array<DocumentFragment> | primitive,
					expected: string,
				) => {
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

				// All primitives are converted to Text() nodes, so we'll just
				// test the plain string condition to represent primitives.
				// Other primitives are already well-tested in other tests.

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
		test('toggles between Signal<Array<primitive>> and Signal<Array<DocumentFragment>>', async ({ page }) => {
			const results = await setup(page, async ({ html, createSignal, flushPromises }) => {
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

				// All primitives are converted to Text() nodes, so we'll just
				// test the plain string condition to represent primitives.
				// Other primitives are already well-tested in other tests.

				return { actuals, expects };
			});
			expect(results.actuals).toEqual(results.expects);
		});
	});
});

test.describe('css', () => {
	test('renders a CSSStyleSheet with rules', async ({ page }) => {
		const stylesheet = await setup(page, async ({ css, assertCSSStyleSheet, getContent }) => {
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
		const cssText = await setup(page, async ({ css, assertCSSStyleSheet, getContent }) => {
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
		const result = await setup(page, async ({ css, assertCSSStyleSheet, getContent }) => {
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
