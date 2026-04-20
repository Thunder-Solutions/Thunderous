import { describe, it, expect, vi } from 'vitest';
import {
	clientOnlyCallback,
	getServerRenderArgs,
	insertTemplates,
	onServerDefine,
	serverCss,
	serverDefine,
	serverDefineFns,
	wrapTemplate,
} from '../../server-side';
import { createRegistry } from '../../registry';
import { DEFAULT_RENDER_OPTIONS } from '../../constants';
import type { ServerRenderOptions } from '../../types';
import { NOOP } from '../../utilities';
import { customElement } from '../../custom-element';
import { html } from '../../render';

const stripWhitespace = (template: string) => template.trim().replace(/\s\s+/g, ' ');

describe('getServerRenderArgs', () => {
	it('throws on the server when accessing client-only properties', () => {
		const args = getServerRenderArgs('my-element-1');
		expect(() => args.elementRef.children).toThrow('The `elementRef` property is not available on the server.');
		expect(() => args.root.children).toThrow('The `root` property is not available on the server.');
		expect(() => args.internals.ariaChecked).toThrow('The `internals` property is not available on the server.');
	});
	it('returns nothing from customCallback on the server', () => {
		const args = getServerRenderArgs('my-element-2');
		expect(args.customCallback(NOOP)).toBe('');
	});
	it('tracks CSS strings on the server using adoptStyleSheet', () => {
		const args = getServerRenderArgs('my-element-3');

		// build the expected result
		const cssStr = ':host { color: red; }';
		const expectedServerCss = new Map<string, string[]>();
		expectedServerCss.set('my-element-3', [cssStr]);

		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet(':host { color: red; }');
		expect(serverCss).toEqual(expectedServerCss);
	});
	it('tracks CSS strings on the server with registries using adoptStyleSheet', () => {
		const registry = createRegistry();
		const args = getServerRenderArgs('my-element-4', registry);

		// build the expected result
		const cssStr1 = ':host { color: blue; }';
		const expectedServerCss = new Map<string, string[]>();
		expectedServerCss.set('my-element-4', [cssStr1]);

		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet(cssStr1);
		expect(registry.__serverCss).toEqual(expectedServerCss);
	});
});

describe('wrapTemplate - scoped registries', () => {
	it('uses the scoped registry when shadowRootOptions.registry is a RegistryResult', () => {
		const scopedRegistry = createRegistry({ scoped: true });
		scopedRegistry.__serverCss.set('my-scoped-element', [':host { color: orange; }']);

		const result = stripWhitespace(
			wrapTemplate({
				tagName: 'my-scoped-element',
				serverRender: () => 'scoped-body',
				options: {
					...DEFAULT_RENDER_OPTIONS,
					attachShadow: false,
					shadowRootOptions: { ...DEFAULT_RENDER_OPTIONS.shadowRootOptions, registry: scopedRegistry },
				},
			}),
		);

		// The scoped registry's CSS entry for this tag must be inlined, confirming the scopedRegistry branch ran.
		expect(result).toContain('<style>:host { color: orange; }</style>');
		expect(result).toContain('scoped-body');
	});
});

describe('wrapTemplate', () => {
	it('wraps the render result in a template tag', () => {
		const template = stripWhitespace(
			wrapTemplate({
				tagName: 'my-element-5',
				serverRender: () => 'Hello, world!',
				options: DEFAULT_RENDER_OPTIONS,
			}),
		);

		const expectedTemplate = stripWhitespace(/* html */ `
			<template
				shadowrootmode="closed"
				shadowrootdelegatesfocus="false"
				shadowrootclonable="false"
				shadowrootserializable="false"
			>
				Hello, world!
			</template>
		`);

		expect(template).toBe(expectedTemplate);
	});
	it('wraps the render result in a template tag with CSS', () => {
		const args = getServerRenderArgs('my-element-6');
		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet(':host { color: green; }');

		const template = stripWhitespace(
			wrapTemplate({
				tagName: 'my-element-6',
				serverRender: () => 'Hello, world!',
				options: DEFAULT_RENDER_OPTIONS,
			}),
		);

		const expectedTemplate = stripWhitespace(/* html */ `
			<template
				shadowrootmode="closed"
				shadowrootdelegatesfocus="false"
				shadowrootclonable="false"
				shadowrootserializable="false"
			>
				<style>:host { color: green; }</style>Hello, world!
			</template>
		`);

		expect(template).toBe(expectedTemplate);
	});
	it('wraps the render result in a template tag when shadow root is not attached', () => {
		const template = stripWhitespace(
			wrapTemplate({
				tagName: 'my-element-7',
				serverRender: () => 'Hello, world!',
				options: {
					...DEFAULT_RENDER_OPTIONS,
					attachShadow: false,
				},
			}),
		);

		const expectedTemplate = 'Hello, world!';

		expect(template).toBe(expectedTemplate);
	});
});

