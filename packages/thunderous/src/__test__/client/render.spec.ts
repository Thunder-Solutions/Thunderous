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
	test.describe('html`${value}` where value is a primitive', () => {
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

	test.describe('html`${value}` where value is a DocumentFragment', () => {
		test('renders a DocumentFragment with an interpolated DocumentFragment', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${html`<span>Hello</span><span>World</span>`}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello</span><span>World</span></div>');
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('html`${value}` where value is an Array<primitive>', () => {
		test('renders a DocumentFragment with a nested Array<string>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const result = html`<div>${['Hello', ' ', 'world', '!']}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Hello world!</div>');
		});
	});

	test.describe('html`${value}` where value is an Array<DocumentFragment>', () => {
		test('renders a DocumentFragment with a nested Array<DocumentFragment>', async ({ page }) => {
			const content = await setup(page, async ({ html, getContent, assertDocumentFragment }) => {
				const child1 = html`<span>Hello</span>`;
				const child2 = html`<span>world</span>`;
				const result = html`<div>${[child1, child2]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello</span><span>world</span></div>');
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('html`${value}` where value is a Signal<primitive>', () => {
		test('renders a DocumentFragment with an interpolated Signal<string>', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal] = createSignal('Hello, world!');
				const result = html`<div>${signal}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Hello, world!</div>');
		});
		test('renders a DocumentFragment with an interpolated Signal<number>', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal] = createSignal(42);
				const result = html`<div>${signal}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>42</div>');
		});
		test('renders a DocumentFragment with multiple signals', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal1] = createSignal('Hello,');
				const [signal2] = createSignal('world!');
				const result = html`<div>${signal1} ${signal2}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Hello, world!!</div>');
		});
		test('renders a DocumentFragment with a Signal<string> that updates', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal, setSignal] = createSignal('Hello, world!');
				const result = html`<div>${signal}</div>`;
				setSignal('Hello, updated!');
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Hello, updated!</div>');
		});
	});

	test.describe('html`${value}` where value is a Signal<DocumentFragment>', () => {
		test('renders a DocumentFragment with a Signal<DocumentFragment>', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal] = createSignal(html`<span>Hello, world!</span>`);
				const result = html`<div>${signal}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello, world!</span></div>');
		});

		test('renders a DocumentFragment with a Signal<DocumentFragment> that updates', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal, setSignal] = createSignal(html`<span>Hello, world!</span>`);
				const result = html`<div>${signal}</div>`;
				setSignal(html`<span>Hello, updated!</span>`);
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello, updated!</span></div>');
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('html`${value}` where value is a Signal<Array<primitive>>', () => {
		test('renders a DocumentFragment with a Signal<Array<string>>', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal] = createSignal(['Hello', ' ', 'world', '!']);
				const result = html`<div>${signal}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Hello world!</div>');
		});
	});

	test.describe('html`${value}` where value is a Signal<Array<DocumentFragment>>', () => {
		test('renders a DocumentFragment with a Signal<Array<DocumentFragment>>', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const child1 = html`<span>Hello</span>`;
				const child2 = html`<span>world</span>`;
				const [signal] = createSignal([child1, child2]);
				const result = html`<div>${signal}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello</span><span>world</span></div>');
		});
	});

	// type primitive = string | number | bigint | boolean | symbol | null | undefined;
	test.describe('html`${value}` where value is an Array<Signal<primitive>>', () => {
		test('renders a DocumentFragment with an Array<Signal<string>>', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal1] = createSignal('Hello');
				const [signal2] = createSignal('world');
				const result = html`<div>${[signal1, signal2]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div>Helloworld</div>');
		});
	});

	test.describe('html`${value}` where value is an Array<Signal<DocumentFragment>>', () => {
		test('renders a DocumentFragment with an Array<Signal<DocumentFragment>>', async ({ page }) => {
			const content = await setup(page, async ({ html, createSignal, getContent, assertDocumentFragment }) => {
				const [signal1] = createSignal(html`<span>Hello</span>`);
				const [signal2] = createSignal(html`<span>world</span>`);
				const result = html`<div>${[signal1, signal2]}</div>`;
				return getContent(assertDocumentFragment(result));
			});
			expect(content).toBe('<div><span>Hello</span><span>world</span></div>');
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
