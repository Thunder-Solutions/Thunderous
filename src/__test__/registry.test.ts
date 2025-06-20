import { describe, it, type Mock } from 'node:test';
import assert from 'assert';
import { createRegistry } from '../registry';
import { customElement } from '../custom-element';
import { html } from '../render';
import { NOOP } from '../utilities';

await describe('createRegistry', async () => {
	await it('creates a global registry', () => {
		const registry = createRegistry();
		assert.ok(registry);
		assert.strictEqual(registry.scoped, false);
	});
	await it('creates a scoped registry', () => {
		const registry = createRegistry({ scoped: true });
		assert.ok(registry);
		assert.strictEqual(registry.scoped, true);
	});
	await it('defines a custom element', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		assert.doesNotThrow(() => registry.define('my-element', MyElement));
	});
	await it('warns about duplicate custom elements', (testContext) => {
		testContext.mock.method(console, 'warn', NOOP);
		const warnMock = (console.warn as Mock<typeof console.warn>).mock;
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		const MyElement2 = customElement(() => html`<div></div>`);
		registry.define('my-element', MyElement);
		registry.define('my-element', MyElement2);
		assert.strictEqual(warnMock.callCount(), 1);
		assert.strictEqual(
			warnMock.calls[0].arguments[0],
			'Custom element tag name "MY-ELEMENT" was already defined. Skipping...',
		);
		registry.define('my-element-2', MyElement);
		assert.strictEqual(warnMock.callCount(), 2);
		assert.strictEqual(warnMock.calls[1].arguments[0], 'MY-ELEMENT-2 was already defined. Skipping...');
	});
	await it('gets the tag name of a custom element', () => {
		const registry = createRegistry();
		const tagName = 'my-element';
		const MyElement = customElement(() => html`<div></div>`);
		registry.define(tagName, MyElement);
		const result = registry.getTagName(MyElement);
		assert.strictEqual(result, tagName.toUpperCase());
	});
	await it('gets all tag names defined in the registry', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		const MyElement2 = customElement(() => html`<div></div>`);
		registry.define('my-element', MyElement);
		registry.define('my-element-2', MyElement2);
		const result = registry.getAllTagNames();
		assert.deepStrictEqual(result, ['MY-ELEMENT', 'MY-ELEMENT-2']);
	});
	await it('throws an error if ejected on the server', () => {
		const registry = createRegistry();
		const MyElement = customElement(() => html`<div></div>`);
		registry.define('my-element', MyElement);
		assert.throws(() => registry.eject(), { message: 'Cannot eject a registry on the server.' });
	});
});