describe('insertTemplates', () => {
	it('inserts the template into the input string', () => {
		const inputString = /* html */ `<my-element-7></my-element-7>`;
		const template = /* html */ `<div>Hello, world!</div>`;

		const result = stripWhitespace(insertTemplates('my-element-7', template, inputString));

		const expectedResult = stripWhitespace(/* html */ `
			<my-element-7><div>Hello, world!</div></my-element-7>
		`);

		expect(result).toBe(expectedResult);
	});
	it('does NOT capture similar tags, only exact matches', () => {
		const inputString = /* html */ `<my-element-7-other></my-element-7-other>`;
		const template = /* html */ `<div>Hello, world!</div>`;

		const result = stripWhitespace(insertTemplates('my-element-7', template, inputString));

		const expectedResult = stripWhitespace(/* html */ `
			<my-element-7-other></my-element-7-other>
		`);

		expect(result).toBe(expectedResult);
	});
	it('inserts the template into the input string and parses attribute references', () => {
		const inputString = /* html */ `<my-element-8 test="Hello, world!"></my-element-8>`;
		const template = /* html */ `<div>{{attr:test}}</div>`;

		const result = stripWhitespace(insertTemplates('my-element-8', template, inputString));

		const expectedResult = stripWhitespace(/* html */ `
			<my-element-8 test="Hello, world!"><div>Hello, world!</div></my-element-8>
		`);

		expect(result).toBe(expectedResult);
	});

	it('handles boolean-style attributes (no "=value") without throwing', () => {
		// A solitary boolean attribute should fall through the `_value?.replace(...) ?? ''` binary-expression
		// branch where `_value` is undefined. The resulting attr value is the empty string.
		const inputString = /* html */ `<my-element-8b disabled></my-element-8b>`;
		const template = /* html */ `<div>[{{attr:disabled}}]</div>`;

		const result = stripWhitespace(insertTemplates('my-element-8b', template, inputString));

		// The attribute value resolves to the empty string, leaving `[]` in the rendered template.
		const expectedResult = stripWhitespace(/* html */ `
			<my-element-8b disabled><div>[]</div></my-element-8b>
		`);

		expect(result).toBe(expectedResult);
	});
});

describe('onServerDefine', () => {
	it('adds the function to the set', () => {
		const fn = NOOP;
		onServerDefine(fn);
		expect(serverDefineFns.size).toBe(1);
		expect(serverDefineFns.has(fn)).toBe(true);
		serverDefineFns.clear();
	});
});

describe('serverDefine', () => {
	it('calls the serverDefineFns with the result of serverRender', () => {
		const fn = vi.fn((tagName: string, template: string) => {
			expect(tagName).toBe('my-element-9');
			expect(template).toBe('Hello, world!');
		});
		onServerDefine(fn);

		serverDefine({
			tagName: 'my-element-9',
			serverRender: () => 'Hello, world!',
			options: {
				...DEFAULT_RENDER_OPTIONS,
				attachShadow: false,
			},
			elementResult: customElement(() => html`<div></div>`),
		});

		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenNthCalledWith(1, 'my-element-9', 'Hello, world!');

		serverDefineFns.clear();
	});
	it('sets the server render options on the parent registry', () => {
		const parentRegistry = createRegistry();

		const serverRender = () => 'Hello, world!';
		serverDefine({
			tagName: 'my-element-10',
			serverRender,
			options: DEFAULT_RENDER_OPTIONS,
			parentRegistry,
			elementResult: customElement(() => html`<div></div>`),
		});

		const expectedServerRenderOpts = new Map<string, ServerRenderOptions>([
			['my-element-10', { serverRender, ...DEFAULT_RENDER_OPTIONS }],
		]);

		expect(parentRegistry.__serverRenderOpts.size).toBe(1);
		expect(parentRegistry.__serverRenderOpts).toEqual(expectedServerRenderOpts);
	});
	it('renders scoped registries correctly', () => {
		const scopedRegistry = createRegistry({ scoped: true });

		onServerDefine((tagName, template) => {
			expect(tagName).toBe('my-element-12');
			expect(template).toBe('<my-element-11>inner</my-element-11>');
		});

		serverDefine({
			tagName: 'my-element-11',
			serverRender: () => 'inner',
			options: { ...DEFAULT_RENDER_OPTIONS, attachShadow: false },
			parentRegistry: scopedRegistry,
			elementResult: customElement(() => html`<div></div>`),
		});

		serverDefine({
			tagName: 'my-element-12',
			serverRender: () => '<my-element-11></my-element-11>',
			options: { ...DEFAULT_RENDER_OPTIONS, attachShadow: false },
			scopedRegistry,
			elementResult: customElement(() => html`<div></div>`),
		});

		serverDefineFns.clear();
	});
});

describe('clientOnlyCallback', () => {
	it('does nothing on the server when called directly', () => {
		let runCount = 0;
		clientOnlyCallback(() => {
			runCount++;
		});
		expect(runCount).toBe(0);
	});
});

describe('getServerRenderArgs additional coverage', () => {
	it('returns a getter function that wraps the provided function', () => {
		const args = getServerRenderArgs('my-element-getter');
		const mockFn = vi.fn(() => 'test-value');
		const getter = args.getter(mockFn);

		expect(getter.getter).toBe(true);
		expect(getter()).toBe('test-value');
		expect(mockFn).toHaveBeenCalled();
	});

	it('returns attrSignals proxy that creates signal placeholders', () => {
		const args = getServerRenderArgs('my-element-attrs');
		const attrSignal = args.attrSignals.testAttr;
		const [getter] = attrSignal;

		// The getter should return the placeholder string
		expect(getter()).toBe('{{attr:testAttr}}');
	});
});
