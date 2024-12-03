import {
	clientOnlyCallback,
	getServerRenderArgs,
	insertTemplates,
	onServerDefine,
	serverCss,
	serverDefine,
	serverDefineFns,
	wrapTemplate,
} from '../server-side';
import { mock, test } from 'node:test';
import assert from 'assert';
import { createRegistry } from '../registry';
import { DEFAULT_RENDER_OPTIONS } from '../constants';
import { type ServerRenderOptions } from '../types';
import { NOOP } from '../utilities';
import { customElement } from '../custom-element';
import { html } from '../render';

const stripWhitespace = (template: string) => template.trim().replace(/\s\s+/g, ' ');

await test('getServerRenderArgs', async () => {
	await test('client-only properties throw on the server', () => {
		const args = getServerRenderArgs('my-element-1');
		assert.throws(() => args.elementRef.children, {
			message: 'The `elementRef` property is not available on the server.',
		});
		assert.throws(() => args.root.children, { message: 'The `root` property is not available on the server.' });
		assert.throws(() => args.internals.ariaChecked, {
			message: 'The `internals` property is not available on the server.',
		});
	});
	await test('customCallback returns a placeholder on the server', () => {
		const args = getServerRenderArgs('my-element-2');
		assert.strictEqual(args.customCallback(NOOP), '{{callback:unavailable-on-server}}');
	});
	await test('adoptStyleSheet tracks CSS strings on the server', () => {
		const args = getServerRenderArgs('my-element-3');

		// build the expected result
		const cssStr = ':host { color: red; }';
		const expectedServerCss = new Map<string, string[]>();
		expectedServerCss.set('my-element-3', [cssStr]);

		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet(':host { color: red; }');
		assert.deepStrictEqual(serverCss, expectedServerCss);
	});
	await test('adoptStyleSheet tracks CSS strings on the server, with registries', () => {
		const registry = createRegistry();
		const args = getServerRenderArgs('my-element-4', registry);

		// build the expected result
		const cssStr1 = ':host { color: blue; }';
		const expectedServerCss = new Map<string, string[]>();
		expectedServerCss.set('my-element-4', [cssStr1]);

		// @ts-expect-error // this will be a string on the server.
		args.adoptStyleSheet(cssStr1);
		assert.deepStrictEqual(registry.__serverCss, expectedServerCss);
	});
});

await test('wrapTemplate', async () => {
	await test('wraps the render result in a template tag', () => {
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

		assert.strictEqual(template, expectedTemplate);
	});
	await test('wraps the render result in a template tag with CSS', () => {
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

		assert.strictEqual(template, expectedTemplate);
	});
	await test('wraps the render result in a template tag without shadow root', () => {
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

		assert.strictEqual(template, expectedTemplate);
	});
});

await test('insertTemplates', async () => {
	await test('inserts the template into the input string', () => {
		const inputString = /* html */ `<my-element-7></my-element-7>`;
		const template = /* html */ `<div>Hello, world!</div>`;

		const result = stripWhitespace(insertTemplates('my-element-7', template, inputString));

		const expectedResult = stripWhitespace(/* html */ `
			<my-element-7><div>Hello, world!</div></my-element-7>
		`);

		assert.strictEqual(result, expectedResult);
	});
	await test('inserts the template into the input string, parsing attribute references', () => {
		const inputString = /* html */ `<my-element-8 test="Hello, world!"></my-element-8>`;
		const template = /* html */ `<div>{{attr:test}}</div>`;

		const result = stripWhitespace(insertTemplates('my-element-8', template, inputString));

		const expectedResult = stripWhitespace(/* html */ `
			<my-element-8 test="Hello, world!"><div>Hello, world!</div></my-element-8>
		`);

		assert.strictEqual(result, expectedResult);
	});
});

await test('onServerDefine', async () => {
	await test('adds the function to the set', () => {
		const fn = NOOP;
		onServerDefine(fn);
		assert.strictEqual(serverDefineFns.size, 1);
		assert.strictEqual(serverDefineFns.has(fn), true);
		serverDefineFns.clear();
	});
});

await test('serverDefine', async () => {
	await test('calls the serverDefineFns with the result of the serverRender', () => {
		const fn = mock.fn((tagName: string, template: string) => {
			assert.strictEqual(tagName, 'my-element-9');
			assert.strictEqual(template, 'Hello, world!');
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

		assert.strictEqual(fn.mock.calls.length, 1);
		assert.strictEqual(fn.mock.calls[0].arguments[0], 'my-element-9');

		serverDefineFns.clear();
	});
	await test('sets the server render options on the parent registry', () => {
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

		assert.strictEqual(parentRegistry.__serverRenderOpts.size, 1);
		assert.deepStrictEqual(parentRegistry.__serverRenderOpts, expectedServerRenderOpts);
	});
	await test('correctly renders scoped registries', () => {
		const scopedRegistry = createRegistry({ scoped: true });

		onServerDefine((tagName, template) => {
			assert.strictEqual(tagName, 'my-element-12');
			assert.strictEqual(template, '<my-element-11>inner</my-element-11>');
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

await test('clientOnlyCallback', async () => {
	await test('direct function call does nothing on the server', () => {
		let runCount = 0;
		clientOnlyCallback(() => {
			runCount++;
		});
		assert.strictEqual(runCount, 0);
	});
});
